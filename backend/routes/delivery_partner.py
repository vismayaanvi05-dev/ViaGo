from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import uuid4
import math

from middleware.auth import get_current_user, require_role

router = APIRouter(prefix="/delivery", tags=["Delivery Partner"])

def get_db():
    from server import db
    return db

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

# ==================== DELIVERY PARTNER PROFILE ====================

@router.get("/profile")
async def get_delivery_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get delivery partner profile"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get statistics
    total_deliveries = await db.orders.count_documents({
        "delivery_partner_id": user_id,
        "status": "delivered"
    })
    
    # Get earnings
    earnings_pipeline = [
        {"$match": {"delivery_partner_id": user_id, "status": "delivered"}},
        {"$group": {"_id": None, "total": {"$sum": "$delivery_fee"}}}
    ]
    earnings_result = await db.orders.aggregate(earnings_pipeline).to_list(1)
    total_earnings = earnings_result[0]["total"] if earnings_result else 0
    
    user["stats"] = {
        "total_deliveries": total_deliveries,
        "total_earnings": total_earnings
    }
    
    return user

@router.put("/profile")
async def update_delivery_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update delivery partner profile"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    # Allowed fields
    allowed_fields = ["name", "email", "vehicle_type", "vehicle_number", "profile_photo"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    return {"success": True, "message": "Profile updated"}

# ==================== AVAILABLE DELIVERIES ====================

@router.get("/available")
async def get_available_deliveries(
    lat: float,
    lng: float,
    radius_km: float = 10,
    module: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get available deliveries for delivery partner
    Shows orders that are ready for pickup and not yet assigned
    """
    await require_role(current_user, ["delivery_partner"])
    
    # Query for orders ready for pickup
    query = {
        "$or": [
            {"status": "ready"},  # Food orders ready
            {"status": "packed"},  # Grocery orders packed
            {"status": "confirmed"}  # Laundry confirmed
        ],
        "delivery_partner_id": None  # Not yet assigned
    }
    
    if module:
        query["module"] = module
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(100)
    
    # Calculate distance and filter by radius
    available_deliveries = []
    for order in orders:
        # Get store location
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
        if not store or not store.get("lat") or not store.get("lng"):
            continue
        
        # Calculate distance from delivery partner to store
        distance = calculate_distance(lat, lng, store["lat"], store["lng"])
        
        if distance <= radius_km:
            order["pickup_location"] = {
                "name": store.get("name"),
                "address": store.get("address"),
                "lat": store.get("lat"),
                "lng": store.get("lng"),
                "distance_km": round(distance, 2)
            }
            
            # Get delivery address
            if order.get("delivery_address_id"):
                address = await db.addresses.find_one(
                    {"id": order["delivery_address_id"]},
                    {"_id": 0}
                )
                if address:
                    order["drop_location"] = {
                        "address": address.get("address_line"),
                        "city": address.get("city"),
                        "lat": address.get("lat"),
                        "lng": address.get("lng")
                    }
            
            # Calculate delivery fee (basic calculation)
            if address and address.get("lat") and address.get("lng"):
                delivery_distance = calculate_distance(
                    store["lat"], store["lng"],
                    address["lat"], address["lng"]
                )
                order["delivery_distance_km"] = round(delivery_distance, 2)
                order["estimated_earning"] = round(30 + (delivery_distance * 10), 2)  # Base + per km
            else:
                order["estimated_earning"] = 30
            
            available_deliveries.append(order)
    
    # Sort by distance (closest first)
    available_deliveries.sort(key=lambda x: x["pickup_location"]["distance_km"])
    
    return {
        "deliveries": available_deliveries,
        "total": len(available_deliveries)
    }

# ==================== ACCEPT/REJECT DELIVERY ====================

@router.post("/accept/{order_id}")
async def accept_delivery(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Accept a delivery order"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    # Check if order exists and is available
    order = await db.orders.find_one({
        "id": order_id,
        "delivery_partner_id": None,
        "status": {"$in": ["ready", "packed", "confirmed"]}
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not available")
    
    # Assign to delivery partner
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "delivery_partner_id": user_id,
                "accepted_at": datetime.now(timezone.utc).isoformat(),
                "status": "out_for_pickup"
            }
        }
    )
    
    return {
        "success": True,
        "message": "Delivery accepted",
        "order_id": order_id
    }

@router.post("/reject/{order_id}")
async def reject_delivery(
    order_id: str,
    reason: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Reject a delivery order"""
    await require_role(current_user, ["delivery_partner"])
    
    # Just log the rejection (order remains available for others)
    await db.delivery_rejections.insert_one({
        "id": str(uuid4()),
        "order_id": order_id,
        "delivery_partner_id": current_user["user_id"],
        "reason": reason.get("reason", "Not specified"),
        "rejected_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": "Delivery rejected"}

# ==================== ASSIGNED DELIVERIES ====================

@router.get("/assigned")
async def get_assigned_deliveries(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get deliveries assigned to this delivery partner"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    # Get active deliveries (not yet delivered)
    orders = await db.orders.find({
        "delivery_partner_id": user_id,
        "status": {"$nin": ["delivered", "cancelled"]}
    }, {"_id": 0}).to_list(100)
    
    # Enrich with store and address info
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
        if store:
            order["store"] = {
                "name": store.get("name"),
                "phone": store.get("phone"),
                "address": store.get("address"),
                "lat": store.get("lat"),
                "lng": store.get("lng")
            }
        
        if order.get("delivery_address_id"):
            address = await db.addresses.find_one(
                {"id": order["delivery_address_id"]},
                {"_id": 0}
            )
            if address:
                order["delivery_address"] = address
    
    return {
        "deliveries": orders,
        "total": len(orders)
    }

# ==================== UPDATE DELIVERY STATUS ====================

@router.put("/status/{order_id}")
async def update_delivery_status(
    order_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update delivery status
    Statuses: out_for_pickup → picked_up → out_for_delivery → delivered
    """
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    new_status = status_data.get("status")
    
    # Validate status transition
    valid_statuses = ["picked_up", "out_for_delivery", "delivered"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Check if order is assigned to this partner
    order = await db.orders.find_one({
        "id": order_id,
        "delivery_partner_id": user_id
    }, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or not assigned to you")
    
    # Update order status
    update_data = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if new_status == "picked_up":
        update_data["picked_up_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "out_for_delivery":
        update_data["out_for_delivery_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
        # Add delivery proof if provided
        if status_data.get("proof_photo"):
            update_data["delivery_proof"] = status_data["proof_photo"]
        if status_data.get("delivery_otp"):
            update_data["delivery_otp_verified"] = status_data["delivery_otp"]
    
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    return {
        "success": True,
        "message": f"Status updated to {new_status}",
        "order_id": order_id
    }

# ==================== DELIVERY HISTORY ====================

@router.get("/history")
async def get_delivery_history(
    skip: int = 0,
    limit: int = 20,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get delivery history"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    orders = await db.orders.find({
        "delivery_partner_id": user_id,
        "status": "delivered"
    }, {"_id": 0}).sort("delivered_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with store info
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0, "name": 1})
        if store:
            order["store_name"] = store.get("name")
    
    return {
        "deliveries": orders,
        "total": len(orders)
    }

# ==================== EARNINGS ====================

@router.get("/earnings")
async def get_earnings(
    period: str = "today",  # today, week, month, all
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get delivery partner earnings"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None
    
    # Build query
    query = {
        "delivery_partner_id": user_id,
        "status": "delivered"
    }
    
    if start_date:
        query["delivered_at"] = {"$gte": start_date.isoformat()}
    
    # Get earnings
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": None,
                "total_earnings": {"$sum": "$delivery_fee"},
                "total_deliveries": {"$sum": 1}
            }
        }
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if result:
        earnings = result[0]
        return {
            "period": period,
            "total_earnings": earnings.get("total_earnings", 0),
            "total_deliveries": earnings.get("total_deliveries", 0),
            "average_per_delivery": round(earnings.get("total_earnings", 0) / max(earnings.get("total_deliveries", 1), 1), 2)
        }
    else:
        return {
            "period": period,
            "total_earnings": 0,
            "total_deliveries": 0,
            "average_per_delivery": 0
        }

# ==================== UPDATE LOCATION ====================

@router.put("/location")
async def update_location(
    location_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update delivery partner's current location"""
    await require_role(current_user, ["delivery_partner"])
    
    user_id = current_user["user_id"]
    
    await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "current_location": {
                    "lat": location_data.get("lat"),
                    "lng": location_data.get("lng"),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        }
    )
    
    return {"success": True, "message": "Location updated"}
