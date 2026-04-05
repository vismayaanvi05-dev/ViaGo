"""
Sync production data from admin panel API to local MongoDB.
This fetches REAL data from the production backend - NO fake data.
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
    # Connect to local MongoDB
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
        
        # Step 3: Fetch all data from production
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
    
    # Step 4: Insert tenant
    await db.tenants.insert_one(tenant_data)
    print(f"Inserted tenant: {tenant_data['name']} (town: {tenant_data.get('town')})")
    
    # Step 5: Insert user (with exact password hash from production)
    user_doc = {
        "id": me_data["id"],
        "tenant_id": me_data["tenant_id"],
        "name": me_data["name"],
        "phone": me_data.get("phone", ""),
        "email": me_data["email"],
        "role": me_data["role"],
        "password": me_data["password"],  # exact bcrypt hash from production
        "profile_photo": me_data.get("profile_photo"),
        "status": me_data.get("status", "active"),
        "is_deleted": me_data.get("is_deleted", False),
        "created_at": me_data.get("created_at"),
        "updated_at": me_data.get("updated_at"),
    }
    await db.users.insert_one(user_doc)
    print(f"Inserted user: {user_doc['email']} ({user_doc['role']})")
    
    # Step 6: Insert stores
    for store in stores:
        await db.stores.insert_one(store)
        print(f"Inserted store: {store['name']} ({store['store_type']}) - {store['city']}")
    
    # Step 7: Insert categories
    for cat in categories:
        await db.categories.insert_one(cat)
        print(f"Inserted category: {cat['name']} (module: {cat['module']})")
    
    # Step 8: Insert items
    for item in items:
        await db.items.insert_one(item)
        print(f"Inserted item: {item['name']} - Rs.{item['base_price']} (module: {item['module']})")
    
    # Step 9: Insert tenant settings
    await db.tenant_settings.insert_one(settings)
    print(f"Inserted tenant settings (tax: {settings.get('tax_percentage')}%)")
    
    # Summary
    print(f"\n=== SYNC COMPLETE ===")
    print(f"Tenants: 1")
    print(f"Users: 1")
    print(f"Stores: {len(stores)}")
    print(f"Categories: {len(categories)}")
    print(f"Items: {len(items)}")
    print(f"Settings: 1")
    
    # Verification
    print(f"\n=== VERIFICATION ===")
    user_check = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0, "password": 0})
    print(f"User found: {user_check['email']} ({user_check['role']})")
    tenant_check = await db.tenants.find_one({"id": tenant_data['id']}, {"_id": 0})
    print(f"Tenant found: {tenant_check['name']} (town: {tenant_check.get('town')})")
    store_count = await db.stores.count_documents({})
    print(f"Stores: {store_count}")
    item_count = await db.items.count_documents({})
    print(f"Items: {item_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(sync_production_data())
