from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== CART MODELS ====================

class CartItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    item_name: str
    quantity: int
    unit_price: float
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    add_ons: List[dict] = []  # [{"id": "...", "name": "...", "price": 20}]
    added_at: datetime = Field(default_factory=datetime.utcnow)

class Cart(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    store_id: str
    tenant_id: str
    module: str  # 'food', 'grocery', 'laundry'
    items: List[CartItem] = []
    applied_coupon: Optional[dict] = None  # {"code": "...", "coupon_id": "...", "discount_amount": 50}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AddToCartRequest(BaseModel):
    store_id: str
    item_id: str
    quantity: int = 1
    variant_id: Optional[str] = None
    add_ons: List[str] = []  # List of add-on IDs

class UpdateCartItemRequest(BaseModel):
    item_id: str
    quantity: int

class ApplyCouponRequest(BaseModel):
    coupon_code: str
