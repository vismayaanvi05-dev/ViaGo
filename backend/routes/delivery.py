from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
from uuid import uuid4
import math

from middleware.auth import get_current_user, require_role
from utils.helpers import calculate_distance

router = APIRouter(prefix="/delivery", tags=["Delivery Partner"])

def get_db():
    from server import db
    return db

@router.get("/profile")
async def get_delivery_profile(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    total_deliveries = await db.orders.count_documents({"delivery_partner_id": current_user["user_id"], "status": "delivered"})
    pipeline = [{"$match": {"delivery_partner_id": current_user["user_id"], "status": "delivered"}}, {"$group": {"_id": None, "total": {"$sum": "$delivery_fee"}}}]
    result = await db.orders.aggregate(pipeline).to_list(1)
    total_earnings = result[0]["total"] if result else 0
    
    user["stats"] = {"total_deliveries": total_deliveries, "total_earnings": total_earnings}
    return user

@router.put("/profile")
async def update_delivery_profile(profile_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    allowed = ["name", "email", "vehicle_type", "vehicle_number", "profile_photo"]
    update = {k: v for k, v in profile_data.items() if k in allowed}
    if update:
        update["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": current_user["user_id"]}, {"$set": update})
    return {"success": True, "message": "Profile updated"}

@router.get("/available")
async def get_available_deliveries(
    lat: float, lng: float, radius_km: float = 10, module: str = None,
    current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)
):
    await require_role(current_user, ["delivery_partner"])
    
    query = {
        "$or": [{"status": "ready"}, {"status": "packed"}, {"status": "confirmed"}, {"status": "placed"}],
        "delivery_partner_id": None
    }
    if module:
        query["module"] = module
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(100)
    available = []
    
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
        if not store or not store.get("lat") or not store.get("lng"):
            continue
        
        distance = calculate_distance(lat, lng, store["lat"], store["lng"])
        if distance <= radius_km:
            order["pickup_location"] = {
                "name": store.get("name"),
                "address": store.get("address_line"),
                "city": store.get("city", ""),
                "phone": store.get("phone", "N/A"),
                "lat": store.get("lat"),
                "lng": store.get("lng"),
                "distance_km": distance,
                "store_type": store.get("store_type", "restaurant")
            }
            
            address = order.get("delivery_address") or {}
            order["drop_location"] = {
                "address": address.get("address_line"),
                "city": address.get("city"),
                "landmark": address.get("landmark", ""),
                "lat": address.get("lat"),
                "lng": address.get("lng")
            }
            order["customer_phone"] = order.get("customer_phone") or address.get("phone") or address.get("mobile") or "N/A"
            
            # Customer info
            customer = await db.users.find_one({"id": order.get("customer_id")}, {"_id": 0, "name": 1, "phone": 1})
            if customer:
                order["customer"] = {
                    "name": customer.get("name", "Customer"),
                    "phone": order.get("customer_phone", "N/A")
                }
            
            # Items
            items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
            order["items"] = items
            
            if address.get("lat") and address.get("lng"):
                delivery_distance = calculate_distance(store["lat"], store["lng"], address["lat"], address["lng"])
                order["delivery_distance_km"] = delivery_distance
                order["estimated_earning"] = round(30 + (delivery_distance * 10), 2)
            else:
                order["estimated_earning"] = 50
            
            available.append(order)
    
    available.sort(key=lambda x: x["pickup_location"]["distance_km"])
    return {"deliveries": available, "total": len(available)}

@router.post("/accept/{order_id}")
async def accept_delivery(order_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    
    order = await db.orders.find_one({
        "id": order_id,
        "delivery_partner_id": None,
        "status": {"$in": ["ready", "packed", "confirmed", "placed"]}
    })
    if not order:
        raise HTTPException(status_code=404, detail="Order not available")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "delivery_partner_id": current_user["user_id"],
            "accepted_at": datetime.now(timezone.utc).isoformat(),
            "status": "out_for_pickup"
        }}
    )
    return {"success": True, "message": "Delivery accepted", "order_id": order_id}

