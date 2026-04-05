from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import OTPRequest, OTPVerify, LoginResponse, User, UserCreate
from utils.helpers import generate_otp, create_access_token
from datetime import datetime, timedelta, timezone
import os
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])
otp_storage = {}

def get_db():
    from server import db
    return db

@router.post("/send-otp")
async def send_otp(request: OTPRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not request.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    
    otp = generate_otp(6)
    otp_storage[request.email] = {
        "otp": otp,
        "role": request.role,
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5),
        "attempts": 0
    }
    
    return {
        "success": True,
        "message": "OTP sent to your email",
        "email": request.email,
        "otp": otp  # Shown for testing - remove in production
    }

@router.post("/verify-otp", response_model=LoginResponse)
async def verify_otp(request: OTPVerify, db: AsyncIOMotorDatabase = Depends(get_db)):
    if not request.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
    
    stored_otp_data = otp_storage.get(request.email)
    if not stored_otp_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP not found or expired")
    
    if datetime.now(timezone.utc) > stored_otp_data["expires_at"]:
        del otp_storage[request.email]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")
    
    if stored_otp_data["otp"] != request.otp:
        stored_otp_data["attempts"] += 1
        if stored_otp_data["attempts"] >= 3:
            del otp_storage[request.email]
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Too many failed attempts")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    
    del otp_storage[request.email]
    
    user_doc = await db.users.find_one({"email": request.email, "role": request.role}, {"_id": 0})
    
    if not user_doc:
        if not request.name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name required for new user")
        
        user_data = UserCreate(name=request.name, email=request.email, role=request.role)
        user_obj = User(**user_data.model_dump())
        user_dict = user_obj.model_dump()
        user_dict["created_at"] = user_dict["created_at"].isoformat()
        user_dict["updated_at"] = user_dict["updated_at"].isoformat()
        await db.users.insert_one(user_dict)
        user_doc = user_dict
    
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

@router.get("/me")
async def get_me(db: AsyncIOMotorDatabase = Depends(get_db)):
    from middleware.auth import get_current_user
    return {"message": "Use Authorization header"}
