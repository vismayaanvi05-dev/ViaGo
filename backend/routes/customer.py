from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import Address, AddressCreate, AddressUpdate
from models.store import Store
from models.item import Item
from models.order import Order, OrderCreate, OrderItem, Review, ReviewCreate
from models.monetization import WalletTransaction
from middleware.auth import get_current_user, require_role
from utils.helpers import (
    generate_order_number, calculate_distance, calculate_delivery_charge,
    calculate_tax, calculate_commission, calculate_admin_markup
)
from datetime import datetime
from typing import List
import uuid

router = APIRouter(prefix="/customer", tags=["Customer"])

def get_db():
    from server import db
    return db

# ==================== APP CONFIGURATION ====================

@router.get("/config")
async def get_app_config(
    lat: float = None,
    lng: float = None,
    city: str = None,
    town: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get app configuration and available modules based on exact city/town match.
    Only returns modules that have active stores from tenants in the customer's city.
    """
    from utils.helpers import get_tenant_ids_by_location

    # Default config
    config = {
        "app_name": "HyperServe",
        "version": "1.0.0",
        "available_modules": [],
        "theme": {
            "primary_color": "#8B5CF6",
            "secondary_color": "#EC4899"
        }
    }

    # Get matching tenant IDs based on exact city/town match
    matching_tenant_ids = await get_tenant_ids_by_location(db, lat, lng, town=town, city=city)

    if not matching_tenant_ids:
        return config

    # Base query: only stores from matched tenants
    base_query = {
        "is_active": True,
        "is_accepting_orders": True,
        "tenant_id": {"$in": matching_tenant_ids}
    }

    # Check Food stores
    food_stores = await db.stores.find({**base_query, "store_type": "restaurant"}).to_list(1)
    if food_stores:
        config["available_modules"].append("food")

    # Check Grocery stores
    grocery_stores = await db.stores.find({**base_query, "store_type": "grocery"}).to_list(1)
    if grocery_stores:
        config["available_modules"].append("grocery")

    # Check Laundry stores
    laundry_stores = await db.stores.find({**base_query, "store_type": "laundry"}).to_list(1)
    if laundry_stores:
        config["available_modules"].append("laundry")

    return config



@router.get("/app-settings")
async def get_app_settings(
    tenant_id: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get app settings including privacy policy, terms, and support details
    Used by mobile apps to display legal and support information
    """
    # If no tenant_id provided, get the first tenant (for single-tenant deployments)
    # In production, this should be determined by app domain or user's tenant
    if not tenant_id:
        tenant = await db.tenants.find_one({}, {"_id": 0, "id": 1})
        if tenant:
            tenant_id = tenant["id"]
    
    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="Tenant ID required"
        )
    
    # Get tenant settings
    settings = await db.tenant_settings.find_one(
        {"tenant_id": tenant_id},
        {"_id": 0}
    )
    
    if not settings:
        # Return default values if no settings found
        return {
            "privacy_policy": "Privacy policy not configured yet.",
            "terms_and_conditions": "Terms and conditions not configured yet.",
            "support_email": "",
            "support_phone": "",
            "support_website": "",
            "support_hours": "9:00 AM - 6:00 PM (Mon-Sat)"
        }
    
    # Return only the fields mobile apps need
    return {
        "privacy_policy": settings.get("privacy_policy", ""),
        "terms_and_conditions": settings.get("terms_and_conditions", ""),
        "support_email": settings.get("support_email", ""),
        "support_phone": settings.get("support_phone", ""),
        "support_website": settings.get("support_website", ""),
        "support_hours": settings.get("support_hours", "9:00 AM - 6:00 PM (Mon-Sat)")
    }

# ==================== STORE DISCOVERY (MULTI-MODULE) ====================

