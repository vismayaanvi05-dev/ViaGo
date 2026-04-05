from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from models.laundry import (
    LaundryService, LaundryServiceCreate, LaundryServiceUpdate,
    LaundryItem, LaundryItemCreate, LaundryItemUpdate,
    LaundryPricing, LaundryPricingCreate, LaundryPricingUpdate,
    LaundryOrder, LaundryOrderCreate, LaundryOrderUpdate,
    TimeSlot, TimeSlotCreate
)
from middleware.auth import get_current_user, require_role, verify_tenant_access, get_tenant_id, require_module_access

router = APIRouter(prefix="/laundry-admin", tags=["Laundry Admin"])

def get_db():
    from server import db
    return db


# ==================== SERVICE ENDPOINTS ====================

@router.get("/services", response_model=List[LaundryService])
async def list_services(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None
):
    """List laundry services"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    await require_module_access(current_user, "laundry")
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    services = await db.laundry_services.find(query, {"_id": 0}).sort("sort_order", 1).to_list(100)
    
    for service in services:
        if isinstance(service.get("created_at"), str):
            service["created_at"] = datetime.fromisoformat(service["created_at"])
        if isinstance(service.get("updated_at"), str):
            service["updated_at"] = datetime.fromisoformat(service["updated_at"])
    
    return services


@router.post("/services", response_model=LaundryService)
async def create_service(
    service_data: LaundryServiceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create laundry service"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if service_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create services for their store")
    
    service = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": service_data.store_id,
        "name": service_data.name,
        "description": service_data.description,
        "icon": service_data.icon,
        "turnaround_time_hours": service_data.turnaround_time_hours,
        "is_active": True,
        "sort_order": service_data.sort_order,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    await db.laundry_services.insert_one(service)
    service["created_at"] = datetime.fromisoformat(service["created_at"])
    service["updated_at"] = datetime.fromisoformat(service["updated_at"])
    
    return service


@router.put("/services/{service_id}", response_model=LaundryService)
async def update_service(
    service_id: str,
    service_data: LaundryServiceUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update laundry service"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    service = await db.laundry_services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await verify_tenant_access(current_user, service["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if service.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's services")
    
    update_data = {k: v for k, v in service_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now().isoformat()
    
    await db.laundry_services.update_one({"id": service_id}, {"$set": update_data})
    
    updated = await db.laundry_services.find_one({"id": service_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated


@router.delete("/services/{service_id}")
async def delete_service(
    service_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete laundry service"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    service = await db.laundry_services.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await verify_tenant_access(current_user, service["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if service.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only delete their store's services")
    
    await db.laundry_services.update_one(
        {"id": service_id},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    return {"message": "Service deleted successfully"}


# ==================== ITEM ENDPOINTS ====================

@router.get("/items", response_model=List[LaundryItem])
async def list_items(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    category: Optional[str] = None
):
    """List laundry items"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if category:
        query["category"] = category
    
    items = await db.laundry_items.find(query, {"_id": 0}).sort("sort_order", 1).to_list(200)
    
    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        if isinstance(item.get("updated_at"), str):
            item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    
    return items


@router.post("/items", response_model=LaundryItem)
async def create_item(
    item_data: LaundryItemCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create laundry item"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if item_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create items for their store")
    
    item = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": item_data.store_id,
        "name": item_data.name,
        "category": item_data.category,
        "image_url": item_data.image_url,
        "is_active": True,
        "sort_order": item_data.sort_order,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    await db.laundry_items.insert_one(item)
    item["created_at"] = datetime.fromisoformat(item["created_at"])
    item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    
    return item


