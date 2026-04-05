from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: EmailStr
    role: str  # 'super_admin', 'tenant_admin', 'delivery_partner', 'customer'
    profile_photo: Optional[str] = None
    status: str = "active"
    vehicle_type: Optional[str] = None
    vehicle_number: Optional[str] = None
    current_location: Optional[dict] = None
    is_deleted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    tenant_id: Optional[str] = None
    name: str
    phone: Optional[str] = None
    email: EmailStr
    role: str

class OTPRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "customer"

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str
    role: Optional[str] = "customer"
    name: Optional[str] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
    tenant: Optional[dict] = None

class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tenant_id: Optional[str] = None
    address_type: str = "home"
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