@router.get("/stores")
async def discover_stores(
    lat: float,
    lng: float,
    module: str = None,  # 'food', 'grocery', 'laundry'
    town: str = None,  # Customer's town/village
    city: str = None,  # Customer's city (from reverse geocoding)
    search: str = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Discover stores based on location and module.
    Exact town/city match only — shows stores from tenants whose registered
    town/city matches the customer's current city.
    """
    from utils.helpers import get_tenant_ids_by_location
    
    # Get matching tenant IDs based on exact city/town match
    matching_tenant_ids = await get_tenant_ids_by_location(db, lat, lng, town=town, city=city)
    
    if not matching_tenant_ids:
        return {
            "stores": [],
            "total": 0,
            "module": module,
            "message": "No services available in your area yet"
        }
    
    # Build query - filter by matched tenant IDs (tenant's city already verified)
    query = {
        "is_active": True,
        "is_accepting_orders": True,
        "tenant_id": {"$in": matching_tenant_ids}
    }
    
    # Filter by module
    if module:
        store_type_map = {
            "food": "restaurant",
            "grocery": "grocery",
            "laundry": "laundry"
        }
        query["store_type"] = store_type_map.get(module, "restaurant")
    
    # Search by name
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    stores = await db.stores.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Calculate distance for display purposes only (no filtering by radius)
    for store in stores:
        if store.get("lat") and store.get("lng"):
            distance = calculate_distance(lat, lng, store["lat"], store["lng"])
            store["distance_km"] = round(distance, 2)
        else:
            store["distance_km"] = None
        store["is_deliverable"] = True
    
    # Sort by distance (nearest first)
    stores.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 999)
    
    # Enrich with tenant info
    store_ids = [store["id"] for store in stores]
    tenant_ids = list(set([store["tenant_id"] for store in stores]))
    
    # Batch fetch tenants
    tenants = await db.tenants.find(
        {"id": {"$in": tenant_ids}},
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(len(tenant_ids)) if tenant_ids else []
    tenant_map = {t["id"]: t["name"] for t in tenants}
    
    # Batch fetch reviews
    review_pipeline = [
        {"$match": {"store_id": {"$in": store_ids}}},
        {"$group": {
            "_id": "$store_id",
            "avg_rating": {"$avg": "$overall_rating"},
            "total_reviews": {"$sum": 1}
        }}
    ] if store_ids else []
    review_stats = await db.reviews.aggregate(review_pipeline).to_list(len(store_ids)) if store_ids else []
    review_map = {r["_id"]: r for r in review_stats}
    
    # Apply enrichment
    for store in stores:
        store["tenant_name"] = tenant_map.get(store["tenant_id"], "Unknown")
        
        if store["id"] in review_map:
            stats = review_map[store["id"]]
            store["rating"] = round(stats["avg_rating"], 1)
            store["total_reviews"] = stats["total_reviews"]
        else:
            store["rating"] = 0
            store["total_reviews"] = 0
    
    return {
        "stores": stores,
        "total": len(stores),
        "module": module
    }

# ==================== SEARCH ====================

@router.get("/search")
async def search_stores_and_items(
    q: str,
    lat: float,
    lng: float,
    module: str = None,
    city: str = None,
    town: str = None,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Search across stores and items — filtered by tenant location (exact city match)
    """
    from utils.helpers import get_tenant_ids_by_location
    
    # Get matching tenant IDs based on exact city/town match
    matching_tenant_ids = await get_tenant_ids_by_location(db, lat, lng, town=town, city=city)
    
    results = {
        "stores": [],
        "items": []
    }
    
    if not matching_tenant_ids:
        return results
    
    # Search stores — filtered by tenant and city
    store_query = {
        "is_active": True,
        "is_accepting_orders": True,
        "name": {"$regex": q, "$options": "i"},
        "tenant_id": {"$in": matching_tenant_ids}
    }
    
    # Also filter by store city if provided
    match_city = city or town
    if match_city:
        store_query["$or"] = [
            {"city": {"$regex": f"^{match_city}$", "$options": "i"}},
            {"town": {"$regex": f"^{match_city}$", "$options": "i"}},
        ]
    
    if module:
        store_type_map = {"food": "restaurant", "grocery": "grocery", "laundry": "laundry"}
        store_query["store_type"] = store_type_map.get(module)
    
    stores = await db.stores.find(store_query, {"_id": 0}).limit(10).to_list(10)
    
    # Calculate distances for display
    for store in stores:
        if store.get("lat") and store.get("lng"):
            distance = calculate_distance(lat, lng, store["lat"], store["lng"])
            store["distance_km"] = round(distance, 2)
        store["is_deliverable"] = True
        results["stores"].append(store)
    
    # Search items — only from matched tenant stores
    matched_store_ids_list = [s["id"] for s in stores]
    
    # Also get all store IDs belonging to matched tenants for item search
    tenant_stores = await db.stores.find(
        {"tenant_id": {"$in": matching_tenant_ids}, "is_active": True},
        {"_id": 0, "id": 1}
    ).to_list(500)
    all_tenant_store_ids = [s["id"] for s in tenant_stores]
    
    items = await db.items.find({
        "name": {"$regex": q, "$options": "i"},
        "is_available": True,
        "store_id": {"$in": all_tenant_store_ids}
    }, {"_id": 0}).limit(20).to_list(20)
    
    # Batch fetch store info
    item_store_ids = list(set([item.get("store_id") for item in items if item.get("store_id")]))
    item_stores = await db.stores.find(
        {"id": {"$in": item_store_ids}},
        {"_id": 0, "id": 1, "name": 1, "store_type": 1}
    ).to_list(len(item_store_ids)) if item_store_ids else []
    store_map = {s["id"]: s for s in item_stores}
    
    for item in items:
        store_id = item.get("store_id")
        if store_id and store_id in store_map:
            store = store_map[store_id]
            item["store_name"] = store.get("name")
            item["store_type"] = store.get("store_type")
        results["items"].append(item)
    
    return results

# ==================== PROFILE MANAGEMENT ====================

@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get customer profile
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get order stats
    total_orders = await db.orders.count_documents({"customer_id": user_id})
    user["total_orders"] = total_orders
    
    return user

@router.put("/profile")
async def update_profile(
    profile_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update customer profile
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    # Allowed fields to update
    allowed_fields = ["name", "email", "phone", "profile_photo"]
    update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
    
    return {"success": True, "message": "Profile updated successfully"}

# ==================== CART MANAGEMENT ====================

@router.post("/cart/add")
async def add_to_cart(
    cart_item: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Add item to cart
    Rule: One cart = One store
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    # Get current cart
    cart = await db.carts.find_one({"user_id": user_id})
    
    # Check if cart exists and is from different store
    if cart and cart.get("store_id") != cart_item.get("store_id"):
        return {
            "success": False,
            "error": "cart_conflict",
            "message": "Your cart contains items from another store. Clear cart to continue.",
            "current_store_id": cart.get("store_id")
        }
    
    # Validate store
    store = await db.stores.find_one({"id": cart_item.get("store_id")})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Validate item
    item = await db.items.find_one({"id": cart_item.get("item_id")})
    if not item or not item.get("is_available"):
        raise HTTPException(status_code=400, detail="Item not available")
    
    # Create or update cart
    if not cart:
        cart = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "store_id": cart_item.get("store_id"),
            "tenant_id": store.get("tenant_id"),
            "module": store.get("store_type"),
            "items": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    
    # Check if item already in cart
    existing_item = next((i for i in cart["items"] if i["item_id"] == cart_item["item_id"] 
                         and i.get("variant_id") == cart_item.get("variant_id")), None)
    
    if existing_item:
        # Update quantity
        existing_item["quantity"] += cart_item.get("quantity", 1)
    else:
        # Add new item
        cart["items"].append({
            "id": str(uuid.uuid4()),
            "item_id": cart_item["item_id"],
            "item_name": item["name"],
            "quantity": cart_item.get("quantity", 1),
            "unit_price": item.get("base_price", item.get("price", 0)),
            "variant_id": cart_item.get("variant_id"),
            "add_ons": cart_item.get("add_ons", []),
            "added_at": datetime.utcnow().isoformat()
        })
    
    cart["updated_at"] = datetime.utcnow().isoformat()
    
    # Remove _id before update to avoid serialization issues
    cart.pop("_id", None)
    
    # Upsert cart
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": cart},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Item added to cart",
        "cart": cart
    }

@router.get("/cart")
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get current cart
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    cart = await db.carts.find_one({"user_id": user_id}, {"_id": 0})
    
    if not cart:
        return {
            "cart": None,
            "subtotal": 0,
            "item_count": 0
        }
    
    # Calculate subtotal
    subtotal = 0
    for item in cart.get("items", []):
        subtotal += item["unit_price"] * item["quantity"]
    
    # Get store info
    store = await db.stores.find_one({"id": cart.get("store_id")}, {"_id": 0})
    
    return {
        "cart": cart,
        "store": store,
        "subtotal": subtotal,
        "item_count": len(cart.get("items", []))
    }

@router.put("/cart/update")
async def update_cart_item(
    update_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update cart item quantity
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Find and update item
    item_found = False
    for item in cart["items"]:
        if item["item_id"] == update_data.get("item_id"):
            item["quantity"] = update_data.get("quantity", 1)
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    cart["updated_at"] = datetime.utcnow().isoformat()
    
    # Remove _id before update to avoid serialization issues
    cart.pop("_id", None)
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": cart}
    )
    
    return {"success": True, "message": "Cart updated", "cart": cart}

@router.delete("/cart/remove")
async def remove_from_cart(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Remove item from cart
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Remove item
    cart["items"] = [item for item in cart["items"] if item["item_id"] != item_id]
    cart["updated_at"] = datetime.utcnow().isoformat()
    
    # If cart is empty, delete it
    if not cart["items"]:
        await db.carts.delete_one({"user_id": user_id})
        return {"success": True, "message": "Cart is now empty"}
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": cart}
    )
    
    return {"success": True, "message": "Item removed from cart", "cart": cart}

@router.delete("/cart/clear")
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Clear entire cart
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    result = await db.carts.delete_one({"user_id": user_id})
    
    if result.deleted_count == 0:
        return {"success": True, "message": "Cart was already empty"}
    
    return {"success": True, "message": "Cart cleared successfully"}

# ==================== MODULE-SPECIFIC ENDPOINTS ====================

@router.get("/stores/{store_id}/grocery")
async def get_grocery_inventory(
    store_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get grocery store inventory with categories
    """
    await require_role(current_user, ["customer"])
    
    store = await db.stores.find_one(
        {"id": store_id, "store_type": "grocery", "is_active": True},
        {"_id": 0}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Grocery store not found")
    
    # Get categories
    categories = await db.categories.find(
        {"store_id": store_id, "module": "grocery", "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Get items for each category
    for category in categories:
        items = await db.grocery_items.find(
            {"category_id": category["id"], "is_available": True},
            {"_id": 0}
        ).to_list(500)
        
        # Enrich with inventory
        for item in items:
            inventory = await db.grocery_inventory.find_one(
                {"item_id": item["id"]},
                {"_id": 0}
            )
            if inventory:
                item["current_stock"] = inventory.get("current_stock", 0)
                item["in_stock"] = inventory.get("current_stock", 0) > 0
            else:
                item["current_stock"] = 0
                item["in_stock"] = False
        
        category["items"] = items
    
    store["categories"] = categories
    
    return store

@router.get("/stores/{store_id}/laundry")
async def get_laundry_services(
    store_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get laundry store services and pricing
    """
    await require_role(current_user, ["customer"])
    
    store = await db.stores.find_one(
        {"id": store_id, "store_type": "laundry", "is_active": True},
        {"_id": 0}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Laundry store not found")
    
    # Get service categories
    categories = await db.laundry_categories.find(
        {"store_id": store_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Get items for each category
    for category in categories:
        items = await db.laundry_items.find(
            {"category_id": category["id"], "is_active": True},
            {"_id": 0}
        ).to_list(100)
        
        # Get pricing for each item
        for item in items:
            pricing = await db.laundry_pricing.find(
                {"item_id": item["id"]},
                {"_id": 0}
            ).to_list(10)
            item["pricing"] = pricing
        
        category["items"] = items
    
    # Get available time slots
    slots = await db.laundry_slots.find(
        {"store_id": store_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    store["categories"] = categories
    store["available_slots"] = slots
    
    return store

# ==================== COUPONS ====================

@router.get("/coupons")
async def get_available_coupons(
    store_id: str = None,
    module: str = None,
    city: str = None,
    town: str = None,
    lat: float = None,
    lng: float = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get available coupons for customer — filtered by tenant city match
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]

    from utils.helpers import get_tenant_ids_by_location

    # Get matching tenant IDs based on exact city/town match
    matching_tenant_ids = await get_tenant_ids_by_location(db, lat, lng, town=town, city=city)

    if not matching_tenant_ids:
        return []

    # Build query
    query = {
        "is_active": True,
        "valid_from": {"$lte": datetime.utcnow()},
        "valid_until": {"$gte": datetime.utcnow()},
        "$or": [
            {"tenant_id": {"$in": matching_tenant_ids}},
            {"tenant_id": None},   # Platform-wide coupons
            {"tenant_id": {"$exists": False}},
        ]
    }
    
    if store_id:
        # Also allow store-specific coupons
        query["$or"].append({"store_id": store_id})
    
    if module:
        query["$or"] = [
            {"applicable_modules": module},
            {"applicable_modules": []},  # All modules
            {"applicable_modules": {"$exists": False}},
        ]
    
    coupons = await db.coupons.find(query, {"_id": 0}).to_list(100)
    
    # Check usage for each coupon
    for coupon in coupons:
        # Check if user has already used this coupon
        usage_count = await db.coupon_usage.count_documents({
            "coupon_id": coupon["id"],
            "user_id": user_id
        })
        
        coupon["user_used"] = usage_count >= coupon.get("usage_limit_per_user", 1)
        coupon["remaining_uses"] = max(0, coupon.get("usage_limit_per_user", 1) - usage_count)
    
    return coupons

@router.post("/cart/apply-coupon")
async def apply_coupon(
    coupon_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Apply coupon to cart
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    coupon_code = coupon_data.get("coupon_code")
    
    # Get cart
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart is empty")
    
    # Validate coupon
    coupon = await db.coupons.find_one({
        "code": coupon_code,
        "is_active": True
    })
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    
    # Check validity dates
    now = datetime.utcnow()
    valid_from = datetime.fromisoformat(coupon["valid_from"]) if isinstance(coupon["valid_from"], str) else coupon["valid_from"]
    valid_until = datetime.fromisoformat(coupon["valid_until"]) if isinstance(coupon["valid_until"], str) else coupon["valid_until"]
    
    if now < valid_from or now > valid_until:
        raise HTTPException(status_code=400, detail="Coupon expired or not yet valid")
    
    # Check usage limit
    usage_count = await db.coupon_usage.count_documents({
        "coupon_id": coupon["id"],
        "user_id": user_id
    })
    
    if usage_count >= coupon.get("usage_limit_per_user", 1):
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    # Calculate cart subtotal
    subtotal = sum(item["unit_price"] * item["quantity"] for item in cart["items"])
    
    # Check minimum order value
    if subtotal < coupon.get("min_order_value", 0):
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value of ₹{coupon['min_order_value']} required"
        )
    
    # Calculate discount
    if coupon["discount_type"] == "flat":
        discount = coupon["discount_value"]
    else:  # percentage
        discount = (subtotal * coupon["discount_value"]) / 100
        if coupon.get("max_discount"):
            discount = min(discount, coupon["max_discount"])
    
    # Update cart with coupon
    cart["applied_coupon"] = {
        "code": coupon_code,
        "coupon_id": coupon["id"],
        "discount_amount": discount
    }
    cart["updated_at"] = datetime.utcnow().isoformat()
    
    await db.carts.update_one(
        {"user_id": user_id},
        {"$set": cart}
    )
    
    return {
        "success": True,
        "message": "Coupon applied successfully",
        "discount": discount,
        "cart": cart
    }

# ==================== ADDRESS MANAGEMENT ====================

@router.post("/addresses", response_model=Address)
async def create_address(
    address_data: AddressCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new delivery address
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    # If this is set as default, unset other defaults
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": user_id},
            {"$set": {"is_default": False}}
        )
    
    address = Address(user_id=user_id, **address_data.model_dump())
    address_dict = address.model_dump()
    address_dict["created_at"] = address_dict["created_at"].isoformat()
    
    await db.addresses.insert_one(address_dict)
    return address

@router.get("/addresses")
async def list_my_addresses(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List all user addresses
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    addresses = await db.addresses.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    for address in addresses:
        if isinstance(address.get("created_at"), str):
            address["created_at"] = datetime.fromisoformat(address["created_at"])
        # Handle field name variations from seeded data
        if "address_line1" in address and "address_line" not in address:
            address["address_line"] = f"{address.get('address_line1', '')} {address.get('address_line2', '')}".strip()
        if "label" in address and "address_type" not in address:
            address["address_type"] = address.get("label", "home").lower()
    
    return addresses

@router.put("/addresses/{address_id}", response_model=Address)
async def update_address(
    address_id: str,
    address_data: AddressUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update address
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    address = await db.addresses.find_one({"id": address_id, "user_id": user_id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # If setting as default, unset others
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": user_id},
            {"$set": {"is_default": False}}
        )
    
    update_data = {k: v for k, v in address_data.model_dump(exclude_unset=True).items()}
    
    await db.addresses.update_one(
        {"id": address_id},
        {"$set": update_data}
    )
    
    updated_address = await db.addresses.find_one({"id": address_id}, {"_id": 0})
    
    if isinstance(updated_address.get("created_at"), str):
        updated_address["created_at"] = datetime.fromisoformat(updated_address["created_at"])
    
    return updated_address

@router.delete("/addresses/{address_id}")
async def delete_address(
    address_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete address
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    result = await db.addresses.delete_one({"id": address_id, "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    
    return {"success": True, "message": "Address deleted"}

# ==================== BROWSE RESTAURANTS ====================

@router.get("/restaurants")
async def browse_restaurants(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    lat: float = None,
    lng: float = None,
    town: str = None,
    city: str = None,
    cuisine_type: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 20
):
    """
    Browse available restaurants (food module)
    Strict location-based: Only show restaurants from tenants matching customer's city/town
    """
    await require_role(current_user, ["customer"])
    
    from utils.helpers import get_tenant_ids_by_location
    
    # Get matching tenant IDs based on exact city/town match
    matching_tenant_ids = await get_tenant_ids_by_location(db, lat, lng, town=town, city=city)
    
    if not matching_tenant_ids:
        return []
    
    query = {
        "store_type": "restaurant",
        "is_active": True,
        "is_accepting_orders": True,
        "tenant_id": {"$in": matching_tenant_ids}
    }
    
    # Also filter by store city for strict matching
    match_city = city or town
    if match_city:
        query["$or"] = [
            {"city": {"$regex": f"^{match_city}$", "$options": "i"}},
            {"town": {"$regex": f"^{match_city}$", "$options": "i"}},
        ]
    
    if cuisine_type:
        query["cuisine_types"] = cuisine_type
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    stores = await db.stores.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Calculate distance for display only — no radius filtering
    if lat and lng:
        for store in stores:
            if store.get("lat") and store.get("lng"):
                distance = calculate_distance(lat, lng, store["lat"], store["lng"])
                store["distance_km"] = round(distance, 2)
            else:
                store["distance_km"] = None
            store["is_deliverable"] = True  # Always deliverable within same city
    
    # Get tenant info (Batch fetch to avoid N+1 query)
    tenant_ids = list(set(store["tenant_id"] for store in stores if store.get("tenant_id")))
    if tenant_ids:
        tenants = await db.tenants.find(
            {"id": {"$in": tenant_ids}}, 
            {"_id": 0, "id": 1, "name": 1, "logo_url": 1}
        ).to_list(len(tenant_ids))
        tenant_map = {t["id"]: t for t in tenants}
        
        for store in stores:
            tenant = tenant_map.get(store["tenant_id"])
            if tenant:
                store["tenant_name"] = tenant.get("name")
    
    # Convert datetime strings
    for store in stores:
        if isinstance(store.get("created_at"), str):
            store["created_at"] = datetime.fromisoformat(store["created_at"])
        if isinstance(store.get("updated_at"), str):
            store["updated_at"] = datetime.fromisoformat(store["updated_at"])
    
    return stores

@router.get("/restaurants/{store_id}")
async def get_restaurant_details(
    store_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get restaurant details with menu
    """
    await require_role(current_user, ["customer"])
    
    store = await db.stores.find_one(
        {"id": store_id, "is_active": True},
        {"_id": 0}
    )
    
    if not store:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Determine module from store type
    store_type = store.get("store_type", "restaurant")
    module_map = {"restaurant": "food", "grocery": "grocery", "laundry": "laundry"}
    module = module_map.get(store_type, "food")
    
    # Get categories for this store (matching the store's actual module)
    categories = await db.categories.find(
        {"store_id": store_id, "module": module, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # If no categories found with module filter, try without module filter
    if not categories:
        categories = await db.categories.find(
            {"store_id": store_id, "is_active": True},
            {"_id": 0}
        ).to_list(100)
    
    # Get items for each category
    for category in categories:
        items = await db.items.find(
            {"category_id": category["id"], "is_available": True, "is_deleted": {"$ne": True}},
            {"_id": 0}
        ).to_list(100)
        
        # Get variants and add-ons for each item
        for item in items:
            variants = await db.item_variants.find(
                {"item_id": item["id"], "is_available": True},
                {"_id": 0}
            ).to_list(100)
            item["variants"] = variants
            
            addons = await db.add_ons.find(
                {"item_id": item["id"], "is_available": True},
                {"_id": 0}
            ).to_list(100)
            item["addons"] = addons
        
        category["items"] = items
    
    store["categories"] = categories
    
    return store

# ==================== ORDER PLACEMENT ====================

@router.post("/orders")
async def place_order(
    order_data: OrderCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Place new order
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    # Validate store
    store = await db.stores.find_one({"id": order_data.store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    if not store["is_active"] or not store["is_accepting_orders"]:
        raise HTTPException(status_code=400, detail="Store not accepting orders")
    
    # Validate address
    address = await db.addresses.find_one({"id": order_data.delivery_address_id, "user_id": user_id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Remove _id from address before storing in order
    address.pop("_id", None)
    
    # Get tenant settings (with fallback defaults)
    settings = await db.tenant_settings.find_one({"tenant_id": store["tenant_id"]})
    if not settings:
        # Use sensible defaults so orders can still be placed
        settings = {
            "tenant_id": store["tenant_id"],
            "delivery_charge_type": "flat",
            "flat_delivery_charge": 30,
            "delivery_charge_per_km": 0,
            "free_delivery_above": None,
            "tax_enabled": True,
            "tax_percentage": 5,
        }
    
    # Calculate order amounts
    subtotal = 0
    admin_markup_total = 0
    order_items = []
    
    for item_data in order_data.items:
        # Get item
        item = await db.items.find_one({"id": item_data["item_id"]})
        if not item or not item["is_available"]:
            raise HTTPException(status_code=400, detail=f"Item {item_data['item_id']} not available")
        
        # Get variant if specified
        variant = None
        variant_name = None
        unit_price = item["base_price"]
        
        if item_data.get("variant_id"):
            variant = await db.item_variants.find_one({"id": item_data["variant_id"]})
            if variant:
                unit_price = variant["price"]
                variant_name = variant["name"]
        
        # Calculate item price with admin markup
        admin_markup_per_item = item.get("admin_markup_amount", 0)
        item_price_with_markup = unit_price + admin_markup_per_item
        
        # Calculate add-ons
        addons_total = 0
        addons_list = []
        for addon_id in item_data.get("add_ons", []):
            addon = await db.add_ons.find_one({"id": addon_id})
            if addon:
                addons_total += addon["price"]
                addons_list.append({
                    "id": addon["id"],
                    "name": addon["name"],
                    "price": addon["price"]
                })
        
        quantity = item_data["quantity"]
        total_item_price = (item_price_with_markup + addons_total) * quantity
        
        subtotal += total_item_price
        admin_markup_total += admin_markup_per_item * quantity
        
        # Create order item
        order_item = {
            "id": str(uuid.uuid4()),
            "item_id": item["id"],
            "item_name": item["name"],
            "variant_id": item_data.get("variant_id"),
            "variant_name": variant_name,
            "quantity": quantity,
            "unit_price": unit_price,
            "admin_markup_per_item": admin_markup_per_item,
            "total_price": total_item_price,
            "add_ons": addons_list,
            "add_ons_total": addons_total * quantity,
            "is_substituted": False,
            "item_status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        order_items.append(order_item)
    
    # Calculate delivery charge
    distance_km = 0
    if address.get("lat") and address.get("lng") and store.get("lat") and store.get("lng"):
        distance_km = calculate_distance(address["lat"], address["lng"], store["lat"], store["lng"])
    
    delivery_charge = calculate_delivery_charge(
        distance_km,
        settings["delivery_charge_type"],
        settings.get("flat_delivery_charge", 0),
        settings.get("delivery_charge_per_km", 0),
        settings.get("free_delivery_above"),
        subtotal
    )
    
    # Calculate tax
    tax_amount = 0
    if settings.get("tax_enabled"):
        tax_amount = calculate_tax(subtotal, settings.get("tax_percentage", 0))
    
    # Apply coupon (TODO: implement coupon logic)
    discount_amount = 0
    
    # Calculate total
    total_amount = subtotal + delivery_charge + tax_amount - discount_amount
    
    # Get commission settings
    subscription = await db.tenant_subscriptions.find_one(
        {"tenant_id": store["tenant_id"], "status": "active"}
    )
    
    commission_percentage = subscription.get("commission_percentage", 0) if subscription else 0
    commission_amount = calculate_commission(total_amount, commission_percentage) if commission_percentage > 0 else 0
    vendor_payout = total_amount - commission_amount
    
    # Create order
    order_number = generate_order_number()
    
    order = Order(
        tenant_id=store["tenant_id"],
        store_id=store["id"],
        customer_id=user_id,
        module="food",
        order_number=order_number,
        delivery_address_id=address["id"],
        delivery_address=address,
        subtotal=subtotal,
        admin_markup_total=admin_markup_total,
        delivery_charge=delivery_charge,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        commission_percentage=commission_percentage,
        commission_amount=commission_amount,
        vendor_payout=vendor_payout,
        payment_method=order_data.payment_method,
        delivery_type=order_data.delivery_type,
        scheduled_delivery_slot_id=order_data.scheduled_delivery_slot_id,
        special_instructions=order_data.special_instructions,
        allow_substitution=order_data.allow_substitution,
        coupon_code=order_data.coupon_code
    )
    
    order_dict = order.model_dump()
    order_dict["placed_at"] = order_dict["placed_at"].isoformat()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    
    # Insert order
    await db.orders.insert_one(order_dict)
    
    # Insert order items
    for item in order_items:
        item["order_id"] = order.id
        item["tenant_id"] = store["tenant_id"]
        await db.order_items.insert_one(item)
    
    # Create delivery record
    from models.order import Delivery
    delivery = Delivery(
        tenant_id=store["tenant_id"],
        order_id=order.id,
        delivery_type="platform"
    )
    delivery_dict = delivery.model_dump()
    delivery_dict["created_at"] = delivery_dict["created_at"].isoformat()
    delivery_dict["updated_at"] = delivery_dict["updated_at"].isoformat()
    await db.deliveries.insert_one(delivery_dict)
    
    # TODO: Process payment based on payment_method
    # For now, mark as completed for testing
    if order_data.payment_method == "cod":
        await db.orders.update_one(
            {"id": order.id},
            {"$set": {"payment_status": "pending"}}
        )
    else:
        # Simulate payment success
        await db.orders.update_one(
            {"id": order.id},
            {"$set": {"payment_status": "completed"}}
        )
    
    return {
        "success": True,
        "order_id": order.id,
        "order_number": order_number,
        "total_amount": total_amount,
        "message": "Order placed successfully"
    }

# ==================== ORDER TRACKING ====================

@router.get("/orders")
async def get_my_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    skip: int = 0,
    limit: int = 20
):
    """
    Get customer's order history
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    orders = await db.orders.find(
        {"customer_id": user_id},
        {"_id": 0}
    ).skip(skip).limit(limit).sort("placed_at", -1).to_list(limit)
    
    # Optimized: Batch fetch store details to avoid N+1
    store_ids = [order["store_id"] for order in orders if order.get("store_id")]
    stores = await db.stores.find(
        {"id": {"$in": store_ids}},
        {"_id": 0, "id": 1, "name": 1, "logo_url": 1}
    ).to_list(len(store_ids))
    store_map = {s["id"]: s for s in stores}
    
    # Enrich with store details
    for order in orders:
        store_id = order.get("store_id")
        if store_id and store_id in store_map:
            store = store_map[store_id]
            order["store_name"] = store.get("name")
            order["store_logo"] = store.get("logo_url")
        
        # Remove _id from nested delivery_address if present
        if order.get("delivery_address") and isinstance(order["delivery_address"], dict):
            order["delivery_address"].pop("_id", None)
            order["delivery_address"].pop("_id", None)
        
        # Convert datetime strings
        if isinstance(order.get("placed_at"), str):
            order["placed_at"] = datetime.fromisoformat(order["placed_at"])
        if order.get("delivered_at") and isinstance(order["delivered_at"], str):
            order["delivered_at"] = datetime.fromisoformat(order["delivered_at"])
    
    return {"orders": orders, "total": len(orders)}

@router.get("/orders/{order_id}")
async def get_order_tracking(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get order details with tracking
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    order = await db.orders.find_one({"id": order_id, "customer_id": user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Remove _id from nested delivery_address if present
    if order.get("delivery_address") and isinstance(order["delivery_address"], dict):
        order["delivery_address"].pop("_id", None)
    
    # Get order items
    items = await db.order_items.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    order["items"] = items
    
    # Get delivery info
    delivery = await db.deliveries.find_one({"order_id": order_id}, {"_id": 0})
    if delivery:
        order["delivery"] = delivery
    
    # Get store info
    store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
    order["store"] = store
    
    return order

# ==================== REVIEWS ====================

@router.post("/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create review for completed order
    """
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    # Verify order belongs to user and is delivered
    order = await db.orders.find_one({"id": review_data.order_id, "customer_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Can only review completed orders")
    
    # Check if already reviewed
    existing_review = await db.reviews.find_one({"order_id": review_data.order_id})
    if existing_review:
        raise HTTPException(status_code=400, detail="Order already reviewed")
    
    # Calculate overall rating
    ratings = [r for r in [review_data.food_rating, review_data.delivery_rating] if r is not None]
    overall_rating = sum(ratings) / len(ratings) if ratings else 0
    
    review = Review(
        tenant_id=order["tenant_id"],
        order_id=review_data.order_id,
        customer_id=user_id,
        store_id=order["store_id"],
        food_rating=review_data.food_rating,
        delivery_rating=review_data.delivery_rating,
        overall_rating=overall_rating,
        comment=review_data.comment,
        images=review_data.images
    )
    
    review_dict = review.model_dump()
    review_dict["created_at"] = review_dict["created_at"].isoformat()
    
    await db.reviews.insert_one(review_dict)
    
    return {"success": True, "message": "Review submitted successfully"}
