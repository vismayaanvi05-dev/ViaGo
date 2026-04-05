from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import Address, AddressCreate, AddressUpdate
from models.order import Order, OrderCreate, OrderItem
from middleware.auth import get_current_user, require_role
from utils.helpers import generate_order_number, calculate_distance, calculate_delivery_charge, calculate_tax
from datetime import datetime
import uuid

router = APIRouter(prefix="/customer", tags=["Customer"])

def get_db():
    from server import db
    return db

@router.get("/config")
async def get_app_config(lat: float = None, lng: float = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    return {
        "app_name": "ViaGo",
        "version": "1.0.0",
        "available_modules": ["food", "grocery", "laundry"],
        "theme": {"primary_color": "#8B5CF6", "secondary_color": "#EC4899"}
    }

@router.get("/stores")
async def discover_stores(
    lat: float, lng: float, module: str = None, search: str = None,
    skip: int = 0, limit: int = 20, db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {"is_active": True, "is_accepting_orders": True}
    if module:
        store_type_map = {"food": "restaurant", "grocery": "grocery", "laundry": "laundry"}
        query["store_type"] = store_type_map.get(module, "restaurant")
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    stores = await db.stores.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for store in stores:
        if store.get("lat") and store.get("lng"):
            distance = calculate_distance(lat, lng, store["lat"], store["lng"])
            store["distance_km"] = distance
            store["is_deliverable"] = distance <= store.get("delivery_radius_km", 5)
        else:
            store["distance_km"] = None
            store["is_deliverable"] = True
        store["rating"] = 4.5
        store["total_reviews"] = 100
    
    stores.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else 999)
    return {"stores": stores, "total": len(stores), "module": module}

@router.get("/search")
async def search_stores_items(q: str, lat: float, lng: float, module: str = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    stores = await db.stores.find({"is_active": True, "name": {"$regex": q, "$options": "i"}}, {"_id": 0}).limit(10).to_list(10)
    items = await db.items.find({"name": {"$regex": q, "$options": "i"}, "is_available": True}, {"_id": 0}).limit(20).to_list(20)
    return {"stores": stores, "items": items}

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    user = await db.users.find_one({"id": current_user["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/profile")
async def update_profile(profile_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    allowed = ["name", "email", "phone", "profile_photo"]
    update = {k: v for k, v in profile_data.items() if k in allowed}
    if update:
        await db.users.update_one({"id": current_user["user_id"]}, {"$set": update})
    return {"success": True, "message": "Profile updated"}

@router.post("/cart/add")
async def add_to_cart(cart_item: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    cart = await db.carts.find_one({"user_id": user_id})
    if cart and cart.get("store_id") != cart_item.get("store_id"):
        return {"success": False, "error": "cart_conflict", "message": "Cart contains items from another store", "current_store_id": cart.get("store_id")}
    
    store = await db.stores.find_one({"id": cart_item.get("store_id")})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    item = await db.items.find_one({"id": cart_item.get("item_id")})
    if not item or not item.get("is_available"):
        raise HTTPException(status_code=400, detail="Item not available")
    
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
    
    existing = next((i for i in cart["items"] if i["item_id"] == cart_item["item_id"]), None)
    if existing:
        existing["quantity"] += cart_item.get("quantity", 1)
    else:
        cart["items"].append({
            "id": str(uuid.uuid4()),
            "item_id": cart_item["item_id"],
            "item_name": item["name"],
            "quantity": cart_item.get("quantity", 1),
            "unit_price": item["base_price"],
            "variant_id": cart_item.get("variant_id"),
            "added_at": datetime.utcnow().isoformat()
        })
    
    cart["updated_at"] = datetime.utcnow().isoformat()
    await db.carts.update_one({"user_id": user_id}, {"$set": cart}, upsert=True)
    return {"success": True, "message": "Item added to cart", "cart": cart}

@router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    cart = await db.carts.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
    if not cart:
        return {"cart": None, "subtotal": 0, "item_count": 0}
    
    subtotal = sum(item["unit_price"] * item["quantity"] for item in cart.get("items", []))
    store = await db.stores.find_one({"id": cart.get("store_id")}, {"_id": 0})
    return {"cart": cart, "store": store, "subtotal": subtotal, "item_count": len(cart.get("items", []))}

@router.put("/cart/update")
async def update_cart_item(update_data: dict, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    for item in cart["items"]:
        if item["item_id"] == update_data.get("item_id"):
            item["quantity"] = update_data.get("quantity", 1)
            break
    
    cart.pop("_id", None)
    cart["updated_at"] = datetime.utcnow().isoformat()
    await db.carts.update_one({"user_id": current_user["user_id"]}, {"$set": cart})
    return {"success": True, "cart": cart}

@router.delete("/cart/remove")
async def remove_from_cart(item_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    cart = await db.carts.find_one({"user_id": current_user["user_id"]})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    cart["items"] = [item for item in cart["items"] if item["item_id"] != item_id]
    if not cart["items"]:
        await db.carts.delete_one({"user_id": current_user["user_id"]})
        return {"success": True, "message": "Cart is now empty"}
    
    cart.pop("_id", None)
    await db.carts.update_one({"user_id": current_user["user_id"]}, {"$set": cart})
    return {"success": True, "cart": cart}

@router.delete("/cart/clear")
async def clear_cart(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    await db.carts.delete_one({"user_id": current_user["user_id"]})
    return {"success": True, "message": "Cart cleared"}

@router.get("/restaurants/{store_id}")
async def get_restaurant_details(store_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    store = await db.stores.find_one({"id": store_id, "is_active": True}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    categories = await db.categories.find({"store_id": store_id, "is_active": True}, {"_id": 0}).to_list(100)
    for category in categories:
        items = await db.items.find({"category_id": category["id"], "is_available": True}, {"_id": 0}).to_list(100)
        category["items"] = items
    
    store["categories"] = categories
    return store

@router.post("/addresses", response_model=Address)
async def create_address(address_data: AddressCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    if address_data.is_default:
        await db.addresses.update_many({"user_id": current_user["user_id"]}, {"$set": {"is_default": False}})
    
    address = Address(user_id=current_user["user_id"], **address_data.model_dump())
    address_dict = address.model_dump()
    address_dict["created_at"] = address_dict["created_at"].isoformat()
    await db.addresses.insert_one(address_dict)
    return address

@router.get("/addresses")
async def list_addresses(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    addresses = await db.addresses.find({"user_id": current_user["user_id"]}, {"_id": 0}).to_list(100)
    return addresses

@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    result = await db.addresses.delete_one({"id": address_id, "user_id": current_user["user_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"success": True, "message": "Address deleted"}

@router.post("/orders")
async def place_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    user_id = current_user["user_id"]
    
    store = await db.stores.find_one({"id": order_data.store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    address = await db.addresses.find_one({"id": order_data.delivery_address_id, "user_id": user_id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    address.pop("_id", None)
    
    subtotal = 0
    order_items = []
    for item_data in order_data.items:
        item = await db.items.find_one({"id": item_data["item_id"]})
        if not item:
            continue
        quantity = item_data["quantity"]
        total_price = item["base_price"] * quantity
        subtotal += total_price
        order_items.append({
            "id": str(uuid.uuid4()),
            "item_id": item["id"],
            "item_name": item["name"],
            "quantity": quantity,
            "unit_price": item["base_price"],
            "total_price": total_price,
            "variant_id": item_data.get("variant_id"),
            "created_at": datetime.utcnow().isoformat()
        })
    
    settings = await db.tenant_settings.find_one({"tenant_id": store["tenant_id"]})
    delivery_charge = 30.0
    tax_amount = round(subtotal * 0.05, 2)
    total_amount = subtotal + delivery_charge + tax_amount
    
    order = Order(
        tenant_id=store["tenant_id"],
        store_id=store["id"],
        customer_id=user_id,
        module="food",
        order_number=generate_order_number(),
        delivery_address_id=address["id"],
        delivery_address=address,
        subtotal=subtotal,
        delivery_charge=delivery_charge,
        tax_amount=tax_amount,
        total_amount=total_amount,
        payment_method=order_data.payment_method,
        special_instructions=order_data.special_instructions
    )
    
    order_dict = order.model_dump()
    for key in ["placed_at", "created_at", "updated_at"]:
        if order_dict.get(key):
            order_dict[key] = order_dict[key].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    for item in order_items:
        item["order_id"] = order.id
        item["tenant_id"] = store["tenant_id"]
        await db.order_items.insert_one(item)
    
    await db.carts.delete_one({"user_id": user_id})
    
    return {"success": True, "order_id": order.id, "order_number": order.order_number, "total_amount": total_amount}

@router.get("/orders")
async def get_orders(skip: int = 0, limit: int = 20, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    orders = await db.orders.find({"customer_id": current_user["user_id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0, "name": 1})
        order["store_name"] = store.get("name") if store else "Unknown"
        order["items"] = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
    
    return {"orders": orders, "total": len(orders)}

@router.get("/orders/{order_id}")
async def get_order_details(order_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await require_role(current_user, ["customer"])
    order = await db.orders.find_one({"id": order_id, "customer_id": current_user["user_id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order["items"] = await db.order_items.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
    order["store"] = store
    
    return order
