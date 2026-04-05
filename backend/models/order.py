from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

# ==================== ORDER MODELS ====================

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    customer_id: str
    module: str  # 'food', 'grocery', 'laundry'
    
    # Order Details
    order_number: str  # Human-readable: "ORD20250815001"
    
    # Address
    delivery_address_id: str
    delivery_address: Optional[dict] = None  # Snapshot of address
    
    # Amounts (Detailed Breakdown)
    subtotal: float  # Sum of item prices
    admin_markup_total: float = 0.0  # NEW: Total admin markup
    delivery_charge: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    
    # Commission (for platform)
    commission_percentage: float = 0.0
    commission_amount: float = 0.0
    vendor_payout: float = 0.0  # Amount vendor receives
    
    # Payment
    payment_method: str  # 'upi', 'card', 'netbanking', 'cod', 'wallet'
    payment_status: str = "pending"  # 'pending', 'completed', 'failed', 'refunded'
    payment_id: Optional[str] = None  # From payment gateway
    
    # Delivery
    delivery_type: str = "instant"  # 'instant', 'scheduled'
    scheduled_delivery_slot_id: Optional[str] = None
    estimated_delivery_time: Optional[datetime] = None
    
    # Status
    status: str = "placed"  # 'placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'
    
    # Coupon
    coupon_code: Optional[str] = None
    
    # Special Instructions
    special_instructions: Optional[str] = None
    
    # Substitution Preference (Grocery)
    allow_substitution: bool = False
    
    # Timestamps
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    store_id: str
    delivery_address_id: str
    items: List[dict]  # [{"item_id": "...", "variant_id": "...", "quantity": 2, "add_ons": [...]}]
    payment_method: str
    delivery_type: str = "instant"
    scheduled_delivery_slot_id: Optional[str] = None
    special_instructions: Optional[str] = None
    allow_substitution: bool = False
    coupon_code: Optional[str] = None

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_id: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None

# ==================== ORDER ITEM MODELS ====================

class OrderItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    tenant_id: str
    
    item_id: str
    item_name: str  # Snapshot
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    
    quantity: int
    unit_price: float
    admin_markup_per_item: float = 0.0  # NEW
    total_price: float  # unit_price * quantity (includes markup)
    
    # Add-ons
    add_ons: List[dict] = []  # [{"id": "...", "name": "Extra Cheese", "price": 20}]
    add_ons_total: float = 0.0
    
    # Substitution (Grocery)
    is_substituted: bool = False
    substituted_item_id: Optional[str] = None
    substitution_reason: Optional[str] = None
    
    # Status (for picking in grocery)
    item_status: str = "pending"  # 'pending', 'picked', 'unavailable', 'substituted'
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OrderItemCreate(BaseModel):
    item_id: str
    variant_id: Optional[str] = None
    quantity: int
    add_ons: List[str] = []  # List of add-on IDs

# ==================== DELIVERY MODELS ====================

class Delivery(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    order_id: str
    
    delivery_partner_id: Optional[str] = None
    delivery_type: str = "platform"  # 'platform', 'self'
    
    # Status
    status: str = "pending"  # 'pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'failed'
    
    # Timestamps
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    # Delivery Info
    delivery_partner_name: Optional[str] = None
    delivery_partner_phone: Optional[str] = None
    delivery_otp: Optional[str] = None
    
    # Proof
    delivery_proof_image: Optional[str] = None
    customer_signature: Optional[str] = None
    
    # Failure
    failure_reason: Optional[str] = None
    retry_count: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DeliveryCreate(BaseModel):
    order_id: str
    delivery_type: str = "platform"

class DeliveryUpdate(BaseModel):
    delivery_partner_id: Optional[str] = None
    status: Optional[str] = None
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    delivery_proof_image: Optional[str] = None
    failure_reason: Optional[str] = None

# ==================== COUPON MODELS ====================

class Coupon(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: Optional[str] = None  # None = all stores
    
    code: str  # "FIRST50", "SAVE20"
    description: str
    
    discount_type: str  # 'flat', 'percentage'
    discount_value: float
    max_discount: Optional[float] = None  # For percentage type
    
    min_order_value: float = 0.0
    
    usage_limit_per_user: int = 1
    total_usage_limit: Optional[int] = None
    current_usage_count: int = 0
    
    applicable_modules: List[str] = []  # ['food', 'grocery'], empty = all
    
    valid_from: datetime
    valid_until: datetime
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CouponCreate(BaseModel):
    store_id: Optional[str] = None
    code: str
    description: str
    discount_type: str
    discount_value: float
    max_discount: Optional[float] = None
    min_order_value: float = 0.0
    usage_limit_per_user: int = 1
    total_usage_limit: Optional[int] = None
    applicable_modules: List[str] = []
    valid_from: datetime
    valid_until: datetime

class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discount_value: Optional[float] = None
    is_active: Optional[bool] = None

# ==================== REVIEW MODELS ====================

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    order_id: str
    customer_id: str
    store_id: str
    
    food_rating: Optional[float] = None  # 1-5 stars
    delivery_rating: Optional[float] = None  # 1-5 stars
    overall_rating: float  # Average
    
    comment: Optional[str] = None
    images: List[str] = []
    
    is_verified: bool = True  # Only verified purchases can review
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    order_id: str
    food_rating: Optional[float] = None
    delivery_rating: Optional[float] = None
    comment: Optional[str] = None
    images: List[str] = []
