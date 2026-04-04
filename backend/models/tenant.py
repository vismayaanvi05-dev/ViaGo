from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== TENANT MODELS ====================

class Tenant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    business_type: str  # 'single_vendor' or 'multi_vendor'
    active_modules: List[str] = []  # ['food', 'grocery', 'laundry']
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    status: str = "active"  # 'active' or 'inactive'
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TenantCreate(BaseModel):
    name: str
    business_type: str
    active_modules: List[str] = ["food"]
    logo_url: Optional[str] = None
    domain: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    active_modules: Optional[List[str]] = None
    logo_url: Optional[str] = None
    domain: Optional[str] = None
    status: Optional[str] = None

# ==================== TENANT SETTINGS (NEW) ====================

class TenantSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    
    # Delivery Charge Settings
    delivery_charge_type: str = "flat"  # 'flat' or 'distance_based'
    flat_delivery_charge: float = 0.0
    delivery_charge_per_km: float = 0.0
    free_delivery_above: Optional[float] = None
    
    # Tax Settings
    tax_enabled: bool = True
    tax_name: str = "GST"  # 'GST', 'VAT', 'Sales Tax'
    tax_percentage: float = 5.0
    
    # Item Markup (Admin Profit)
    default_admin_markup_percentage: float = 0.0  # Default markup on items
    
    # Other Settings
    currency: str = "INR"
    minimum_order_value: float = 0.0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TenantSettingsUpdate(BaseModel):
    delivery_charge_type: Optional[str] = None
    flat_delivery_charge: Optional[float] = None
    delivery_charge_per_km: Optional[float] = None
    free_delivery_above: Optional[float] = None
    tax_enabled: Optional[bool] = None
    tax_name: Optional[str] = None
    tax_percentage: Optional[float] = None
    default_admin_markup_percentage: Optional[float] = None
    currency: Optional[str] = None
    minimum_order_value: Optional[float] = None
