from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Admin Settings"])

# Import db from server
import sys
sys.path.append('..')
from server import db

class TenantSettingsUpdate(BaseModel):
    help_center_url: Optional[str] = None
    help_center_content: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_address: Optional[str] = None
    terms_conditions_url: Optional[str] = None
    terms_conditions_content: Optional[str] = None
    privacy_policy_url: Optional[str] = None
    privacy_policy_content: Optional[str] = None
    about_us: Optional[str] = None
    app_name: Optional[str] = None


DEFAULT_SETTINGS = {
    "id": "default",
    "help_center_url": "",
    "help_center_content": "For any assistance, please reach out to our support team.",
    "contact_email": "support@viago.app",
    "contact_phone": "+91 9876543210",
    "contact_address": "Mumbai, Maharashtra, India",
    "terms_conditions_url": "",
    "terms_conditions_content": "Standard terms and conditions apply. Please use this service responsibly.",
    "privacy_policy_url": "",
    "privacy_policy_content": "We respect your privacy and protect your data. Your information is secure with us.",
    "about_us": "ViaGo - Your trusted delivery partner for food, grocery and laundry.",
    "app_name": "ViaGo",
}


@router.get("/settings")
async def get_tenant_settings():
    """Get tenant settings (public endpoint)"""
    settings = await db.tenant_settings.find_one({"id": "default"}, {"_id": 0})
    if not settings:
        await db.tenant_settings.insert_one({**DEFAULT_SETTINGS})
        settings = DEFAULT_SETTINGS
    return settings


@router.put("/settings")
async def update_tenant_settings(data: TenantSettingsUpdate):
    """Update tenant settings (admin only)"""
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    existing = await db.tenant_settings.find_one({"id": "default"})
    if not existing:
        await db.tenant_settings.insert_one({**DEFAULT_SETTINGS, **update_data})
    else:
        await db.tenant_settings.update_one({"id": "default"}, {"$set": update_data})
    
    settings = await db.tenant_settings.find_one({"id": "default"}, {"_id": 0})
    return {"success": True, "settings": settings}
