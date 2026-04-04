from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ==================== LAUNDRY SERVICE ====================
class LaundryService(BaseModel):
    id: str
    tenant_id: str
    store_id: Optional[str] = None
    name: str  # "Wash & Fold", "Dry Clean", "Iron Only"
    description: Optional[str] = None
    icon: Optional[str] = None
    turnaround_time_hours: int = 24  # Default 24 hours
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

class LaundryServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    turnaround_time_hours: int = 24
    store_id: Optional[str] = None
    sort_order: int = 0

class LaundryServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    turnaround_time_hours: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


# ==================== LAUNDRY ITEM ====================
class LaundryItem(BaseModel):
    id: str
    tenant_id: str
    store_id: Optional[str] = None
    name: str  # "Shirt", "Pants", "Saree", "Blanket"
    category: str  # "clothing", "bedding", "accessories"
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

class LaundryItemCreate(BaseModel):
    name: str
    category: str = "clothing"
    image_url: Optional[str] = None
    store_id: Optional[str] = None
    sort_order: int = 0

class LaundryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


# ==================== LAUNDRY PRICING ====================
class LaundryPricing(BaseModel):
    id: str
    tenant_id: str
    store_id: str
    service_id: str
    item_id: Optional[str] = None  # None means per-kg pricing
    pricing_type: str  # "per_item" or "per_kg"
    price: float
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

class LaundryPricingCreate(BaseModel):
    service_id: str
    store_id: str
    item_id: Optional[str] = None
    pricing_type: str  # "per_item" or "per_kg"
    price: float

class LaundryPricingUpdate(BaseModel):
    price: Optional[float] = None
    is_active: Optional[bool] = None


# ==================== LAUNDRY ORDER ====================
class LaundryOrderItem(BaseModel):
    item_id: str
    item_name: str
    quantity: int
    price: float
    subtotal: float

class LaundryOrder(BaseModel):
    id: str
    tenant_id: str
    store_id: str
    customer_id: str
    
    # Service details
    service_id: str
    service_name: str
    
    # Order type
    order_type: str  # "item_based" or "weight_based"
    
    # Items (for item-based)
    items: List[LaundryOrderItem] = []
    
    # Weight (for weight-based)
    estimated_weight_kg: Optional[float] = None
    actual_weight_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    
    # Pricing
    subtotal: float
    add_on_charges: float = 0
    total_amount: float
    
    # Pickup & Delivery
    pickup_address: str
    pickup_date: str
    pickup_time_slot: str
    delivery_date: str
    delivery_time_slot: str
    
    # Tracking
    pickup_partner_id: Optional[str] = None
    delivery_partner_id: Optional[str] = None
    
    # Status
    status: str = "pending"  # pending, pickup_assigned, picked_up, at_facility, processing, ready, out_for_delivery, delivered, cancelled
    
    # Payment
    payment_method: str  # "cod", "online"
    payment_status: str = "pending"  # pending, paid, refunded
    
    # Notes
    customer_notes: Optional[str] = None
    admin_notes: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())
    pickup_completed_at: Optional[datetime] = None
    delivery_completed_at: Optional[datetime] = None

class LaundryOrderCreate(BaseModel):
    service_id: str
    store_id: str
    order_type: str  # "item_based" or "weight_based"
    items: List[LaundryOrderItem] = []
    estimated_weight_kg: Optional[float] = None
    price_per_kg: Optional[float] = None
    subtotal: float
    total_amount: float
    pickup_address: str
    pickup_date: str
    pickup_time_slot: str
    delivery_date: str
    delivery_time_slot: str
    payment_method: str
    customer_notes: Optional[str] = None

class LaundryOrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_weight_kg: Optional[float] = None
    total_amount: Optional[float] = None
    pickup_partner_id: Optional[str] = None
    delivery_partner_id: Optional[str] = None
    admin_notes: Optional[str] = None
    payment_status: Optional[str] = None


# ==================== TIME SLOTS ====================
class TimeSlot(BaseModel):
    id: str
    tenant_id: str
    store_id: str
    slot_type: str  # "pickup" or "delivery"
    start_time: str  # "08:00"
    end_time: str  # "10:00"
    max_capacity: int = 10
    is_active: bool = True
    days_of_week: List[int] = [0, 1, 2, 3, 4, 5, 6]  # 0=Monday, 6=Sunday
    created_at: datetime = Field(default_factory=lambda: datetime.now())

class TimeSlotCreate(BaseModel):
    store_id: str
    slot_type: str
    start_time: str
    end_time: str
    max_capacity: int = 10
    days_of_week: List[int] = [0, 1, 2, 3, 4, 5, 6]
