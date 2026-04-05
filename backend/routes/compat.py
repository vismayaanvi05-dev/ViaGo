"""
Compatibility routes to bridge the frontend API expectations with the GitHub backend.
These endpoints adapt the frontend's API calls to the existing backend logic.
"""
from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from utils.helpers import verify_password, create_access_token, get_password_hash
from datetime import datetime, timezone
import uuid

router = APIRouter(tags=["Compatibility"])

def get_db():
    from server import db
    return db


# ==================== DRIVER AUTH ====================

@router.post("/auth/driver/login")
async def driver_login(request: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Driver login with email + password.
    Frontend expects: POST /api/auth/driver/login { email, password }
    """
    email = request.get("email")
    password = request.get("password")

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    user_doc = await db.users.find_one({"email": email, "role": "delivery_partner"}, {"_id": 0})
    if not user_doc:
        # Also check delivery role
        user_doc = await db.users.find_one({"email": email, "role": "delivery"}, {"_id": 0})

    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user_doc.get("password"):
        raise HTTPException(status_code=401, detail="Password not set for this account")

    if not verify_password(password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token_data = {
        "user_id": user_doc["id"],
        "email": user_doc.get("email"),
        "role": user_doc["role"],
        "tenant_id": user_doc.get("tenant_id"),
    }
    access_token = create_access_token(token_data)

    # Remove sensitive fields from response
    user_doc.pop("password", None)

    # Convert datetime fields
    for field in ["created_at", "updated_at"]:
        if isinstance(user_doc.get(field), str):
            user_doc[field] = datetime.fromisoformat(user_doc[field])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_doc,
    }


# ==================== ADMIN - DRIVER MANAGEMENT ====================

from middleware.auth import get_current_user

@router.post("/auth/admin/drivers")
async def create_driver(request: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Create a new driver with password credentials"""
    name = request.get("name")
    email = request.get("email")
    password = request.get("password")
    phone = request.get("phone", "")
    tenant_id = request.get("tenant_id")

    if not all([name, email, password]):
        raise HTTPException(status_code=400, detail="Name, email, and password required")

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already in use")

    driver = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "name": name,
        "email": email,
        "phone": phone,
        "password": get_password_hash(password),
        "role": "delivery",
        "is_active": True,
        "is_online": False,
        "current_lat": None,
        "current_lng": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(driver)
    driver.pop("_id", None)
    driver.pop("password", None)
    return {"success": True, "driver": driver}


@router.get("/auth/admin/drivers")
async def list_drivers(db: AsyncIOMotorDatabase = Depends(get_db)):
    """List all delivery drivers"""
    drivers = await db.users.find(
        {"role": {"$in": ["delivery", "delivery_partner"]}},
        {"_id": 0, "password": 0}
    ).to_list(100)
    return {"drivers": drivers}


@router.get("/admin/settings")
async def get_admin_settings(db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get admin settings"""
    settings = await db.admin_settings.find_one({}, {"_id": 0})
    if not settings:
        settings = {
            "id": str(uuid.uuid4()),
            "app_name": "ViaGo",
            "primary_color": "#8B5CF6",
            "secondary_color": "#10B981",
            "delivery_charge_type": "flat",
            "flat_delivery_charge": 30,
            "tax_percentage": 5,
            "commission_percentage": 15,
        }
        await db.admin_settings.insert_one(settings)
    return settings


@router.put("/admin/settings")
async def update_admin_settings(data: dict, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Update admin settings"""
    await db.admin_settings.update_one({}, {"$set": data}, upsert=True)
    return {"success": True}


# ==================== CUSTOMER RATINGS (compat for /customer/ratings) ====================

@router.post("/customer/ratings")
async def submit_rating(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Frontend calls POST /api/customer/ratings
    Backend has POST /api/customer/reviews — this adapts the call.
    """
    review = {
        "id": str(uuid.uuid4()),
        "order_id": data.get("order_id"),
        "store_id": data.get("store_id"),
        "customer_id": current_user["user_id"],
        "food_rating": data.get("food_rating", data.get("rating")),
        "delivery_rating": data.get("delivery_rating"),
        "overall_rating": data.get("overall_rating", data.get("rating", 5)),
        "comment": data.get("comment", ""),
        "images": data.get("images", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reviews.insert_one(review)
    review.pop("_id", None)
    return {"success": True, "review": review}


@router.get("/customer/ratings/{store_id}")
async def get_store_ratings(store_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get ratings for a store"""
    reviews = await db.reviews.find(
        {"store_id": store_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"ratings": reviews}


# ==================== CUSTOMER COUPONS VALIDATE ====================

@router.post("/customer/coupons/validate")
async def validate_coupon(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Frontend calls POST /api/customer/coupons/validate { code, subtotal }
    """
    code = data.get("code")
    subtotal = data.get("subtotal", 0)

    coupon = await db.coupons.find_one({"code": code, "is_active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    if subtotal < coupon.get("min_order_value", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order of ₹{coupon.get('min_order_value', 0)} required"
        )

    if coupon.get("discount_type") == "flat":
        discount = coupon["discount_value"]
    else:
        discount = (subtotal * coupon["discount_value"]) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])

    return {
        "valid": True,
        "discount": round(discount, 2),
        "coupon": coupon,
    }


# ==================== WALLET ====================

@router.get("/customer/wallet")
async def get_wallet(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get customer wallet balance and transactions"""
    user_id = current_user["user_id"]
    wallet = await db.wallets.find_one({"user_id": user_id}, {"_id": 0})
    if not wallet:
        wallet = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "balance": 0,
            "transactions": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.wallets.insert_one(wallet)
        wallet.pop("_id", None)
    
    transactions = await db.wallet_transactions.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    wallet["transactions"] = transactions
    return wallet


@router.post("/customer/wallet/topup")
async def topup_wallet(
    data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Top up wallet balance"""
    user_id = current_user["user_id"]
    amount = data.get("amount", 0)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    wallet = await db.wallets.find_one({"user_id": user_id})
    if not wallet:
        wallet = {"id": str(uuid.uuid4()), "user_id": user_id, "balance": 0}
        await db.wallets.insert_one(wallet)

    new_balance = wallet.get("balance", 0) + amount
    await db.wallets.update_one(
        {"user_id": user_id},
        {"$set": {"balance": new_balance, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    txn = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "topup",
        "amount": amount,
        "balance_after": new_balance,
        "description": f"Wallet top-up of ₹{amount}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.wallet_transactions.insert_one(txn)
    txn.pop("_id", None)

    return {"success": True, "balance": new_balance, "transaction": txn}


# ==================== ITEM ADD-ONS ====================

@router.get("/customer/items/{item_id}/addons")
async def get_item_addons(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get add-ons for a specific item"""
    addons = await db.add_ons.find(
        {"item_id": item_id, "is_available": True}, {"_id": 0}
    ).to_list(50)
    return {"addons": addons}


# ==================== DELIVERY SLOTS ====================

@router.get("/customer/delivery-slots")
async def get_delivery_slots(
    store_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get delivery slots for a store (Grocery)"""
    slots = await db.delivery_slots.find(
        {"store_id": store_id, "is_active": True}, {"_id": 0}
    ).to_list(50)
    if not slots:
        # Default slots
        slots = [
            {"id": "slot-1", "label": "Morning", "time": "8:00 AM - 11:00 AM", "is_active": True},
            {"id": "slot-2", "label": "Afternoon", "time": "12:00 PM - 3:00 PM", "is_active": True},
            {"id": "slot-3", "label": "Evening", "time": "5:00 PM - 8:00 PM", "is_active": True},
        ]
    return {"slots": slots}


# ==================== LAUNDRY SERVICES ====================

@router.get("/customer/laundry-services")
async def get_laundry_services(
    store_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get laundry services for a store"""
    services = await db.laundry_services.find(
        {"store_id": store_id, "is_active": True}, {"_id": 0}
    ).to_list(50)
    if not services:
        services = [
            {"id": "ls-1", "name": "Wash & Fold", "price_per_kg": 50, "is_active": True},
            {"id": "ls-2", "name": "Wash & Iron", "price_per_kg": 70, "is_active": True},
            {"id": "ls-3", "name": "Dry Clean", "price_per_kg": 120, "is_active": True},
        ]
    return {"services": services}
