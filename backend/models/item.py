from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== ITEM MODELS (UNIFIED) ====================

class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    category_id: str
    module: str  # 'food', 'grocery', 'laundry'
    
    # Basic Info
    name: str
    description: Optional[str] = None
    images: List[str] = []
    
    # Pricing
    base_price: float
    mrp: Optional[float] = None  # For grocery (show discount)
    pricing_type: str = "fixed"  # 'fixed', 'weight_based', 'per_item'
    
    # Food-specific
    is_veg: Optional[bool] = None
    cuisine_type: Optional[str] = None
    
    # Grocery-specific
    unit_type: Optional[str] = None  # 'kg', 'g', 'litre', 'ml', 'piece', 'packet'
    brand: Optional[str] = None
    
    # Laundry-specific
    service_type: Optional[str] = None  # 'wash_fold', 'wash_iron', 'dry_clean', 'iron_only'
    turnaround_hours: Optional[int] = None
    
    # Admin Markup (NEW - per item override)
    admin_markup_percentage: Optional[float] = None  # Override default tenant markup
    admin_markup_amount: Optional[float] = None  # Calculated amount
    
    # Tags & Features
    tags: List[str] = []  # ['best_seller', 'featured', 'new', 'organic']
    is_featured: bool = False
    is_available: bool = True
    
    # Stock (for grocery)
    track_inventory: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = False

class ItemCreate(BaseModel):
    store_id: str
    category_id: str
    module: str
    name: str
    description: Optional[str] = None
    images: List[str] = []
    base_price: float
    mrp: Optional[float] = None
    pricing_type: str = "fixed"
    is_veg: Optional[bool] = None
    cuisine_type: Optional[str] = None
    unit_type: Optional[str] = None
    brand: Optional[str] = None
    service_type: Optional[str] = None
    turnaround_hours: Optional[int] = None
    admin_markup_percentage: Optional[float] = None
    tags: List[str] = []
    is_featured: bool = False
    track_inventory: bool = False

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    base_price: Optional[float] = None
    mrp: Optional[float] = None
    is_veg: Optional[bool] = None
    admin_markup_percentage: Optional[float] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_available: Optional[bool] = None

# ==================== ITEM VARIANT MODELS ====================

class ItemVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    tenant_id: str
    
    name: str  # 'Small', 'Medium', 'Large', '500g', '1kg'
    price: float
    
    # Grocery-specific
    weight: Optional[float] = None  # 0.5, 1, 2 (in kg/litre)
    unit: Optional[str] = None  # 'kg', 'litre', 'piece'
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None
    
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ItemVariantCreate(BaseModel):
    item_id: str
    name: str
    price: float
    weight: Optional[float] = None
    unit: Optional[str] = None
    stock_quantity: Optional[int] = None
    sku: Optional[str] = None

class ItemVariantUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None

# ==================== ADD-ON MODELS ====================

class AddOn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    tenant_id: str
    
    name: str  # 'Extra Cheese', 'Spicy Sauce', 'Express Service'
    price: float
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AddOnCreate(BaseModel):
    item_id: str
    name: str
    price: float

class AddOnUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None

# ==================== INVENTORY MODELS (GROCERY) ====================

class Inventory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    item_id: str
    variant_id: Optional[str] = None
    
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    unit: str = "piece"  # 'kg', 'litre', 'piece'
    
    last_restocked_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InventoryUpdate(BaseModel):
    stock_quantity: int
    low_stock_threshold: Optional[int] = None

class InventoryBulkUpdate(BaseModel):
    items: List[dict]  # [{"item_id": "...", "variant_id": "...", "stock_quantity": 100}]

# ==================== DELIVERY SLOT MODELS (GROCERY & LAUNDRY) ====================

class DeliverySlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    slot_type: str  # 'delivery', 'pickup'
    
    date: str  # "2025-08-15"
    start_time: str  # "08:00"
    end_time: str  # "10:00"
    
    capacity: int = 10  # Max orders per slot
    booked_count: int = 0
    
    is_available: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DeliverySlotCreate(BaseModel):
    store_id: str
    slot_type: str
    date: str
    start_time: str
    end_time: str
    capacity: int = 10

class DeliverySlotUpdate(BaseModel):
    capacity: Optional[int] = None
    is_available: Optional[bool] = None

# ==================== SUBSTITUTION MODELS (GROCERY) ====================

class Substitution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    order_id: str
    order_item_id: str
    original_item_id: str
    replacement_item_id: str
    reason: Optional[str] = None  # 'out_of_stock', 'quality_issue'
    status: str = "suggested"  # 'suggested', 'accepted', 'rejected'
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== LAUNDRY-SPECIFIC MODELS ====================

class LaundryServiceDetails(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    item_id: str
    service_type: str  # 'wash_fold', 'wash_iron', 'dry_clean', 'iron_only'
    turnaround_hours: int = 24
    pricing_model: str = "per_item"  # 'per_item', 'per_kg'
    price_per_item: Optional[float] = None
    price_per_kg: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LaundryOrderDetails(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    tenant_id: str
    pickup_slot_id: Optional[str] = None
    delivery_slot_id: Optional[str] = None
    estimated_weight_kg: Optional[float] = None
    actual_weight_kg: Optional[float] = None
    final_price: Optional[float] = None
    special_instructions: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
