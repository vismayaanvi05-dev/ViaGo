from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from middleware.auth import get_current_user, require_role
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/customer", tags=["Customer Extensions"])

def get_db():
    from server import db
    return db

# ──────────── RATINGS ────────────

@router.post("/ratings")
async def submit_rating(rating_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    
    order_id = rating_data.get("order_id")
    order = await db.orders.find_one({"id": order_id, "customer_id": current_user["user_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("status") != "delivered":
        raise HTTPException(status_code=400, detail="Can only rate delivered orders")
    
    existing = await db.ratings.find_one({"order_id": order_id, "user_id": current_user["user_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already rated this order")
    
    rating = {
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "store_id": order["store_id"],
        "user_id": current_user["user_id"],
        "delivery_partner_id": order.get("delivery_partner_id"),
        "food_rating": rating_data.get("food_rating", 5),
        "delivery_rating": rating_data.get("delivery_rating", 5),
        "overall_rating": rating_data.get("overall_rating", 5),
        "review": rating_data.get("review", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.ratings.insert_one(rating)
    await db.orders.update_one({"id": order_id}, {"$set": {"is_rated": True}})
    
    # Update store average rating
    pipeline = [
        {"$match": {"store_id": order["store_id"]}},
        {"$group": {"_id": None, "avg": {"$avg": "$overall_rating"}, "count": {"$sum": 1}}}
    ]
    result = await db.ratings.aggregate(pipeline).to_list(1)
    if result:
        await db.stores.update_one(
            {"id": order["store_id"]},
            {"$set": {"avg_rating": round(result[0]["avg"], 1), "total_reviews": result[0]["count"]}}
        )
    
    return {"success": True, "message": "Rating submitted"}

@router.get("/ratings/{store_id}")
async def get_store_ratings(store_id: str, skip: int = 0, limit: int = 20, db: AsyncIOMotorDatabase = Depends(get_db)):
    ratings = await db.ratings.find({"store_id": store_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for r in ratings:
        user = await db.users.find_one({"id": r.get("user_id")}, {"_id": 0, "name": 1})
        r["user_name"] = user.get("name", "Customer") if user else "Customer"
    
    pipeline = [
        {"$match": {"store_id": store_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$overall_rating"}, "count": {"$sum": 1}}}
    ]
    stats = await db.ratings.aggregate(pipeline).to_list(1)
    avg_rating = round(stats[0]["avg"], 1) if stats else 0
    total = stats[0]["count"] if stats else 0
    
    return {"ratings": ratings, "avg_rating": avg_rating, "total_reviews": total}

# ──────────── COUPONS / PROMO CODES ────────────

@router.get("/coupons")
async def get_available_coupons(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    tenant_id = current_user.get("tenant_id")
    query = {"is_active": True}
    if tenant_id:
        query["$or"] = [{"tenant_id": tenant_id}, {"tenant_id": None}]
    
    now = datetime.now(timezone.utc).isoformat()
    coupons = await db.coupons.find(query, {"_id": 0}).to_list(50)
    valid = [c for c in coupons if (not c.get("expires_at") or c["expires_at"] > now)]
    return {"coupons": valid}

@router.post("/coupons/validate")
async def validate_coupon(data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    code = data.get("code", "").upper().strip()
    subtotal = data.get("subtotal", 0)
    
    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    if coupon.get("min_order_value") and subtotal < coupon["min_order_value"]:
        raise HTTPException(status_code=400, detail=f"Minimum order value is ₹{coupon['min_order_value']}")
    
    if coupon.get("usage_limit"):
        used = await db.orders.count_documents({"coupon_code": code, "customer_id": current_user["user_id"]})
        if used >= coupon["usage_limit"]:
            raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if coupon["discount_type"] == "percentage":
        discount = round(subtotal * coupon["discount_value"] / 100, 2)
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    else:
        discount = coupon["discount_value"]
    
    return {
        "valid": True,
        "coupon": coupon,
        "discount": discount,
        "message": f"₹{discount} off applied!"
    }

# ──────────── WALLET ────────────

@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    wallet = await db.wallets.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not wallet:
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "balance": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.wallets.insert_one(wallet)
        wallet.pop("_id", None)
    
    transactions = await db.wallet_transactions.find(
        {"user_id": current_user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    return {"wallet": wallet, "transactions": transactions}

@router.post("/wallet/topup")
async def topup_wallet(data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    amount = data.get("amount", 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    wallet = await db.wallets.find_one({"user_id": current_user["user_id"]})
    if not wallet:
        wallet = {"id": str(uuid.uuid4()), "user_id": current_user["user_id"], "balance": 0}
        await db.wallets.insert_one(wallet)
    
    new_balance = wallet.get("balance", 0) + amount
    await db.wallets.update_one(
        {"user_id": current_user["user_id"]},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    txn = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "type": "credit",
        "amount": amount,
        "description": f"Wallet top-up of ₹{amount}",
        "balance_after": new_balance,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.wallet_transactions.insert_one(txn)
    
    return {"success": True, "balance": new_balance}

# ──────────── ADD-ONS ────────────

@router.get("/items/{item_id}/addons")
async def get_item_addons(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    addons = await db.addons.find({"item_id": item_id, "is_available": True}, {"_id": 0}).to_list(50)
    variants = await db.item_variants.find({"item_id": item_id, "is_available": True}, {"_id": 0}).to_list(50)
    return {"addons": addons, "variants": variants}

# ──────────── DELIVERY SLOTS (Grocery) ────────────

@router.get("/delivery-slots")
async def get_delivery_slots(store_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    slots = await db.delivery_slots.find({"store_id": store_id, "is_active": True}, {"_id": 0}).to_list(50)
    if not slots:
        # Return default slots
        slots = [
            {"id": "slot_1", "label": "Morning", "time_range": "8:00 AM - 11:00 AM", "is_active": True},
            {"id": "slot_2", "label": "Afternoon", "time_range": "12:00 PM - 3:00 PM", "is_active": True},
            {"id": "slot_3", "label": "Evening", "time_range": "4:00 PM - 7:00 PM", "is_active": True},
            {"id": "slot_4", "label": "Night", "time_range": "7:00 PM - 10:00 PM", "is_active": True},
        ]
    return {"slots": slots}

# ──────────── LAUNDRY SERVICES ────────────

@router.get("/laundry-services")
async def get_laundry_services(store_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    services = await db.laundry_services.find({"store_id": store_id, "is_active": True}, {"_id": 0}).to_list(50)
    if not services:
        services = await db.laundry_services.find({"is_active": True}, {"_id": 0}).to_list(50)
    return {"services": services}
