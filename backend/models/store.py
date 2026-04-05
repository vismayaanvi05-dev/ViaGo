from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Store(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    store_type: str  # 'restaurant', 'grocery', 'laundry'
    description: Optional[str] = None
    logo_url: Optional[str] = None
    address_line: str
    city: str
    state: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    phone: Optional[str] = None
    delivery_radius_km: float = 5.0
    minimum_order_value: float = 0.0
    average_prep_time_minutes: int = 30
    cuisine_types: List[str] = []
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    is_active: bool = True
    is_accepting_orders: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: Optional[str] = None
    module: str
    name: str
    description: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
