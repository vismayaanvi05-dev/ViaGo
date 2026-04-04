from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import OTPRequest, OTPVerify, LoginResponse, User, UserCreate
from models.tenant import Tenant
from utils.helpers import generate_otp, create_access_token
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory OTP storage (use Redis in production)
otp_storage = {}

def get_db():
    from server import db
    return db

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Send OTP to phone number
    In production, integrate with SMS gateway (Twilio/MSG91)
    """
    otp = generate_otp(6)
    
    # Store OTP with 5 minute expiry
    otp_storage[request.phone] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=5),
        "attempts": 0
    }
    
    # TODO: Send OTP via SMS gateway
    print(f"OTP for {request.phone}: {otp}")  # For development
    
    return {
        "success": True,
        "message": "OTP sent successfully",
        "phone": request.phone,
        "otp": otp  # Remove in production!
    }

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp(request: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Verify OTP and login/register user
    """
    # Check if OTP exists
    stored_otp_data = otp_storage.get(request.phone)
    
    if not stored_otp_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not found or expired. Please request a new OTP."
        )
    
    # Check expiry
    if datetime.utcnow() > stored_otp_data["expires_at"]:
        del otp_storage[request.phone]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired. Please request a new OTP."
        )
    
    # Verify OTP
    if stored_otp_data["otp"] != request.otp:
        stored_otp_data["attempts"] += 1
        if stored_otp_data["attempts"] >= 3:
            del otp_storage[request.phone]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please request a new OTP."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP"
        )
    
    # OTP verified, clear from storage
    del otp_storage[request.phone]
    
    # Check if user exists
    user_doc = await db.users.find_one({"phone": request.phone, "role": request.role})
    
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
        "tenant_id": user_doc.get("tenant_id")
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

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
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

# Import auth dependency
from middleware.auth import get_current_user
