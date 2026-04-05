from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ==================== GROCERY CATEGORY ====================
class GroceryCategory(BaseModel):
    id: str
    tenant_id: str
    store_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None  # For subcategories
    image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

class GroceryCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    store_id: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0

class GroceryCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


# ==================== GROCERY PRODUCT ====================
class GroceryProduct(BaseModel):
    id: str
    tenant_id: str
    store_id: str
    category_id: str
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    
    # Pricing
    mrp: float
    selling_price: float
    discount_percentage: float = 0
    
    # Product Type
    unit_type: str = "piece"  # piece, kg, g, litre, ml
    unit_value: float = 1.0  # e.g., 500 for 500g
    
    # Inventory
    current_stock: float = 0
    low_stock_threshold: float = 10
    
    # Product Details
    images: List[str] = []
    is_organic: bool = False
    is_fresh: bool = False
    
    # Tags
    tags: List[str] = []  # ['bestseller', 'new_arrival', 'seasonal']
    
    # Status
    is_available: bool = True
    is_deleted: bool = False
    
    created_at: datetime = Field(default_factory=lambda: datetime.now())
    updated_at: datetime = Field(default_factory=lambda: datetime.now())

class GroceryProductCreate(BaseModel):
    category_id: str
    store_id: str
    name: str
    description: Optional[str] = None
    brand: Optional[str] = None
    mrp: float
    selling_price: float
    unit_type: str = "piece"
    unit_value: float = 1.0
    current_stock: float = 0
    low_stock_threshold: float = 10
    images: List[str] = []
    is_organic: bool = False
    is_fresh: bool = False
    tags: List[str] = []

class GroceryProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    category_id: Optional[str] = None
    mrp: Optional[float] = None
    selling_price: Optional[float] = None
    unit_type: Optional[str] = None
    unit_value: Optional[float] = None
    low_stock_threshold: Optional[float] = None
    images: Optional[List[str]] = None
    is_organic: Optional[bool] = None
    is_fresh: Optional[bool] = None
    tags: Optional[List[str]] = None
    is_available: Optional[bool] = None


# ==================== INVENTORY TRANSACTION ====================
class InventoryTransaction(BaseModel):
    id: str
    tenant_id: str
    store_id: str
    product_id: str
    transaction_type: str  # 'stock_in', 'stock_out', 'adjustment', 'order_deduction'
    quantity: float
    previous_stock: float
    new_stock: float
    reference_id: Optional[str] = None  # Order ID if type is order_deduction
    notes: Optional[str] = None
    created_by: str  # User ID
    created_at: datetime = Field(default_factory=lambda: datetime.now())

class InventoryTransactionCreate(BaseModel):
    product_id: str
    store_id: str
    transaction_type: str
    quantity: float
    notes: Optional[str] = None


# ==================== STOCK UPDATE ====================
class StockUpdate(BaseModel):
    product_id: str
    store_id: str
    quantity: float
    operation: str  # 'add', 'subtract', 'set'
    notes: Optional[str] = None
