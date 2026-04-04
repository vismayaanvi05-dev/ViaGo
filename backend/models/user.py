from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
import uuid

# ==================== USER MODELS ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None  # None for super_admin
    name: str
    phone: str
    email: Optional[EmailStr] = None
    role: str  # 'super_admin', 'tenant_admin', 'vendor', 'delivery', 'customer', 'staff'
    profile_photo: Optional[str] = None
    status: str = "active"  # 'active' or 'inactive'
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    tenant_id: Optional[str] = None
    name: str
    phone: str
    email: Optional[EmailStr] = None
    role: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    profile_photo: Optional[str] = None
    status: Optional[str] = None

# ==================== AUTH MODELS ====================

class OTPRequest(BaseModel):
    phone: str
    role: Optional[str] = "customer"  # Default role for registration

class OTPVerify(BaseModel):
    phone: str
    otp: str
    role: Optional[str] = "customer"
    name: Optional[str] = None  # For new user registration

class OTPStore(BaseModel):
    phone: str
    otp: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    attempts: int = 0

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    tenant: Optional[dict] = None

# ==================== ADDRESS MODELS ====================

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tenant_id: Optional[str] = None
    address_type: str = "home"  # 'home', 'work', 'other'
    address_line: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AddressCreate(BaseModel):
    address_type: str = "home"
    address_line: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: bool = False

class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    address_line: Optional[str] = None
    landmark: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: Optional[bool] = None
