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
    cuisine_type: str = None,
    search: str = None,
    skip: int = 0,
    limit: int = 20
):
    """
    Browse available restaurants (food module)
    """
    await require_role(current_user, ["customer"])
    
    query = {
        "type": "restaurant",
        "is_active": True,
        "is_accepting_orders": True
    }
    
    if cuisine_type:
        query["cuisine_types"] = cuisine_type
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    stores = await db.stores.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Calculate distance if coordinates provided
    if lat and lng:
        for store in stores:
            if store.get("lat") and store.get("lng"):
                distance = calculate_distance(lat, lng, store["lat"], store["lng"])
                store["distance_km"] = distance
                store["is_deliverable"] = distance <= store.get("delivery_radius_km", 5)
            else:
                store["distance_km"] = None
                store["is_deliverable"] = True
    
    # Get tenant info
    for store in stores:
        tenant = await db.tenants.find_one({"id": store["tenant_id"]}, {"_id": 0, "name": 1, "logo_url": 1})
        if tenant:
            store["tenant_name"] = tenant.get("name")
        
        # Convert datetime strings
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
    
    # Get categories for this store
    categories = await db.categories.find(
        {"store_id": store_id, "module": "food", "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    # Get items for each category
    for category in categories:
        items = await db.items.find(
            {"category_id": category["id"], "is_available": True, "is_deleted": False},
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
    
    # Get tenant settings
    settings = await db.tenant_settings.find_one({"tenant_id": store["tenant_id"]})
    if not settings:
        raise HTTPException(status_code=400, detail="Tenant settings not found")
    
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
    commission_amount = calculate_commission(total_amount, commission_percentage)
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
    
    # Enrich with store details
    for order in orders:
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0, "name": 1, "logo_url": 1})
        if store:
            order["store_name"] = store.get("name")
            order["store_logo"] = store.get("logo_url")
        
        # Remove _id from nested delivery_address if present
        if order.get("delivery_address") and isinstance(order["delivery_address"], dict):
            order["delivery_address"].pop("_id", None)
        
        # Convert datetime strings
        if isinstance(order.get("placed_at"), str):
            order["placed_at"] = datetime.fromisoformat(order["placed_at"])
        if order.get("delivered_at") and isinstance(order["delivered_at"], str):
            order["delivered_at"] = datetime.fromisoformat(order["delivered_at"])
    
    return orders

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
