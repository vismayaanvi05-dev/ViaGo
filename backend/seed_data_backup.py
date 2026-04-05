"""
Seed script to populate database with test data for HyperServe platform
This creates:
- Super Admin user (username/password)
- Tenant with Tenant Admin (username/password)
- Vendor Admins for restaurants (username/password)
- Test customer users (OTP-based - for mobile app)
- Test delivery partner (OTP-based - for mobile app)
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User, UserCreate
from models.tenant import Tenant, TenantCreate, TenantSettings
from models.store import Store, StoreCreate, Category, CategoryCreate
from models.item import Item, ItemCreate
from models.monetization import SubscriptionPlan, TenantSubscription
from datetime import datetime, timezone
from utils.helpers import get_password_hash
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_database():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    print("🌱 Starting database seeding...")
    
    # Clear existing data (optional - comment out if you want to keep existing data)
    collections = await db.list_collection_names()
    for collection in collections:
        await db[collection].delete_many({})
    print("🗑️  Cleared existing data")
    
    # 1. Create Super Admin (Username/Password)
    super_admin_id = str(uuid.uuid4())
    super_admin = {
        "id": super_admin_id,
        "tenant_id": None,
        "name": "Super Admin",
        "phone": "",
        "email": "superadmin@hyperserve.com",
        "password": get_password_hash("admin123"),  # Password: admin123
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(super_admin)
    print(f"✅ Created Super Admin: {super_admin['email']} / admin123")
    
    # 2. Create Subscription Plans
    plans = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter Plan",
            "description": "Perfect for small restaurants starting out",
            "pricing_type": "subscription",
            "monthly_fee": 999.0,
            "commission_percentage": 0.0,
            "features": ["Up to 100 orders/month", "Basic analytics", "Email support"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Growth Plan",
            "description": "For growing businesses",
            "pricing_type": "commission",
            "monthly_fee": 0.0,
            "commission_percentage": 15.0,
            "features": ["Unlimited orders", "Advanced analytics", "Priority support"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Enterprise Plan",
            "description": "Best for large chains",
            "pricing_type": "hybrid",
            "monthly_fee": 4999.0,
            "commission_percentage": 8.0,
            "features": ["Unlimited orders", "Multi-store management", "Dedicated account manager", "Custom integrations"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.subscription_plans.insert_many(plans)
    print(f"✅ Created {len(plans)} subscription plans")
    
    # 3. Create Tenant
    tenant_id = str(uuid.uuid4())
    tenant = {
        "id": tenant_id,
        "name": "Foodie Express",
        "business_type": "multi_vendor",
        "active_modules": ["food"],
        "contact_email": "contact@foodieexpress.com",
        "contact_phone": "9876543210",
        "is_active": True,
        "onboarding_completed": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenants.insert_one(tenant)
    print(f"✅ Created Tenant: {tenant['name']}")
    
    # 4. Create Tenant Subscription (assign Growth plan - commission based)
    tenant_subscription = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "plan_id": plans[1]["id"],  # Growth Plan
        "pricing_model": "commission",
        "monthly_fee": 0.0,
        "commission_percentage": 15.0,
        "status": "active",
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_subscriptions.insert_one(tenant_subscription)
    print("✅ Created Tenant Subscription")
    
    # 5. Create Tenant Settings (with admin markup, tax, delivery charges)
    tenant_settings = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "delivery_charge_type": "distance_based",
        "flat_delivery_charge": 0.0,
        "delivery_charge_per_km": 10.0,
        "free_delivery_above": 500.0,
        "tax_enabled": True,
        "tax_percentage": 5.0,
        "default_admin_markup_percentage": 10.0,
        "currency": "INR",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tenant_settings.insert_one(tenant_settings)
    print("✅ Created Tenant Settings")
    
    # 6. Create Tenant Admin (Username/Password)
    tenant_admin_id = str(uuid.uuid4())
    tenant_admin = {
        "id": tenant_admin_id,
        "tenant_id": tenant_id,
        "name": "Tenant Admin",
        "phone": "",
        "email": "admin@foodieexpress.com",
        "password": get_password_hash("tenant123"),  # Password: tenant123
        "role": "tenant_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(tenant_admin)
    print(f"✅ Created Tenant Admin: {tenant_admin['email']} / tenant123")
    
    # 7. Create Stores (Restaurants)
    stores = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Pizza Paradise",
            "type": "restaurant",
            "module": "food",
            "description": "Best pizzas in town with authentic Italian flavors",
            "address": "123 Main Street, Downtown",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "lat": 19.0760,
            "lng": 72.8777,
            "phone": "9876543211",
            "email": "pizza@paradise.com",
            "is_active": True,
            "is_accepting_orders": True,
            "avg_rating": 4.5,
            "total_ratings": 250,
            "preparation_time_minutes": 30,
            "cuisine_types": ["Italian", "Pizza"],
            "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Burger Hub",
            "type": "restaurant",
            "module": "food",
            "description": "Juicy burgers made with premium ingredients",
            "address": "456 Park Avenue, Central",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400002",
            "lat": 19.0896,
            "lng": 72.8656,
            "phone": "9876543212",
            "email": "info@burgerhub.com",
            "is_active": True,
            "is_accepting_orders": True,
            "avg_rating": 4.3,

    # Create Vendor Admins for each store (Username/Password)
    vendor_admins = []
    vendor_passwords = ["pizza123", "burger123", "spice123"]
    for i, store in enumerate(stores):
        vendor_id = str(uuid.uuid4())
        vendor = {
            "id": vendor_id,
            "tenant_id": tenant_id,
            "store_id": store["id"],
            "name": f"{store['name']} Owner",
            "phone": "",
            "email": f"vendor{i+1}@foodieexpress.com",
            "password": get_password_hash(vendor_passwords[i]),
            "role": "vendor",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        vendor_admins.append(vendor)
        await db.users.insert_one(vendor)
        print(f"✅ Created Vendor Admin: {vendor['email']} / {vendor_passwords[i]} for {store['name']}")
    

            "total_ratings": 180,
            "preparation_time_minutes": 20,
            "cuisine_types": ["American", "Fast Food"],
            "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Spice Garden",
            "type": "restaurant",
            "module": "food",
            "description": "Authentic Indian cuisine with traditional spices",
            "address": "789 Spice Lane, South",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400003",
            "lat": 19.1136,
            "lng": 72.9083,
            "phone": "9876543213",
            "email": "hello@spicegarden.com",
            "is_active": True,
            "is_accepting_orders": True,
            "avg_rating": 4.7,
            "total_ratings": 320,
            "preparation_time_minutes": 35,
            "cuisine_types": ["Indian", "North Indian", "South Indian"],
            "image_url": "https://images.unsplash.com/photo-1585937421612-70a008356fbe",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.stores.insert_many(stores)
    print(f"✅ Created {len(stores)} stores/restaurants")
    
    # 8. Create Categories and Items for each store
    
    # Pizza Paradise Menu
    pizza_categories = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[0]["id"],
            "name": "Pizzas",
            "description": "Our signature pizzas",
            "module": "food",
            "display_order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[0]["id"],
            "name": "Beverages",
            "description": "Refreshing drinks",
            "module": "food",
            "display_order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.categories.insert_many(pizza_categories)
    
    pizza_items = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[0]["id"],
            "category_id": pizza_categories[0]["id"],
            "name": "Margherita Pizza",
            "description": "Classic tomato, mozzarella, and basil",
            "module": "food",
            "type": "simple",
            "base_price": 299.0,
            "admin_markup_amount": 30.0,  # Admin adds ₹30 markup
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[0]["id"],
            "category_id": pizza_categories[0]["id"],
            "name": "Pepperoni Pizza",
            "description": "Loaded with pepperoni and cheese",
            "module": "food",
            "type": "simple",
            "base_price": 399.0,
            "admin_markup_amount": 40.0,
            "is_veg": False,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1628840042765-356cda07504e",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[0]["id"],
            "category_id": pizza_categories[1]["id"],
            "name": "Coca Cola",
            "description": "Chilled soft drink",
            "module": "food",
            "type": "simple",
            "base_price": 50.0,
            "admin_markup_amount": 5.0,
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1554866585-cd94860890b7",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.items.insert_many(pizza_items)
    
    # Burger Hub Menu
    burger_categories = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[1]["id"],
            "name": "Burgers",
            "description": "Juicy burgers",
            "module": "food",
            "display_order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[1]["id"],
            "name": "Sides",
            "description": "Fries and more",
            "module": "food",
            "display_order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.categories.insert_many(burger_categories)
    
    burger_items = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[1]["id"],
            "category_id": burger_categories[0]["id"],
            "name": "Classic Beef Burger",
            "description": "Beef patty with lettuce, tomato, and special sauce",
            "module": "food",
            "type": "simple",
            "base_price": 199.0,
            "admin_markup_amount": 20.0,
            "is_veg": False,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1550547660-d9450f859349",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[1]["id"],
            "category_id": burger_categories[0]["id"],
            "name": "Veggie Burger",
            "description": "Healthy veggie patty with fresh vegetables",
            "module": "food",
            "type": "simple",
            "base_price": 149.0,
            "admin_markup_amount": 15.0,
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1520072959219-c595dc870360",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[1]["id"],
            "category_id": burger_categories[1]["id"],
            "name": "French Fries",
            "description": "Crispy golden fries",
            "module": "food",
            "type": "simple",
            "base_price": 99.0,
            "admin_markup_amount": 10.0,
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.items.insert_many(burger_items)
    
    # Spice Garden Menu
    indian_categories = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[2]["id"],
            "name": "Main Course",
            "description": "Delicious main courses",
            "module": "food",
            "display_order": 1,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[2]["id"],
            "name": "Breads",
            "description": "Freshly baked breads",
            "module": "food",
            "display_order": 2,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.categories.insert_many(indian_categories)
    
    indian_items = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[2]["id"],
            "category_id": indian_categories[0]["id"],
            "name": "Butter Chicken",
            "description": "Creamy tomato-based curry with tender chicken",
            "module": "food",
            "type": "simple",
            "base_price": 320.0,
            "admin_markup_amount": 32.0,
            "is_veg": False,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[2]["id"],
            "category_id": indian_categories[0]["id"],
            "name": "Paneer Tikka Masala",
            "description": "Cottage cheese in rich spiced gravy",
            "module": "food",
            "type": "simple",
            "base_price": 280.0,
            "admin_markup_amount": 28.0,
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "store_id": stores[2]["id"],
            "category_id": indian_categories[1]["id"],
            "name": "Butter Naan",
            "description": "Soft and fluffy Indian bread",
            "module": "food",
            "type": "simple",
            "base_price": 40.0,
            "admin_markup_amount": 5.0,
            "is_veg": True,
            "is_available": True,
            "is_deleted": False,
            "image_url": "https://images.unsplash.com/photo-1619871779284-47e8f8fc34b9",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.items.insert_many(indian_items)
    
    print(f"✅ Created categories and menu items for all stores")
    
    # 9. Create Test Customers
    customers = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": None,  # Customers are not tied to a specific tenant
            "name": "John Doe",
            "phone": "9111111111",
            "email": "john@example.com",
            "role": "customer",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": None,
            "name": "Jane Smith",
            "phone": "9222222222",
            "email": "jane@example.com",
            "role": "customer",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.users.insert_many(customers)
    print(f"✅ Created {len(customers)} test customers")
    
    # 10. Create sample addresses for customer
    addresses = [
        {
            "id": str(uuid.uuid4()),
            "user_id": customers[0]["id"],
            "label": "Home",
            "address_line1": "Flat 301, Green Valley",
            "address_line2": "Near City Mall",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "lat": 19.0770,
            "lng": 72.8780,
            "is_default": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": customers[0]["id"],
            "label": "Office",
            "address_line1": "Tech Park, Building A",
            "address_line2": "Floor 5",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400002",
            "lat": 19.0900,
            "lng": 72.8660,
            "is_default": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.addresses.insert_many(addresses)
    print(f"✅ Created {len(addresses)} addresses for customer")
    
    # 11. Create Delivery Partner
    delivery_partner = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "name": "Delivery Partner",
        "phone": "9333333333",
        "email": "delivery@example.com",
        "role": "delivery",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(delivery_partner)
    print(f"✅ Created Delivery Partner: {delivery_partner['phone']}")
    
    print("\n" + "="*80)
    print("🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("="*80)
    print("\n📋 TEST CREDENTIALS:")
    print("-" * 80)
    print(f"Super Admin     : {super_admin['phone']} (OTP in console)")
    print(f"Tenant Admin    : {tenant_admin['phone']} (OTP in console)")
    print(f"Customer 1      : {customers[0]['phone']} (OTP in console)")
    print(f"Customer 2      : {customers[1]['phone']} (OTP in console)")
    print(f"Delivery Partner: {delivery_partner['phone']} (OTP in console)")
    print("-" * 80)
    print(f"\n🏪 Created Tenant: {tenant['name']}")
    print(f"🍕 Created {len(stores)} restaurants with full menus")
    print("="*80 + "\n")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
