"""
Minimal seed script - Only creates Super Admin
Everything else will be created dynamically through the UI
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
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
    
    print("🌱 Starting minimal database seeding...")
    
    # Clear existing data
    collections = await db.list_collection_names()
    for collection in collections:
        await db[collection].delete_many({})
    print("🗑️  Cleared existing data")
    
    # Create ONLY Super Admin (You - the SaaS owner)
    super_admin_id = str(uuid.uuid4())
    super_admin = {
        "id": super_admin_id,
        "tenant_id": None,
        "name": "Super Admin",
        "phone": "",
        "email": "admin@hyperserve.com",
        "password": get_password_hash("admin123"),
        "role": "super_admin",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(super_admin)
    
    # Create default subscription plans
    plans = [
        {
            "id": str(uuid.uuid4()),
            "name": "Starter Plan",
            "description": "Perfect for small businesses",
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
            "description": "Best for large businesses",
            "pricing_type": "hybrid",
            "monthly_fee": 4999.0,
            "commission_percentage": 8.0,
            "features": ["Unlimited orders", "Multi-store", "Dedicated support", "Custom integrations"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.subscription_plans.insert_many(plans)
    
    print("\n" + "="*80)
    print("🎉 DATABASE SEEDING COMPLETED!")
    print("="*80)
    print("\n📋 SUPER ADMIN CREDENTIALS:")
    print("-" * 80)
    print(f"Email    : {super_admin['email']}")
    print(f"Password : admin123")
    print("-" * 80)
    print("\n✅ Login at: /admin-login")
    print("✅ Create Tenant Admins from Super Admin Dashboard")
    print("✅ Tenant Admins can create Vendor Admins")
    print("="*80 + "\n")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
