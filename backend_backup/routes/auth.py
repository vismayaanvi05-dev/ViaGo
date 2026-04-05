from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import OTPRequest, OTPVerify, LoginResponse, User, UserCreate
from utils.helpers import generate_otp, create_access_token, verify_password, get_password_hash
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])
otp_storage = {}

def get_db():
    from server import db
    return db

# ==================== CUSTOMER OTP AUTH ====================

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Send OTP for customer authentication (self-signup)"""
    from services.email_service import send_otp_email
    
    if not request.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    
    # Only allow customers to use OTP auth
    if request.role and request.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="OTP authentication is only available for customers. Drivers should use login with credentials."
        )
    
    otp = generate_otp(6)
    otp_storage[request.email] = {
        "otp": otp,
        "role": "customer",
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        "attempts": 0
    }
    
    # Send OTP via email using Resend
    email_result = await send_otp_email(request.email, otp)
    
    response_data = {
        "success": True,
        "message": "OTP sent to your email",
        "email": request.email,
        "expires_in_minutes": 5,
        "email_sent": email_result.get("success", False)
    }
    
    # Include OTP in response for testing (remove in production)
    # Only show if email failed to send
    if not email_result.get("success"):
        response_data["otp"] = otp
        response_data["note"] = "Email delivery pending - OTP shown for testing"
    
    return response_data

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp(request: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Verify OTP for customer login/registration"""
    if not request.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    
    stored_otp_data = otp_storage.get(request.email)
    if not stored_otp_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP not found. Please request a new OTP.")
    
    if datetime.now(timezone.utc) > stored_otp_data["expires_at"]:
        del otp_storage[request.email]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired. Please request a new OTP.")
    
    if stored_otp_data["otp"] != request.otp:
        stored_otp_data["attempts"] += 1
        if stored_otp_data["attempts"] >= 3:
            del otp_storage[request.email]
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many failed attempts. Please request a new OTP.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    
    # Check if customer exists
    user_doc = await db.users.find_one({"email": request.email, "role": "customer"}, {"_id": 0})
    
    if not user_doc:
        # New customer - need name for registration
        if not request.name:
            # Don't delete OTP yet - user needs to provide name and retry
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Name required for new user registration"
            )
        
        user_data = UserCreate(name=request.name, email=request.email, role="customer")
        user_obj = User(**user_data.model_dump())
        user_dict = user_obj.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_doc = user_dict
        
        # Send welcome email to new customer
        from services.email_service import send_welcome_email
        await send_welcome_email(request.email, request.name)
    
    # OTP verified and user logged in - now delete the OTP
    del otp_storage[request.email]
    
    token_data = {
        "user_id": user_doc["id"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id")
    }
    access_token = create_access_token(token_data)
    
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    return LoginResponse(access_token=access_token, user=User(**user_doc), tenant=None)

# ==================== DRIVER PASSWORD AUTH ====================

class DriverLoginRequest(BaseModel):
    email: EmailStr
    password: str

@router.post("/driver/login", response_model=LoginResponse)
async def driver_login(request: DriverLoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Login for delivery drivers (credentials set by tenant admin)"""
    
    # Find driver by email
    user_doc = await db.users.find_one(
        {"email": request.email, "role": "delivery_partner"},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if driver has password set
    if not user_doc.get("password"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not properly configured. Contact your admin."
        )
    
    # Verify password
    if not verify_password(request.password, user_doc["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if account is active
    if user_doc.get("status") == "inactive":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Contact your admin."
        )
    
    # Get tenant info
    tenant_doc = None
    if user_doc.get("tenant_id"):
        tenant_doc = await db.tenants.find_one({"id": user_doc["tenant_id"]}, {"_id": 0})
    
    # Create JWT token
    token_data = {
        "user_id": user_doc["id"],
        "email": user_doc["email"],
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id")
    }
    access_token = create_access_token(token_data)
    
    # Convert datetime fields
    if isinstance(user_doc.get("created_at"), str):
        user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    if isinstance(user_doc.get("updated_at"), str):
        user_doc["updated_at"] = datetime.fromisoformat(user_doc["updated_at"])
    
    # Remove password from response
    user_doc.pop("password", None)
    
    return LoginResponse(
        access_token=access_token,
        user=User(**user_doc),
        tenant=tenant_doc
    )

# ==================== TENANT ADMIN - DRIVER MANAGEMENT ====================

class DriverCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None

class DriverUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

@router.post("/admin/drivers")
async def create_driver(
    driver_data: DriverCreateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new delivery driver (Tenant Admin only)"""
    from services.email_service import send_driver_credentials_email
    
    # For now, we'll create without admin auth for testing
    # In production, add proper auth with tenant admin verification
    
    # Check if email already exists
    existing = await db.users.find_one({"email": driver_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create driver user
    driver_id = str(uuid.uuid4())
    
    # Assign to first available tenant (multi-tenant SaaS)
    tenant = await db.tenants.find_one({}, {"_id": 0, "id": 1})
    tenant_id = tenant["id"] if tenant else None
    
    driver = {
        "id": driver_id,
        "name": driver_data.name,
        "email": driver_data.email,
        "password": get_password_hash(driver_data.password),
        "phone": driver_data.phone,
        "role": "delivery_partner",
        "tenant_id": tenant_id,
        "vehicle_type": driver_data.vehicle_type,
        "vehicle_number": driver_data.vehicle_number,
        "status": "active",
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(driver)
    
    # Send credentials email to the new driver
    email_result = await send_driver_credentials_email(
        driver_data.email, 
        driver_data.name, 
        driver_data.password
    )
    
    # Remove password from response
    driver.pop("password", None)
    driver.pop("_id", None)
    
    return {
        "success": True,
        "message": "Driver created successfully",
        "driver": driver,
        "email_sent": email_result.get("success", False)
    }

@router.get("/admin/drivers")
async def list_drivers(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all delivery drivers"""
    drivers = await db.users.find(
        {"role": "delivery_partner", "is_deleted": {"$ne": True}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return {"drivers": drivers, "total": len(drivers)}

@router.get("/admin/drivers/{driver_id}")
async def get_driver(driver_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get driver details"""
    driver = await db.users.find_one(
        {"id": driver_id, "role": "delivery_partner"},
        {"_id": 0, "password": 0}
    )
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return driver

@router.put("/admin/drivers/{driver_id}")
async def update_driver(
    driver_id: str,
    update_data: DriverUpdateRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update driver details"""
    driver = await db.users.find_one({"id": driver_id, "role": "delivery_partner"})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    update_dict = {k: v for k, v in update_data.model_dump(exclude_unset=True).items()}
    
    # Hash password if provided
    if "password" in update_dict and update_dict["password"]:
        update_dict["password"] = get_password_hash(update_dict["password"])
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": driver_id}, {"$set": update_dict})
    
    return {"success": True, "message": "Driver updated successfully"}

@router.delete("/admin/drivers/{driver_id}")
async def delete_driver(driver_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Soft delete driver"""
    driver = await db.users.find_one({"id": driver_id, "role": "delivery_partner"})
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    
    await db.users.update_one(
        {"id": driver_id},
        {"$set": {"is_deleted": True, "status": "inactive", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Driver deleted successfully"}

@router.get("/me")
async def get_me(db: AsyncIOMotorDatabase = Depends(get_db)):
    from middleware.auth import get_current_user
    return {"message": "Use Authorization header"}
