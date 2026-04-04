from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== STORE MODELS ====================

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    store_type: str  # 'restaurant', 'grocery', 'laundry'
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    
    # Address
    address_line: str
    city: str
    state: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    
    # Operations
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_radius_km: float = 5.0
    minimum_order_value: float = 0.0
    average_prep_time_minutes: int = 30
    
    # Food-specific
    cuisine_types: List[str] = []  # ['Indian', 'Chinese', 'Italian']
    
    # Timings
    opening_time: Optional[str] = None  # "09:00"
    closing_time: Optional[str] = None  # "22:00"
    
    # Status
    is_active: bool = True
    is_accepting_orders: bool = True
    is_deleted: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class StoreCreate(BaseModel):
    name: str
    store_type: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    address_line: str
    city: str
    state: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_radius_km: float = 5.0
    minimum_order_value: float = 0.0
    average_prep_time_minutes: int = 30
    cuisine_types: List[str] = []
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    delivery_radius_km: Optional[float] = None
    minimum_order_value: Optional[float] = None
    average_prep_time_minutes: Optional[int] = None
    cuisine_types: Optional[List[str]] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_active: Optional[bool] = None
    is_accepting_orders: Optional[bool] = None

# ==================== CATEGORY MODELS ====================

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: Optional[str] = None  # None for tenant-level categories
    module: str  # 'food', 'grocery', 'laundry'
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[str] = None  # For subcategories
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CategoryCreate(BaseModel):
    store_id: Optional[str] = None
    module: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: int = 0

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
