"""
Comprehensive seed script for ViaGo - creates tenants, stores, categories, items for all modules.
Run: cd /app/backend && python seed_data.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

def uid():
    return str(uuid.uuid4())

async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.hyperserve_db

    # ── Tenant 1: Mumbai ──
    t1_id = uid()
    t1 = {
        "id": t1_id, "name": "ViaGo Mumbai", "business_type": "multi_vendor",
        "active_modules": ["food", "grocery", "laundry"],
        "contact_email": "mumbai@viago.in", "contact_phone": "9876543210",
        "town": "Mumbai", "city": "Mumbai", "state": "Maharashtra",
        "lat": 19.076, "lng": 72.8777,
        "is_active": True, "status": "active",
        "onboarding_completed": True,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
    }

    # ── Tenant 2: Bengaluru ──
    t2_id = uid()
    t2 = {
        "id": t2_id, "name": "ViaGo Bengaluru", "business_type": "multi_vendor",
        "active_modules": ["food", "grocery", "laundry"],
        "contact_email": "bengaluru@viago.in", "contact_phone": "9876543211",
        "town": "Bengaluru", "city": "Bengaluru", "state": "Karnataka",
        "lat": 12.9716, "lng": 77.5946,
        "is_active": True, "status": "active",
        "onboarding_completed": True,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
    }

    # ── Tenant Settings ──
    ts1 = {
        "id": uid(), "tenant_id": t1_id,
        "delivery_charge_type": "flat", "flat_delivery_charge": 30,
        "delivery_charge_per_km": 0, "free_delivery_above": 500,
        "tax_enabled": True, "tax_percentage": 5,
        "min_order_amount": 99, "max_delivery_distance_km": 15,
    }
    ts2 = {
        "id": uid(), "tenant_id": t2_id,
        "delivery_charge_type": "flat", "flat_delivery_charge": 25,
        "delivery_charge_per_km": 0, "free_delivery_above": 400,
        "tax_enabled": True, "tax_percentage": 5,
        "min_order_amount": 79, "max_delivery_distance_km": 15,
    }

    # ─────────────────── MUMBAI STORES ───────────────────

    # Food Store 1
    fs1_id = uid()
    fs1 = {
        "id": fs1_id, "tenant_id": t1_id, "name": "Mumbai Spice Kitchen",
        "store_type": "restaurant", "description": "Authentic Mumbai street food & curries",
        "phone": "9876543001", "address": "Bandra West, Mumbai",
        "lat": 19.0596, "lng": 72.8295,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "09:00", "closing_time": "23:00",
        "avg_rating": 4.5, "total_reviews": 128,
        "delivery_radius_km": 10, "avg_prep_time_mins": 25,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }
    # Food Store 2
    fs2_id = uid()
    fs2 = {
        "id": fs2_id, "tenant_id": t1_id, "name": "Pizza Planet",
        "store_type": "restaurant", "description": "Wood-fired pizzas & Italian cuisine",
        "phone": "9876543002", "address": "Andheri, Mumbai",
        "lat": 19.1136, "lng": 72.8697,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "10:00", "closing_time": "23:30",
        "avg_rating": 4.3, "total_reviews": 95,
        "delivery_radius_km": 8, "avg_prep_time_mins": 30,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }
    # Grocery Store
    gs1_id = uid()
    gs1 = {
        "id": gs1_id, "tenant_id": t1_id, "name": "Fresh Mart",
        "store_type": "grocery", "description": "Fresh fruits, veggies & daily essentials",
        "phone": "9876543003", "address": "Juhu, Mumbai",
        "lat": 19.1075, "lng": 72.8263,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "07:00", "closing_time": "22:00",
        "avg_rating": 4.6, "total_reviews": 210,
        "delivery_radius_km": 10, "avg_prep_time_mins": 15,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }
    # Laundry Store
    ls1_id = uid()
    ls1 = {
        "id": ls1_id, "tenant_id": t1_id, "name": "CleanPress Laundry",
        "store_type": "laundry", "description": "Professional wash, dry clean & ironing",
        "phone": "9876543004", "address": "Powai, Mumbai",
        "lat": 19.1176, "lng": 72.9060,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "08:00", "closing_time": "20:00",
        "avg_rating": 4.4, "total_reviews": 76,
        "delivery_radius_km": 12, "avg_prep_time_mins": 120,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }

    # ─────────────────── BENGALURU STORES ───────────────────
    bfs1_id = uid()
    bfs1 = {
        "id": bfs1_id, "tenant_id": t2_id, "name": "Dosa Corner",
        "store_type": "restaurant", "description": "South Indian delicacies",
        "phone": "9876543005", "address": "Koramangala, Bengaluru",
        "lat": 12.9352, "lng": 77.6245,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "07:00", "closing_time": "22:00",
        "avg_rating": 4.7, "total_reviews": 320,
        "delivery_radius_km": 10, "avg_prep_time_mins": 20,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }
    bgs1_id = uid()
    bgs1 = {
        "id": bgs1_id, "tenant_id": t2_id, "name": "Nature's Basket BLR",
        "store_type": "grocery", "description": "Organic produce & premium groceries",
        "phone": "9876543006", "address": "Indiranagar, Bengaluru",
        "lat": 12.9784, "lng": 77.6408,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "06:00", "closing_time": "22:00",
        "avg_rating": 4.5, "total_reviews": 150,
        "delivery_radius_km": 8, "avg_prep_time_mins": 15,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }
    bls1_id = uid()
    bls1 = {
        "id": bls1_id, "tenant_id": t2_id, "name": "QuickWash BLR",
        "store_type": "laundry", "description": "Express laundry & dry cleaning",
        "phone": "9876543007", "address": "HSR Layout, Bengaluru",
        "lat": 12.9121, "lng": 77.6446,
        "is_active": True, "is_accepting_orders": True,
        "opening_time": "08:00", "closing_time": "20:00",
        "avg_rating": 4.3, "total_reviews": 89,
        "delivery_radius_km": 10, "avg_prep_time_mins": 90,
        "image_url": "", "created_at": datetime.now(timezone.utc),
    }

    all_stores = [fs1, fs2, gs1, ls1, bfs1, bgs1, bls1]

    # ─────────────────── CATEGORIES ───────────────────

    cat_mc_id, cat_st_id, cat_bv_id = uid(), uid(), uid()
    cat_pz_id, cat_ps_id = uid(), uid()
    cat_fr_id, cat_vg_id, cat_da_id = uid(), uid(), uid()
    cat_wf_id, cat_dc_id = uid(), uid()
    cat_si_id, cat_sn_id = uid(), uid()
    cat_bfr_id, cat_bvg_id = uid(), uid()
    cat_bwf_id, cat_bir_id = uid(), uid()

    categories = [
        {"id": cat_mc_id, "store_id": fs1_id, "name": "Main Course", "module": "food", "is_active": True, "sort_order": 1},
        {"id": cat_st_id, "store_id": fs1_id, "name": "Starters", "module": "food", "is_active": True, "sort_order": 2},
        {"id": cat_bv_id, "store_id": fs1_id, "name": "Beverages", "module": "food", "is_active": True, "sort_order": 3},
        {"id": cat_pz_id, "store_id": fs2_id, "name": "Pizzas", "module": "food", "is_active": True, "sort_order": 1},
        {"id": cat_ps_id, "store_id": fs2_id, "name": "Pasta & Sides", "module": "food", "is_active": True, "sort_order": 2},
        {"id": cat_fr_id, "store_id": gs1_id, "name": "Fruits", "module": "grocery", "is_active": True, "sort_order": 1},
        {"id": cat_vg_id, "store_id": gs1_id, "name": "Vegetables", "module": "grocery", "is_active": True, "sort_order": 2},
        {"id": cat_da_id, "store_id": gs1_id, "name": "Dairy & Eggs", "module": "grocery", "is_active": True, "sort_order": 3},
        {"id": cat_wf_id, "store_id": ls1_id, "name": "Wash & Fold", "module": "laundry", "is_active": True, "sort_order": 1},
        {"id": cat_dc_id, "store_id": ls1_id, "name": "Dry Cleaning", "module": "laundry", "is_active": True, "sort_order": 2},
        {"id": cat_si_id, "store_id": bfs1_id, "name": "South Indian", "module": "food", "is_active": True, "sort_order": 1},
        {"id": cat_sn_id, "store_id": bfs1_id, "name": "Snacks & Chaats", "module": "food", "is_active": True, "sort_order": 2},
        {"id": cat_bfr_id, "store_id": bgs1_id, "name": "Organic Fruits", "module": "grocery", "is_active": True, "sort_order": 1},
        {"id": cat_bvg_id, "store_id": bgs1_id, "name": "Fresh Vegetables", "module": "grocery", "is_active": True, "sort_order": 2},
        {"id": cat_bwf_id, "store_id": bls1_id, "name": "Wash & Iron", "module": "laundry", "is_active": True, "sort_order": 1},
        {"id": cat_bir_id, "store_id": bls1_id, "name": "Premium Dry Clean", "module": "laundry", "is_active": True, "sort_order": 2},
    ]

    items = [
        {"id": uid(), "store_id": fs1_id, "category_id": cat_mc_id, "name": "Butter Chicken", "description": "Creamy tomato-based chicken curry", "price": 280, "is_available": True, "is_veg": False, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_mc_id, "name": "Paneer Tikka Masala", "description": "Grilled paneer in spiced gravy", "price": 240, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_mc_id, "name": "Dal Makhani", "description": "Slow-cooked black lentils", "price": 180, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_st_id, "name": "Chicken Tikka", "description": "Charcoal grilled chicken", "price": 220, "is_available": True, "is_veg": False, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_st_id, "name": "Paneer 65", "description": "Spicy fried paneer cubes", "price": 190, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_bv_id, "name": "Mango Lassi", "description": "Sweet mango yogurt drink", "price": 90, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs1_id, "category_id": cat_bv_id, "name": "Masala Chai", "description": "Traditional Indian spiced tea", "price": 50, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs2_id, "category_id": cat_pz_id, "name": "Margherita Pizza", "description": "Classic tomato, mozzarella & basil", "price": 299, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs2_id, "category_id": cat_pz_id, "name": "Pepperoni Pizza", "description": "Loaded with pepperoni & cheese", "price": 399, "is_available": True, "is_veg": False, "module": "food"},
        {"id": uid(), "store_id": fs2_id, "category_id": cat_pz_id, "name": "Farm Fresh Pizza", "description": "Bell peppers, mushrooms, olives, onions", "price": 349, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs2_id, "category_id": cat_ps_id, "name": "Penne Arrabbiata", "description": "Penne in spicy tomato sauce", "price": 249, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": fs2_id, "category_id": cat_ps_id, "name": "Garlic Bread", "description": "Toasted garlic bread with cheese", "price": 129, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_fr_id, "name": "Alphonso Mangoes", "description": "Premium Ratnagiri mangoes - 1kg", "price": 450, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_fr_id, "name": "Bananas", "description": "Fresh yellow bananas - 1 dozen", "price": 60, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 dozen"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_fr_id, "name": "Apples", "description": "Kashmir apples - 1kg", "price": 180, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_vg_id, "name": "Tomatoes", "description": "Farm fresh tomatoes - 1kg", "price": 40, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_vg_id, "name": "Onions", "description": "Red onions - 1kg", "price": 35, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_vg_id, "name": "Potatoes", "description": "Fresh potatoes - 1kg", "price": 30, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_da_id, "name": "Amul Milk (1L)", "description": "Full cream toned milk", "price": 65, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 L"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_da_id, "name": "Farm Eggs (6 pcs)", "description": "Free-range eggs pack of 6", "price": 55, "is_available": True, "is_veg": False, "module": "grocery", "unit": "6 pcs"},
        {"id": uid(), "store_id": gs1_id, "category_id": cat_da_id, "name": "Paneer (200g)", "description": "Fresh cottage cheese block", "price": 85, "is_available": True, "is_veg": True, "module": "grocery", "unit": "200g"},
        {"id": uid(), "store_id": ls1_id, "category_id": cat_wf_id, "name": "Regular Wash & Fold", "description": "Standard wash, dry and fold per kg", "price": 60, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per kg"},
        {"id": uid(), "store_id": ls1_id, "category_id": cat_wf_id, "name": "Express Wash & Fold", "description": "Same-day wash and fold per kg", "price": 100, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per kg"},
        {"id": uid(), "store_id": ls1_id, "category_id": cat_dc_id, "name": "Suit Dry Clean", "description": "Professional suit dry cleaning", "price": 350, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per piece"},
        {"id": uid(), "store_id": ls1_id, "category_id": cat_dc_id, "name": "Saree Dry Clean", "description": "Delicate saree dry cleaning", "price": 250, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per piece"},
        {"id": uid(), "store_id": ls1_id, "category_id": cat_dc_id, "name": "Jacket Dry Clean", "description": "Jacket / blazer dry cleaning", "price": 300, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per piece"},
        {"id": uid(), "store_id": bfs1_id, "category_id": cat_si_id, "name": "Masala Dosa", "description": "Crispy dosa with potato filling", "price": 80, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": bfs1_id, "category_id": cat_si_id, "name": "Idli Sambar (4 pcs)", "description": "Soft idli with sambar & chutney", "price": 60, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": bfs1_id, "category_id": cat_si_id, "name": "Rava Dosa", "description": "Crispy semolina crepe", "price": 90, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": bfs1_id, "category_id": cat_sn_id, "name": "Pani Puri (6 pcs)", "description": "Crispy puris with tangy water", "price": 50, "is_available": True, "is_veg": True, "module": "food"},
        {"id": uid(), "store_id": bgs1_id, "category_id": cat_bfr_id, "name": "Organic Mangoes", "description": "Organic alphonso - 1kg", "price": 500, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 kg"},
        {"id": uid(), "store_id": bgs1_id, "category_id": cat_bfr_id, "name": "Dragon Fruit", "description": "Imported dragon fruit", "price": 120, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 pc"},
        {"id": uid(), "store_id": bgs1_id, "category_id": cat_bvg_id, "name": "Baby Spinach", "description": "Organic baby spinach - 200g", "price": 60, "is_available": True, "is_veg": True, "module": "grocery", "unit": "200g"},
        {"id": uid(), "store_id": bgs1_id, "category_id": cat_bvg_id, "name": "Avocado", "description": "Imported Hass avocado", "price": 150, "is_available": True, "is_veg": True, "module": "grocery", "unit": "1 pc"},
        {"id": uid(), "store_id": bls1_id, "category_id": cat_bwf_id, "name": "Wash & Iron", "description": "Standard wash and iron per kg", "price": 50, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per kg"},
        {"id": uid(), "store_id": bls1_id, "category_id": cat_bwf_id, "name": "Steam Iron Only", "description": "Steam press per piece", "price": 20, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per piece"},
        {"id": uid(), "store_id": bls1_id, "category_id": cat_bir_id, "name": "Silk Saree Clean", "description": "Premium silk saree cleaning", "price": 400, "is_available": True, "is_veg": True, "module": "laundry", "unit": "per piece"},
    ]

    # ─────────────────── WRITE TO DB ───────────────────
    for col in ["tenants", "stores", "categories", "items", "tenant_settings", "carts"]:
        await db[col].delete_many({})
    print("Cleared existing data")

    await db.tenants.insert_many([t1, t2])
    print(f"Inserted 2 tenants (Mumbai + Bengaluru)")

    await db.tenant_settings.insert_many([ts1, ts2])
    print(f"Inserted 2 tenant settings")

    await db.stores.insert_many(all_stores)
    print(f"Inserted {len(all_stores)} stores")

    await db.categories.insert_many(categories)
    print(f"Inserted {len(categories)} categories")

    await db.items.insert_many(items)
    print(f"Inserted {len(items)} items")

    print("\n--- Verification ---")
    for t in [t1, t2]:
        stores = await db.stores.find({"tenant_id": t["id"]}).to_list(100)
        print(f"{t['name']} ({t['town']}): {len(stores)} stores")
        for s in stores:
            cats = await db.categories.find({"store_id": s["id"]}).to_list(100)
            item_count = await db.items.count_documents({"store_id": s["id"]})
            print(f"  - {s['name']} ({s['store_type']}): {len(cats)} cats, {item_count} items")

    print("\nSeed complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
