from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import OTPRequest, OTPVerify, LoginResponse, User, UserCreate
from models.tenant import Tenant
from utils.helpers import generate_otp, create_access_token
from services.sms_service import send_otp as send_sms_otp, verify_otp as verify_sms_otp
from services.email_service import send_otp_email, send_welcome_email
from datetime import datetime, timedelta, timezone
import os
import random
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage (for fallback/mock mode only)
# When using Twilio/Resend, storage may not be needed
otp_storage = {}

def get_db():
    from server import db
    return db

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Send OTP via SMS (Twilio) or Email (Resend)
    Supports both delivery methods with automatic fallback to mock mode
    """
    try:
        # Validate that required contact info is provided
        if request.delivery_method == "sms" and not request.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number required for SMS delivery"
            )
        if request.delivery_method == "email" and not request.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address required for email delivery"
            )
        
        # Send OTP based on delivery method
        if request.delivery_method == "email":
            # Generate OTP for email (Resend doesn't manage OTP like Twilio Verify)
            otp = generate_otp(6)
            result = await send_otp_email(request.email, otp, "User")
            contact = request.email
            
            # Store OTP for verification (always needed for email)
            otp_storage[contact] = {
                "otp": otp,
                "delivery_method": "email",
                "expires_at": datetime.utcnow() + timedelta(minutes=5),
                "attempts": 0
            }
            
        else:  # SMS
            result = await send_sms_otp(request.phone)
            contact = request.phone
            
            # Store OTP if mock mode
            if result.get("mock"):
                otp_storage[contact] = {
                    "otp": result["otp"],
                    "delivery_method": "sms",
                    "expires_at": datetime.utcnow() + timedelta(minutes=5),
                    "attempts": 0
                }
        
        response = {
            "success": True,
            "message": result["message"],
            "delivery_method": request.delivery_method,
            "contact": contact
        }
        
        # Only include OTP in response for mock/development mode
        if result.get("mock") or request.delivery_method == "email":
            response["otp"] = result.get("otp") or otp_storage[contact]["otp"]
            response["note"] = f"OTP shown for testing only - not sent via {request.delivery_method.upper()}" if result.get("mock") else "Check your email for OTP"
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp(request: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Verify OTP and login/register user
    Supports both SMS (Twilio) and Email (Resend) verification
    """
    # Determine contact identifier (email or phone)
    contact = request.email if request.email else request.phone
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either phone or email required for verification"
        )
    
    # Try Twilio Verify for SMS (production mode)
    is_valid = False
    if request.phone:
        is_valid = await verify_sms_otp(request.phone, request.otp)
    
    # If not valid via Twilio or if email method, check local storage
    if not is_valid:
        stored_otp_data = otp_storage.get(contact)
        
        if not stored_otp_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP not found or expired. Please request a new OTP."
            )
        
        # Check expiry
        if datetime.utcnow() > stored_otp_data["expires_at"]:
            del otp_storage[contact]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP expired. Please request a new OTP."
            )
        
        # Verify OTP from storage
        if stored_otp_data["otp"] != request.otp:
            stored_otp_data["attempts"] += 1
            if stored_otp_data["attempts"] >= 3:
                del otp_storage[contact]
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many failed attempts. Please request a new OTP."
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        is_valid = True
    
    # OTP verified successfully
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # Clean up storage
    if contact in otp_storage:
        del otp_storage[contact]
    
    # Check if user exists (search by both phone and email)
    query = {"role": request.role}
    if request.phone:
        query["phone"] = request.phone
    elif request.email:
        query["email"] = request.email
    
    user_doc = await db.users.find_one(query, {"_id": 0})
    
    tenant_doc = None
    
    if not user_doc:
        # New user - create account
        if not request.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name required for new user registration"
            )
        
        # For customer role, no tenant_id needed
        tenant_id = None
        
        # If role is not customer/super_admin, we need tenant context
        # For MVP, we'll handle tenant assignment separately
        
        user_data = UserCreate(
            tenant_id=tenant_id,
            name=request.name,
            phone=request.phone,
            role=request.role
        )
        
        user_obj = User(**user_data.model_dump())
        user_dict = user_obj.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        
        await db.users.insert_one(user_dict)
        user_doc = user_dict
    
    # Get tenant info if user has tenant_id
    if user_doc.get("tenant_id"):
        tenant_doc = await db.tenants.find_one({"id": user_doc["tenant_id"]}, {"_id": 0})
    
    # Create JWT token
    token_data = {
        "user_id": user_doc["id"],
        "phone": user_doc["phone"],
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id"),
        "store_id": user_doc.get("store_id")  # Include store_id for vendors
    }
    
    access_token = create_access_token(token_data)
    
    # Convert datetime fields for response
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    return LoginResponse(
        access_token=access_token,
        user=User(**user_doc),
        tenant=tenant_doc
    )

