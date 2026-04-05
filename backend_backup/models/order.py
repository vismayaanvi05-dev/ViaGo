from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    customer_id: str
    module: str
    order_number: str
    delivery_address_id: str
    delivery_address: Optional[dict] = None
    subtotal: float
    delivery_charge: float = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    delivery_fee: float = 50.0
    payment_method: str
    payment_status: str = "pending"
    delivery_type: str = "instant"
    status: str = "placed"
    special_instructions: Optional[str] = None
    delivery_partner_id: Optional[str] = None
    customer_phone: Optional[str] = None
    placed_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    store_id: str
    delivery_address_id: str
    items: List[dict]
    payment_method: str
    delivery_type: str = "instant"
    special_instructions: Optional[str] = None
    coupon_code: Optional[str] = None

class OrderItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    tenant_id: str
    item_id: str
    item_name: str
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float
    add_ons: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
