from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from middleware.auth import get_current_user, require_role, get_tenant_id
from datetime import datetime
from typing import List, Optional
from uuid import uuid4

router = APIRouter(tags=["Order Management"])

def get_db():
    from server import db
    return db

# ==================== SHARED ORDER ACTIONS ====================

class OrderStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None

class DeliveryPartnerAssignment(BaseModel):
    delivery_partner_id: str

class OrderCancellation(BaseModel):
    reason: str

# ==================== FOOD ORDERS ====================

@router.put("/tenant-admin/orders/{order_id}/status")
async def update_food_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update Food order status and create timeline entry"""
    await require_role(current_user, ["tenant_admin", "vendor"])
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate status transition for food orders
    valid_statuses = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Create timeline entry
    timeline_entry = {
        "status": status_update.status,
        "timestamp": datetime.now().isoformat(),
        "updated_by": current_user["id"],
        "notes": status_update.notes
    }
    
    # Update order
    update_data = {
        "status": status_update.status,
        "updated_at": datetime.now().isoformat()
    }
    
    if status_update.status == "confirmed":
        update_data["confirmed_at"] = datetime.now().isoformat()
    elif status_update.status == "delivered":
        update_data["delivered_at"] = datetime.now().isoformat()
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": update_data,
            "$push": {"status_history": timeline_entry}
        }
    )
    
    return {"success": True, "message": f"Order status updated to {status_update.status}"}

@router.post("/tenant-admin/orders/{order_id}/assign-delivery")
async def assign_delivery_partner(
    order_id: str,
    assignment: DeliveryPartnerAssignment,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Assign delivery partner to order"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify delivery partner exists
    partner = await db.users.find_one({"id": assignment.delivery_partner_id, "role": "delivery"}, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Delivery partner not found")
    
    # Update order
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "delivery_partner_id": assignment.delivery_partner_id,
                "delivery_partner_name": partner.get("name"),
                "updated_at": datetime.now().isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Delivery partner assigned"}

@router.put("/tenant-admin/orders/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    cancellation: OrderCancellation,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cancel order with reason"""
    await require_role(current_user, ["tenant_admin", "vendor"])
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] in ["delivered", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in current status")
    
    # Create timeline entry
    timeline_entry = {
        "status": "cancelled",
        "timestamp": datetime.now().isoformat(),
        "updated_by": current_user["id"],
        "notes": f"Cancelled: {cancellation.reason}"
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": "cancelled",
                "cancellation_reason": cancellation.reason,
                "cancelled_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            "$push": {"status_history": timeline_entry}
        }
    )
    
    return {"success": True, "message": "Order cancelled"}

@router.get("/tenant-admin/orders/{order_id}/history")
async def get_order_history(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get order status timeline/history"""
    await require_role(current_user, ["tenant_admin", "vendor"])
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0, "status_history": 1})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order.get("status_history", [])

# ==================== GROCERY ORDERS ====================

@router.get("/grocery-admin/orders")
async def list_grocery_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List grocery orders"""
    await require_role(current_user, ["tenant_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    query = {"tenant_id": tenant_id, "module": "grocery"}
    if status_filter:
        query["status"] = status_filter
    
    orders = await db.orders.find(query, {"_id": 0}).skip(skip).limit(limit).sort("placed_at", -1).to_list(limit)
    return orders

@router.get("/grocery-admin/orders/{order_id}")
async def get_grocery_order_details(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get grocery order details"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.orders.find_one({"id": order_id, "module": "grocery"}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.put("/grocery-admin/orders/{order_id}/status")
async def update_grocery_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update Grocery order status"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.orders.find_one({"id": order_id, "module": "grocery"}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate status for grocery
    valid_statuses = ["pending", "confirmed", "packing", "ready", "out_for_delivery", "delivered", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Create timeline entry
    timeline_entry = {
        "status": status_update.status,
        "timestamp": datetime.now().isoformat(),
        "updated_by": current_user["id"],
        "notes": status_update.notes
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.now().isoformat()
            },
            "$push": {"status_history": timeline_entry}
        }
    )
    
    return {"success": True, "message": f"Order status updated to {status_update.status}"}

# ==================== LAUNDRY ORDERS ====================

@router.get("/laundry-admin/orders")
async def list_laundry_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List laundry orders"""
    await require_role(current_user, ["tenant_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    query = {"tenant_id": tenant_id}
    if status_filter:
        query["status"] = status_filter
    
    orders = await db.laundry_orders.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    return orders

@router.get("/laundry-admin/orders/{order_id}")
async def get_laundry_order_details(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get laundry order details"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.laundry_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order

@router.put("/laundry-admin/orders/{order_id}/status")
async def update_laundry_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update Laundry order status"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.laundry_orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate status for laundry
    valid_statuses = ["pending", "pickup_assigned", "picked_up", "at_facility", "processing", "ready", "out_for_delivery", "delivered", "cancelled"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Create timeline entry
    timeline_entry = {
        "status": status_update.status,
        "timestamp": datetime.now().isoformat(),
        "updated_by": current_user["id"],
        "notes": status_update.notes
    }
    
    await db.laundry_orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "status": status_update.status,
                "updated_at": datetime.now().isoformat()
            },
            "$push": {"status_history": timeline_entry}
        }
    )
    
    return {"success": True, "message": f"Order status updated to {status_update.status}"}

@router.get("/laundry-admin/orders/{order_id}/history")
async def get_laundry_order_history(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get laundry order status timeline"""
    await require_role(current_user, ["tenant_admin"])
    
    order = await db.laundry_orders.find_one({"id": order_id}, {"_id": 0, "status_history": 1})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order.get("status_history", [])