@router.put("/items/{item_id}", response_model=LaundryItem)
async def update_item(
    item_id: str,
    item_data: LaundryItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update laundry item"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    item = await db.laundry_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await verify_tenant_access(current_user, item["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if item.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's items")
    
    update_data = {k: v for k, v in item_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now().isoformat()
    
    await db.laundry_items.update_one({"id": item_id}, {"$set": update_data})
    
    updated = await db.laundry_items.find_one({"id": item_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated


@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete laundry item"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    item = await db.laundry_items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await verify_tenant_access(current_user, item["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if item.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only delete their store's items")
    
    await db.laundry_items.update_one(
        {"id": item_id},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    return {"message": "Item deleted successfully"}


# ==================== PRICING ENDPOINTS ====================

@router.get("/pricing", response_model=List[LaundryPricing])
async def list_pricing(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    service_id: Optional[str] = None
):
    """List pricing"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if service_id:
        query["service_id"] = service_id
    
    pricing = await db.laundry_pricing.find(query, {"_id": 0}).to_list(500)
    
    for price in pricing:
        if isinstance(price.get("created_at"), str):
            price["created_at"] = datetime.fromisoformat(price["created_at"])
        if isinstance(price.get("updated_at"), str):
            price["updated_at"] = datetime.fromisoformat(price["updated_at"])
    
    return pricing


@router.post("/pricing", response_model=LaundryPricing)
async def create_pricing(
    pricing_data: LaundryPricingCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create pricing"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if pricing_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create pricing for their store")
    
    pricing = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": pricing_data.store_id,
        "service_id": pricing_data.service_id,
        "item_id": pricing_data.item_id,
        "pricing_type": pricing_data.pricing_type,
        "price": pricing_data.price,
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    await db.laundry_pricing.insert_one(pricing)
    pricing["created_at"] = datetime.fromisoformat(pricing["created_at"])
    pricing["updated_at"] = datetime.fromisoformat(pricing["updated_at"])
    
    return pricing


@router.put("/pricing/{pricing_id}", response_model=LaundryPricing)
async def update_pricing(
    pricing_id: str,
    pricing_data: LaundryPricingUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update pricing"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    pricing = await db.laundry_pricing.find_one({"id": pricing_id})
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing not found")
    
    await verify_tenant_access(current_user, pricing["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if pricing.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's pricing")
    
    update_data = {k: v for k, v in pricing_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now().isoformat()
    
    await db.laundry_pricing.update_one({"id": pricing_id}, {"$set": update_data})
    
    updated = await db.laundry_pricing.find_one({"id": pricing_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated


# ==================== ORDER ENDPOINTS ====================

@router.get("/orders", response_model=List[LaundryOrder])
async def list_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List laundry orders"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id}
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if status:
        query["status"] = status
    
    orders = await db.laundry_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("updated_at"), str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])
        if order.get("pickup_completed_at") and isinstance(order["pickup_completed_at"], str):
            order["pickup_completed_at"] = datetime.fromisoformat(order["pickup_completed_at"])
        if order.get("delivery_completed_at") and isinstance(order["delivery_completed_at"], str):
            order["delivery_completed_at"] = datetime.fromisoformat(order["delivery_completed_at"])
    
    return orders


@router.get("/orders/{order_id}", response_model=LaundryOrder)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get order details"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    order = await db.laundry_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await verify_tenant_access(current_user, order["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if order.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only view their store's orders")
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("updated_at"), str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    if order.get("pickup_completed_at") and isinstance(order["pickup_completed_at"], str):
        order["pickup_completed_at"] = datetime.fromisoformat(order["pickup_completed_at"])
    if order.get("delivery_completed_at") and isinstance(order["delivery_completed_at"], str):
        order["delivery_completed_at"] = datetime.fromisoformat(order["delivery_completed_at"])
    
    return order


@router.put("/orders/{order_id}", response_model=LaundryOrder)
async def update_order(
    order_id: str,
    order_data: LaundryOrderUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update order status"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    order = await db.laundry_orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await verify_tenant_access(current_user, order["tenant_id"])
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if order.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's orders")
    
    update_data = {k: v for k, v in order_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now().isoformat()
    
    # Track timestamps for status changes
    if "status" in update_data:
        if update_data["status"] == "picked_up":
            update_data["pickup_completed_at"] = datetime.now().isoformat()
        elif update_data["status"] == "delivered":
            update_data["delivery_completed_at"] = datetime.now().isoformat()
    
    await db.laundry_orders.update_one({"id": order_id}, {"$set": update_data})
    
    updated = await db.laundry_orders.find_one({"id": order_id}, {"_id": 0})
    
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    if updated.get("pickup_completed_at") and isinstance(updated["pickup_completed_at"], str):
        updated["pickup_completed_at"] = datetime.fromisoformat(updated["pickup_completed_at"])
    if updated.get("delivery_completed_at") and isinstance(updated["delivery_completed_at"], str):
        updated["delivery_completed_at"] = datetime.fromisoformat(updated["delivery_completed_at"])
    
    return updated


# ==================== TIME SLOT ENDPOINTS ====================

@router.get("/time-slots", response_model=List[TimeSlot])
async def list_time_slots(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    slot_type: Optional[str] = None
):
    """List time slots"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if slot_type:
        query["slot_type"] = slot_type
    
    slots = await db.time_slots.find(query, {"_id": 0}).to_list(100)
    
    for slot in slots:
        if isinstance(slot.get("created_at"), str):
            slot["created_at"] = datetime.fromisoformat(slot["created_at"])
    
    return slots


@router.post("/time-slots", response_model=TimeSlot)
async def create_time_slot(
    slot_data: TimeSlotCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create time slot"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if slot_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create slots for their store")
    
    slot = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": slot_data.store_id,
        "slot_type": slot_data.slot_type,
        "start_time": slot_data.start_time,
        "end_time": slot_data.end_time,
        "max_capacity": slot_data.max_capacity,
        "is_active": True,
        "days_of_week": slot_data.days_of_week,
        "created_at": datetime.now().isoformat()
    }
    
    await db.time_slots.insert_one(slot)
    slot["created_at"] = datetime.fromisoformat(slot["created_at"])
    
    return slot
