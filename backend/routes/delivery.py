from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.order import Delivery, DeliveryUpdate
from middleware.auth import get_current_user, require_role
from datetime import datetime
from typing import List

router = APIRouter(prefix="/delivery", tags=["Delivery Partner"])

def get_db():
    from server import db
    return db

# ==================== AVAILABLE ORDERS ====================

@router.get("/available-orders")
async def get_available_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    lat: float = None,
    lng: float = None,
    limit: int = 20
):
    """
    Get available delivery orders (status: ready, not assigned)
    Only shows orders from the driver's tenant.
    """
    await require_role(current_user, ["delivery", "delivery_partner"])
    tenant_id = current_user.get("tenant_id")
    
    # Build query — filter by tenant_id to only show tenant's orders
    query = {"status": "pending"}
    if tenant_id:
        query["tenant_id"] = tenant_id
    deliveries = await db.deliveries.find(
        {"status": "pending"},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Enrich with order and store details
    for delivery in deliveries:
        order = await db.orders.find_one({"id": delivery["order_id"]}, {"_id": 0})
        if order:
            delivery["order"] = {
                "id": order["id"],
                "order_number": order["order_number"],
                "total_amount": order["total_amount"],
                "payment_method": order["payment_method"],
                "delivery_address": order["delivery_address"],
                "special_instructions": order.get("special_instructions")
            }
            
            # Get store details
            store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
            if store:
                delivery["store"] = {
                    "name": store["name"],
                    "address_line": store["address_line"],
                    "phone": store.get("phone"),
                    "lat": store.get("lat"),
                    "lng": store.get("lng")
                }
                
                # Calculate distance if coordinates provided
                if lat and lng and store.get("lat") and store.get("lng"):
                    from utils.helpers import calculate_distance
                    distance = calculate_distance(lat, lng, store["lat"], store["lng"])
                    delivery["distance_to_store_km"] = distance
    
    return deliveries

# ==================== MY DELIVERIES ====================

@router.get("/my-deliveries")
async def get_my_deliveries(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: str = None
):
    """
    Get delivery partner's assigned deliveries
    """
    await require_role(current_user, ["delivery", "delivery_partner"])
    user_id = current_user["user_id"]
    
    query = {"delivery_partner_id": user_id}
    if status_filter:
        query["status"] = status_filter
    
    deliveries = await db.deliveries.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    
    # Enrich with order details
    for delivery in deliveries:
        order = await db.orders.find_one({"id": delivery["order_id"]}, {"_id": 0})
        if order:
            delivery["order"] = {
                "id": order["id"],
                "order_number": order["order_number"],
                "total_amount": order["total_amount"],
                "payment_method": order["payment_method"],
                "delivery_address": order["delivery_address"]
            }
            
            # Get customer info
            customer = await db.users.find_one({"id": order["customer_id"]}, {"_id": 0, "name": 1, "phone": 1})
            if customer:
                delivery["customer"] = {
                    "name": customer.get("name"),
                    "phone": customer.get("phone")
                }
            
            # Get store info
            store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
            if store:
                delivery["store"] = {
                    "name": store["name"],
                    "address_line": store["address_line"],
                    "phone": store.get("phone"),
                    "lat": store.get("lat"),
                    "lng": store.get("lng")
                }
        
        # Convert datetime strings
        if isinstance(delivery.get("created_at"), str):
            delivery["created_at"] = datetime.fromisoformat(delivery["created_at"])
        if delivery.get("assigned_at") and isinstance(delivery["assigned_at"], str):
            delivery["assigned_at"] = datetime.fromisoformat(delivery["assigned_at"])
        if delivery.get("picked_up_at") and isinstance(delivery["picked_up_at"], str):
            delivery["picked_up_at"] = datetime.fromisoformat(delivery["picked_up_at"])
        if delivery.get("delivered_at") and isinstance(delivery["delivered_at"], str):
            delivery["delivered_at"] = datetime.fromisoformat(delivery["delivered_at"])
    
    return deliveries

# ==================== ACCEPT DELIVERY ====================

@router.post("/accept/{delivery_id}")
async def accept_delivery(
    delivery_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Accept delivery assignment
    """
    await require_role(current_user, ["delivery", "delivery_partner"])
    user_id = current_user["user_id"]
    
    delivery = await db.deliveries.find_one({"id": delivery_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    if delivery["status"] != "pending":
        raise HTTPException(status_code=400, detail="Delivery already assigned")
    
    # Get user details
    user = await db.users.find_one({"id": user_id})
    
    # Update delivery
    await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": {
            "status": "assigned",
            "delivery_partner_id": user_id,
            "delivery_partner_name": user.get("name"),
            "delivery_partner_phone": user.get("phone"),
            "assigned_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    
    return {"success": True, "message": "Delivery accepted"}

# ==================== UPDATE DELIVERY STATUS ====================

@router.put("/status/{delivery_id}")
async def update_delivery_status(
    delivery_id: str,
    status: str,
    proof_image: str = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update delivery status (picked_up, in_transit, delivered, failed)
    """
    await require_role(current_user, ["delivery", "delivery_partner"])
    user_id = current_user["user_id"]
    
    delivery = await db.deliveries.find_one({"id": delivery_id, "delivery_partner_id": user_id})
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    
    # Validate status transition
    valid_statuses = ["assigned", "picked_up", "in_transit", "delivered", "failed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Set timestamps based on status
    if status == "picked_up":
        update_data["picked_up_at"] = datetime.utcnow().isoformat()
        # Update order status
        await db.orders.update_one(
            {"id": delivery["order_id"]},
            {"$set": {"status": "out_for_delivery"}}
        )
    
    elif status == "delivered":
        update_data["delivered_at"] = datetime.utcnow().isoformat()
        if proof_image:
            update_data["delivery_proof_image"] = proof_image
        
        # Update order status
        order = await db.orders.find_one({"id": delivery["order_id"]})
        await db.orders.update_one(
            {"id": delivery["order_id"]},
            {"$set": {
                "status": "delivered",
                "delivered_at": datetime.utcnow().isoformat()
            }}
        )
        
        # Credit vendor wallet
        if order:
            await credit_vendor_wallet(db, order)
    
    await db.deliveries.update_one(
        {"id": delivery_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": f"Status updated to {status}"}

async def credit_vendor_wallet(db, order):
    """
    Credit vendor wallet when order is delivered
    """
    wallet = await db.wallets.find_one({"tenant_id": order["tenant_id"]})
    if not wallet:
        return
    
    payout_amount = order.get("vendor_payout", 0)
    
    if payout_amount > 0:
        new_balance = wallet["balance"] + payout_amount
        
        await db.wallets.update_one(
            {"tenant_id": order["tenant_id"]},
            {"$set": {
                "balance": new_balance,
                "total_earned": wallet["total_earned"] + payout_amount,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        # Create transaction record
        from models.monetization import WalletTransaction
        transaction = WalletTransaction(
            tenant_id=order["tenant_id"],
            wallet_id=wallet["id"],
            transaction_type="credit",
            amount=payout_amount,
            source="order",
            reference_id=order["id"],
            description=f"Order {order['order_number']} delivered",
            balance_after=new_balance
        )
        transaction_dict = transaction.model_dump()
        transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
        await db.wallet_transactions.insert_one(transaction_dict)

# ==================== EARNINGS ====================

@router.get("/earnings")
async def get_earnings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get delivery partner earnings summary
    """
    await require_role(current_user, ["delivery", "delivery_partner"])
    user_id = current_user["user_id"]
    
    # Count completed deliveries
    total_deliveries = await db.deliveries.count_documents({
        "delivery_partner_id": user_id,
        "status": "delivered"
    })
    
    # For MVP, assume fixed earning per delivery (₹50)
    earning_per_delivery = 50
    total_earnings = total_deliveries * earning_per_delivery
    
    # Today's deliveries
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_deliveries = await db.deliveries.count_documents({
        "delivery_partner_id": user_id,
        "status": "delivered",
        "delivered_at": {"$gte": today_start.isoformat()}
    })
    
    today_earnings = today_deliveries * earning_per_delivery
    
    return {
        "total_deliveries": total_deliveries,
        "total_earnings": total_earnings,
        "today_deliveries": today_deliveries,
        "today_earnings": today_earnings,
        "earning_per_delivery": earning_per_delivery
    }
