"""Restore original Foodie Express tenant data - keeping exact IDs for order references"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os, uuid

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
ORIGINAL_TENANT_ID = "acdfc2a5-a7e6-4da6-b5d5-afc3d87dc355"
# Pizza Paradise store ID referenced by existing orders
PIZZA_STORE_ID = "d92e1e13-8e68-461e-b8c5-db9b92bd9936"

async def restore():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.hyperserve_db
    now = datetime.now(timezone.utc).isoformat()
    
    # Clear ONLY the collections I messed up
    for col in ["tenants", "stores", "categories", "items", "tenant_settings", "carts"]:
        r = await db[col].delete_many({})
        print(f"Cleared {col}: {r.deleted_count}")
    
    # Restore Foodie Express tenant with Bengaluru location
    tenant = {
        "id": ORIGINAL_TENANT_ID,
        "name": "Foodie Express",
        "business_type": "multi_vendor",
        "active_modules": ["food"],
        "contact_email": "contact@foodieexpress.com",
        "contact_phone": "9876543210",
        "town": "Bengaluru", "city": "Bengaluru", "state": "Karnataka",
        "lat": 12.9716, "lng": 77.5946,
        "is_active": True, "status": "active", "onboarding_completed": True,
        "created_at": now, "updated_at": now,
    }
    await db.tenants.insert_one(tenant)
    print(f"Restored: {tenant['name']} (Bengaluru)")
    
    # Tenant settings
    await db.tenant_settings.insert_one({
        "id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID,
        "delivery_charge_type": "distance_based", "flat_delivery_charge": 0.0,
        "delivery_charge_per_km": 10.0, "free_delivery_above": 500.0,
        "tax_enabled": True, "tax_percentage": 5.0,
        "default_admin_markup_percentage": 10.0, "currency": "INR",
        "created_at": now, "updated_at": now,
    })
    
    # Stores
    burger_id = str(uuid.uuid4())
    spice_id = str(uuid.uuid4())
    stores = [
        {"id": PIZZA_STORE_ID, "tenant_id": ORIGINAL_TENANT_ID, "name": "Pizza Paradise",
         "store_type": "restaurant", "type": "restaurant", "module": "food",
         "description": "Best pizzas in town with authentic Italian flavors",
         "address": "Koramangala, Bengaluru", "city": "Bengaluru", "state": "Karnataka", "pincode": "560034",
         "lat": 12.9352, "lng": 77.6245, "phone": "9876543211", "email": "pizza@paradise.com",
         "is_active": True, "is_accepting_orders": True, "avg_rating": 4.5, "total_ratings": 250, "total_reviews": 250,
         "preparation_time_minutes": 30, "avg_prep_time_mins": 30, "delivery_radius_km": 10,
         "cuisine_types": ["Italian", "Pizza"],
         "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591",
         "created_at": now, "updated_at": now},
        {"id": burger_id, "tenant_id": ORIGINAL_TENANT_ID, "name": "Burger Hub",
         "store_type": "restaurant", "type": "restaurant", "module": "food",
         "description": "Juicy burgers made with premium ingredients",
         "address": "Indiranagar, Bengaluru", "city": "Bengaluru", "state": "Karnataka", "pincode": "560038",
         "lat": 12.9784, "lng": 77.6408, "phone": "9876543212", "email": "info@burgerhub.com",
         "is_active": True, "is_accepting_orders": True, "avg_rating": 4.3, "total_ratings": 180, "total_reviews": 180,
         "preparation_time_minutes": 20, "avg_prep_time_mins": 20, "delivery_radius_km": 8,
         "cuisine_types": ["American", "Fast Food"],
         "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
         "created_at": now, "updated_at": now},
        {"id": spice_id, "tenant_id": ORIGINAL_TENANT_ID, "name": "Spice Garden",
         "store_type": "restaurant", "type": "restaurant", "module": "food",
         "description": "Authentic Indian cuisine with traditional spices",
         "address": "HSR Layout, Bengaluru", "city": "Bengaluru", "state": "Karnataka", "pincode": "560102",
         "lat": 12.9121, "lng": 77.6446, "phone": "9876543213", "email": "hello@spicegarden.com",
         "is_active": True, "is_accepting_orders": True, "avg_rating": 4.7, "total_ratings": 320, "total_reviews": 320,
         "preparation_time_minutes": 35, "avg_prep_time_mins": 35, "delivery_radius_km": 10,
         "cuisine_types": ["Indian", "North Indian", "South Indian"],
         "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
         "created_at": now, "updated_at": now},
    ]
    await db.stores.insert_many(stores)
    
    # Categories
    pc1, pc2 = str(uuid.uuid4()), str(uuid.uuid4())
    bc1, bc2 = str(uuid.uuid4()), str(uuid.uuid4())
    ic1, ic2 = str(uuid.uuid4()), str(uuid.uuid4())
    cats = [
        {"id": pc1, "tenant_id": ORIGINAL_TENANT_ID, "store_id": PIZZA_STORE_ID, "name": "Pizzas", "description": "Our signature pizzas", "module": "food", "display_order": 1, "sort_order": 1, "is_active": True, "created_at": now},
        {"id": pc2, "tenant_id": ORIGINAL_TENANT_ID, "store_id": PIZZA_STORE_ID, "name": "Beverages", "description": "Refreshing drinks", "module": "food", "display_order": 2, "sort_order": 2, "is_active": True, "created_at": now},
        {"id": bc1, "tenant_id": ORIGINAL_TENANT_ID, "store_id": burger_id, "name": "Burgers", "description": "Juicy burgers", "module": "food", "display_order": 1, "sort_order": 1, "is_active": True, "created_at": now},
        {"id": bc2, "tenant_id": ORIGINAL_TENANT_ID, "store_id": burger_id, "name": "Sides", "description": "Fries and more", "module": "food", "display_order": 2, "sort_order": 2, "is_active": True, "created_at": now},
        {"id": ic1, "tenant_id": ORIGINAL_TENANT_ID, "store_id": spice_id, "name": "Main Course", "description": "Delicious main courses", "module": "food", "display_order": 1, "sort_order": 1, "is_active": True, "created_at": now},
        {"id": ic2, "tenant_id": ORIGINAL_TENANT_ID, "store_id": spice_id, "name": "Breads", "description": "Freshly baked breads", "module": "food", "display_order": 2, "sort_order": 2, "is_active": True, "created_at": now},
    ]
    await db.categories.insert_many(cats)
    
    # Items with both base_price and price
    items = [
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": PIZZA_STORE_ID, "category_id": pc1, "name": "Margherita Pizza", "description": "Classic tomato, mozzarella, and basil", "module": "food", "type": "simple", "base_price": 299.0, "price": 299.0, "admin_markup_amount": 30.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": PIZZA_STORE_ID, "category_id": pc1, "name": "Pepperoni Pizza", "description": "Loaded with pepperoni and cheese", "module": "food", "type": "simple", "base_price": 399.0, "price": 399.0, "admin_markup_amount": 40.0, "is_veg": False, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": PIZZA_STORE_ID, "category_id": pc2, "name": "Coca Cola", "description": "Chilled soft drink", "module": "food", "type": "simple", "base_price": 50.0, "price": 50.0, "admin_markup_amount": 5.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": burger_id, "category_id": bc1, "name": "Classic Beef Burger", "description": "Beef patty with lettuce, tomato, and special sauce", "module": "food", "type": "simple", "base_price": 199.0, "price": 199.0, "admin_markup_amount": 20.0, "is_veg": False, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": burger_id, "category_id": bc1, "name": "Veggie Burger", "description": "Healthy veggie patty with fresh vegetables", "module": "food", "type": "simple", "base_price": 149.0, "price": 149.0, "admin_markup_amount": 15.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": burger_id, "category_id": bc2, "name": "French Fries", "description": "Crispy golden fries", "module": "food", "type": "simple", "base_price": 99.0, "price": 99.0, "admin_markup_amount": 10.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": spice_id, "category_id": ic1, "name": "Butter Chicken", "description": "Creamy tomato-based curry with tender chicken", "module": "food", "type": "simple", "base_price": 320.0, "price": 320.0, "admin_markup_amount": 32.0, "is_veg": False, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": spice_id, "category_id": ic1, "name": "Paneer Tikka Masala", "description": "Cottage cheese in rich spiced gravy", "module": "food", "type": "simple", "base_price": 280.0, "price": 280.0, "admin_markup_amount": 28.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
        {"id": str(uuid.uuid4()), "tenant_id": ORIGINAL_TENANT_ID, "store_id": spice_id, "category_id": ic2, "name": "Butter Naan", "description": "Soft and fluffy Indian bread", "module": "food", "type": "simple", "base_price": 40.0, "price": 40.0, "admin_markup_amount": 5.0, "is_veg": True, "is_available": True, "is_deleted": False, "created_at": now, "updated_at": now},
    ]
    await db.items.insert_many(items)
    
    # Verify
    print("\n=== RESTORED DATA ===")
    t = await db.tenants.find_one({"id": ORIGINAL_TENANT_ID}, {"_id": 0, "id": 1, "name": 1, "town": 1, "status": 1})
    print(f"Tenant: {t}")
    for s in await db.stores.find({"tenant_id": ORIGINAL_TENANT_ID}).to_list(100):
        nc = await db.categories.count_documents({"store_id": s["id"]})
        ni = await db.items.count_documents({"store_id": s["id"]})
        print(f"  {s['name']}: {nc} cats, {ni} items")
    
    client.close()
    print("\nRestore complete!")

asyncio.run(restore())
