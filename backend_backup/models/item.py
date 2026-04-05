from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    store_id: str
    category_id: str
    module: str
    name: str
    description: Optional[str] = None
    images: List[str] = []
    base_price: float
    mrp: Optional[float] = None
    is_veg: Optional[bool] = None
    unit_type: Optional[str] = None
    is_featured: bool = False
    is_available: bool = True
    in_stock: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = False

class ItemVariant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    tenant_id: str
    name: str
    price: float
    is_available: bool = True

class AddOn(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_id: str
    tenant_id: str
    name: str
    price: float
    is_available: bool = True
