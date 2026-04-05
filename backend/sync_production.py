"""
Sync ALL production data from admin panel API to local MongoDB.
Includes: food stores/items, grocery categories/products, laundry services/items/pricing.
"""
import asyncio
import json
import os
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

PROD_BASE = "https://hyperserve-food-mvp.emergent.host/api"
ADMIN_EMAIL = "sree123@gmail.com"
ADMIN_PASSWORD = "Test@123"

async def sync_production_data():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    # Step 1: Wipe ALL local data
    collections = await db.list_collection_names()
    for col in collections:
        await db[col].drop()
    print("Wiped all local data.\n")
    
    # Step 2: Login to production backend
    async with httpx.AsyncClient(timeout=15) as http:
        login_resp = await http.post(f"{PROD_BASE}/auth/login", json={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        login_data = login_resp.json()
        token = login_data["access_token"]
        user_data = login_data["user"]
        tenant_data = login_data["tenant"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print(f"Logged in as: {user_data['email']} ({user_data['role']})")
        print(f"Tenant: {tenant_data['name']} (modules: {tenant_data['active_modules']})\n")
        
        # Step 3: Fetch FOOD data
        stores_resp = await http.get(f"{PROD_BASE}/tenant-admin/stores", headers=headers)
        stores = stores_resp.json()
        
        categories_resp = await http.get(f"{PROD_BASE}/tenant-admin/categories", headers=headers)
        categories = categories_resp.json()
        
        items_resp = await http.get(f"{PROD_BASE}/tenant-admin/items", headers=headers)
        items = items_resp.json()
        
        settings_resp = await http.get(f"{PROD_BASE}/tenant-admin/settings", headers=headers)
        settings = settings_resp.json()
        
        me_resp = await http.get(f"{PROD_BASE}/auth/me", headers=headers)
        me_data = me_resp.json()
        
        # Step 4: Fetch GROCERY data
        grocery_categories_resp = await http.get(f"{PROD_BASE}/grocery-admin/categories", headers=headers)
        grocery_categories = grocery_categories_resp.json() if grocery_categories_resp.status_code == 200 else []
        
        grocery_products_resp = await http.get(f"{PROD_BASE}/grocery-admin/products", headers=headers)
        grocery_products = grocery_products_resp.json() if grocery_products_resp.status_code == 200 else []
        
        # Step 5: Fetch LAUNDRY data
        laundry_services_resp = await http.get(f"{PROD_BASE}/laundry-admin/services", headers=headers)
        laundry_services = laundry_services_resp.json() if laundry_services_resp.status_code == 200 else []
        
        laundry_items_resp = await http.get(f"{PROD_BASE}/laundry-admin/items", headers=headers)
        laundry_items = laundry_items_resp.json() if laundry_items_resp.status_code == 200 else []
        
        laundry_pricing_resp = await http.get(f"{PROD_BASE}/laundry-admin/pricing", headers=headers)
        laundry_pricing = laundry_pricing_resp.json() if laundry_pricing_resp.status_code == 200 else []
    
    # ======= INSERT ALL DATA =======
    
    # Tenant
    await db.tenants.insert_one(tenant_data)
    print(f"Inserted tenant: {tenant_data['name']} (town: {tenant_data.get('town')})")
    
    # User
    user_doc = {
        "id": me_data["id"],
        "tenant_id": me_data["tenant_id"],
        "name": me_data["name"],
        "phone": me_data.get("phone", ""),
        "email": me_data["email"],
        "role": me_data["role"],
        "password": me_data["password"],
        "profile_photo": me_data.get("profile_photo"),
        "status": me_data.get("status", "active"),
        "is_deleted": me_data.get("is_deleted", False),
        "created_at": me_data.get("created_at"),
        "updated_at": me_data.get("updated_at"),
    }
    await db.users.insert_one(user_doc)
    print(f"Inserted user: {user_doc['email']} ({user_doc['role']})")
    
    # Food Stores
    for store in stores:
        await db.stores.insert_one(store)
        print(f"Inserted store: {store['name']} ({store['store_type']}) - {store['city']}")
    
    # Food Categories
    for cat in categories:
        await db.categories.insert_one(cat)
        print(f"Inserted food category: {cat['name']}")
    
    # Food Items
    for item in items:
        await db.items.insert_one(item)
        print(f"Inserted food item: {item['name']} - Rs.{item['base_price']}")
    
    # Tenant Settings
    await db.tenant_settings.insert_one(settings)
    print(f"Inserted tenant settings")
    
    # Grocery Categories
    for cat in grocery_categories:
        await db.grocery_categories.insert_one(cat)
        print(f"Inserted grocery category: {cat['name']}")
    
    # Grocery Products
    for prod in grocery_products:
        await db.grocery_products.insert_one(prod)
        print(f"Inserted grocery product: {prod['name']} - Rs.{prod.get('selling_price', 0)}")
    
    # Laundry Services
    for svc in laundry_services:
        await db.laundry_services.insert_one(svc)
        print(f"Inserted laundry service: {svc['name']}")
    
    # Laundry Items
    for item in laundry_items:
        await db.laundry_items.insert_one(item)
        print(f"Inserted laundry item: {item['name']} ({item.get('category', '')})")
    
    # Laundry Pricing
    for price in laundry_pricing:
        await db.laundry_pricing.insert_one(price)
        print(f"Inserted laundry pricing: {price['pricing_type']} - Rs.{price['price']}")
    
    # Summary
    print(f"\n=== SYNC COMPLETE ===")
    print(f"Tenants: 1")
    print(f"Users: 1")
    print(f"Food Stores: {len(stores)}")
    print(f"Food Categories: {len(categories)}")
    print(f"Food Items: {len(items)}")
    print(f"Grocery Categories: {len(grocery_categories)}")
    print(f"Grocery Products: {len(grocery_products)}")
    print(f"Laundry Services: {len(laundry_services)}")
    print(f"Laundry Items: {len(laundry_items)}")
    print(f"Laundry Pricing: {len(laundry_pricing)}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(sync_production_data())