@router.post("/reject/{order_id}")
async def reject_delivery(order_id: str, reason: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    await db.delivery_rejections.insert_one({
        "id": str(uuid4()),
        "order_id": order_id,
        "delivery_partner_id": current_user["user_id"],
        "reason": reason.get("reason", "Not specified"),
        "rejected_at": datetime.now(timezone.utc).isoformat()
    })
    return {"success": True, "message": "Delivery rejected"}

@router.get("/assigned")
async def get_assigned_deliveries(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    
    orders = await db.orders.find({
        "delivery_partner_id": current_user["user_id"],
        "status": {"$nin": ["delivered", "cancelled"]}
    }, {"_id": 0}).to_list(100)
    
    for order in orders:
        # Store info with phone
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
        if store:
            order["store"] = {
                "name": store.get("name"),
                "phone": store.get("phone", "N/A"),
                "address": store.get("address_line", ""),
                "city": store.get("city", ""),
                "lat": store.get("lat"),
                "lng": store.get("lng"),
                "store_type": store.get("store_type", "restaurant")
            }
            order["pickup_location"] = {
                "name": store.get("name"),
                "address": store.get("address_line", ""),
                "city": store.get("city", ""),
                "phone": store.get("phone", "N/A"),
                "lat": store.get("lat"),
                "lng": store.get("lng")
            }
        
        # Drop-off with customer phone
        addr = order.get("delivery_address") or {}
        order["drop_location"] = {
            "address": addr.get("address_line", ""),
            "city": addr.get("city", ""),
            "landmark": addr.get("landmark", ""),
            "pincode": addr.get("pincode", ""),
            "lat": addr.get("lat"),
            "lng": addr.get("lng")
        }
        order["customer_phone"] = order.get("customer_phone") or addr.get("phone") or addr.get("mobile") or "N/A"
        
        # Customer info
        customer = await db.users.find_one({"id": order.get("customer_id")}, {"_id": 0, "name": 1, "email": 1, "phone": 1})
        if customer:
            order["customer"] = {
                "name": customer.get("name", "Customer"),
                "phone": order.get("customer_phone", "N/A")
            }
        
        # Order items
        items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
        order["items"] = items
    
    return {"deliveries": orders, "total": len(orders)}

@router.put("/status/{order_id}")
async def update_delivery_status(order_id: str, status_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    new_status = status_data.get("status")
    
    valid_statuses = ["on_the_way", "picked_up", "in_transit", "reached_location", "delivered"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    order = await db.orders.find_one({"id": order_id, "delivery_partner_id": current_user["user_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update = {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if new_status == "on_the_way":
        update["on_the_way_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "picked_up":
        update["picked_up_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "in_transit":
        update["in_transit_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "reached_location":
        update["reached_location_at"] = datetime.now(timezone.utc).isoformat()
    elif new_status == "delivered":
        update["delivered_at"] = datetime.now(timezone.utc).isoformat()
        if status_data.get("proof_photo"):
            update["delivery_proof"] = status_data["proof_photo"]
    
    await db.orders.update_one({"id": order_id}, {"$set": update})
    return {"success": True, "message": f"Status updated to {new_status}", "order_id": order_id}

@router.get("/history")
async def get_delivery_history(skip: int = 0, limit: int = 20, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    
    orders = await db.orders.find(
        {"delivery_partner_id": current_user["user_id"], "status": "delivered"},
        {"_id": 0}
    ).sort("delivered_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0, "name": 1})
        order["store_name"] = store.get("name") if store else "Unknown"
    
    return {"deliveries": orders, "total": len(orders)}

@router.get("/earnings")
async def get_earnings(period: str = "today", current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    
    now = datetime.now(timezone.utc)
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None
    
    query = {"delivery_partner_id": current_user["user_id"], "status": "delivered"}
    if start_date:
        query["delivered_at"] = {"$gte": start_date.isoformat()}
    
    pipeline = [{"$match": query}, {"$group": {"_id": None, "total_earnings": {"$sum": "$delivery_fee"}, "total_deliveries": {"$sum": 1}}}]
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if result:
        data = result[0]
        return {
            "period": period,
            "total_earnings": data.get("total_earnings", 0),
            "total_deliveries": data.get("total_deliveries", 0),
            "average_per_delivery": round(data.get("total_earnings", 0) / max(data.get("total_deliveries", 1), 1), 2)
        }
    return {"period": period, "total_earnings": 0, "total_deliveries": 0, "average_per_delivery": 0}

@router.put("/location")
async def update_location(location_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["delivery_partner"])
    await db.users.update_one(
        {"id": current_user["user_id"]},
        {"$set": {"current_location": {"lat": location_data.get("lat"), "lng": location_data.get("lng"), "updated_at": datetime.now(timezone.utc).isoformat()}}}
    )
    return {"success": True, "message": "Location updated"}
