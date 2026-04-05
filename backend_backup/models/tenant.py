from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Tenant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    business_type: str = "single_vendor"
    active_modules: List[str] = ["food", "grocery", "laundry"]
    logo_url: Optional[str] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TenantSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    delivery_charge_type: str = "flat"
    flat_delivery_charge: float = 30.0
    delivery_charge_per_km: float = 10.0
    free_delivery_above: Optional[float] = 500.0
    tax_enabled: bool = True
    tax_percentage: float = 5.0
    currency: str = "INR"
    created_at: datetime = Field(default_factory=datetime.utcnow)