# Import auth dependency at the top
from middleware.auth import get_current_user as get_current_user_middleware

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user_middleware), db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Get current logged in user info
    """
    user_doc = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Convert datetime fields
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    return user_doc


from pydantic import BaseModel
from utils.helpers import verify_password, get_password_hash

class UsernamePasswordLogin(BaseModel):
    username: str
    password: str

@router.post("/login", response_model=LoginResponse)
async def login_with_password(request: UsernamePasswordLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Login with username and password (for Super Admin, Tenant Admin, Vendor Admin)
    """
    # Find user by email (using email as username)
    user_doc = await db.users.find_one({"email": request.username}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if user has password (admins only)
    if not user_doc.get("password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account uses OTP login"
        )
    
    # Verify password
    if not verify_password(request.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Get tenant info if user has tenant_id
    tenant_doc = None
    if user_doc.get("tenant_id"):
        tenant_doc = await db.tenants.find_one({"id": user_doc["tenant_id"]}, {"_id": 0})
    
    # Create JWT token
    token_data = {
        "user_id": user_doc["id"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id"),
        "store_id": user_doc.get("store_id")  # Include store_id for vendors
    }
    
    access_token = create_access_token(token_data)
    
    # Convert datetime fields
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    return LoginResponse(
        access_token=access_token,
        user=User(**user_doc),
        tenant=tenant_doc
    )


# ==================== EMAIL OTP LOGIN ====================

@router.post("/send-email-otp")
async def send_email_otp(
    request: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Send OTP to email for tenant admin login or password reset
    """
    email = request.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Find user by email
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate 6-digit OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP in database with expiry (5 minutes)
    otp_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "otp": otp,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "used": False
    }
    
    await db.email_otps.insert_one(otp_doc)
    
    # In production, send email via SendGrid/SES
    # For now, return OTP in response for testing
    print(f"📧 Email OTP for {email}: {otp}")
    
    return {
        "success": True,
        "message": "OTP sent to your email",
        "email": email,
        "otp": otp  # Remove in production
    }

@router.post("/verify-email-otp", response_model=LoginResponse)
async def verify_email_otp(
    request: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Verify email OTP and login
    """
    email = request.get("email")
    otp = request.get("otp")
    
    if not email or not otp:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    
    # Find OTP
    otp_doc = await db.email_otps.find_one({
        "email": email,
        "otp": otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Check expiry
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=401, detail="OTP expired")
    
    # Mark OTP as used
    await db.email_otps.update_one(
        {"id": otp_doc["id"]},
        {"$set": {"used": True}}
    )
    
    # Get user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get tenant info if user has tenant_id
    tenant_doc = None
    if user_doc.get("tenant_id"):
        tenant_doc = await db.tenants.find_one({"id": user_doc["tenant_id"]}, {"_id": 0})
    
    # Create JWT token
    token_data = {
        "user_id": user_doc["id"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id"),
        "store_id": user_doc.get("store_id")  # Include store_id for vendors
    }
    
    access_token = create_access_token(token_data)
    
    # Convert datetime fields
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    return LoginResponse(
        access_token=access_token,
        user=User(**user_doc),
        tenant=tenant_doc
    )

@router.post("/reset-password")
async def reset_password(
    request: dict,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Reset password using email OTP
    """
    email = request.get("email")
    otp = request.get("otp")
    new_password = request.get("new_password")
    
    if not email or not otp or not new_password:
        raise HTTPException(status_code=400, detail="Email, OTP and new password are required")
    
    # Verify OTP
    otp_doc = await db.email_otps.find_one({
        "email": email,
        "otp": otp,
        "used": False
    }, {"_id": 0})
    
    if not otp_doc:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Check expiry
    expires_at = datetime.fromisoformat(otp_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=401, detail="OTP expired")
    
    # Mark OTP as used
    await db.email_otps.update_one(
        {"id": otp_doc["id"]},
        {"$set": {"used": True}}
    )
    
    # Update password
    hashed_password = get_password_hash(new_password)
    result = await db.users.update_one(
        {"email": email},
        {"$set": {
            "password": hashed_password,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "success": True,
        "message": "Password reset successfully"
    }
