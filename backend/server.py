from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'via_go')]

# Create the main app
app = FastAPI(
    title="ViaGo API",
    description="Customer and Delivery Partner Mobile App Backend",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import route modules
from routes.auth import router as auth_router
from routes.customer import router as customer_router
from routes.delivery import router as delivery_router

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "ViaGo API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }

# Include all routers
app.include_router(auth_router, prefix="/api")
app.include_router(customer_router, prefix="/api")
app.include_router(delivery_router, prefix="/api")

# Include the main API router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 ViaGo API starting up...")
    # Seed sample data if needed
    await seed_sample_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down database connection...")
    client.close()

async def seed_sample_data():
    """Seed sample data for testing"""
    import uuid
    from datetime import datetime
    
    # Check if data already exists
    existing_stores = await db.stores.count_documents({})
    if existing_stores > 0:
        logger.info("Sample data already exists, skipping seed")
        return
    
    logger.info("Seeding sample data...")
    
    # Create tenant
    tenant_id = str(uuid.uuid4())
    tenant = {
        "id": tenant_id,
        "name": "ViaGo Demo",
        "business_type": "single_vendor",
        "active_modules": ["food", "grocery", "laundry"],
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }
    await db.tenants.insert_one(tenant)
    
    # Create tenant settings
    settings = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "delivery_charge_type": "flat",
        "flat_delivery_charge": 30.0,
        "tax_enabled": True,
        "tax_percentage": 5.0,
        "created_at": datetime.utcnow().isoformat()
    }
    await db.tenant_settings.insert_one(settings)
    
    # Create sample restaurants
    restaurants = [
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Spice Garden",
            "store_type": "restaurant",
            "description": "Authentic Indian cuisine with a modern twist",
            "address_line": "123 Main Street, Downtown",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "lat": 19.0760,
            "lng": 72.8777,
            "phone": "9876543210",
            "delivery_radius_km": 5.0,
            "minimum_order_value": 100.0,
            "average_prep_time_minutes": 30,
            "cuisine_types": ["Indian", "North Indian"],
            "is_active": True,
            "is_accepting_orders": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Pizza Paradise",
            "store_type": "restaurant",
            "description": "Best pizzas in town with fresh ingredients",
            "address_line": "456 Food Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400002",
            "lat": 19.0850,
            "lng": 72.8900,
            "phone": "9876543211",
            "delivery_radius_km": 7.0,
            "minimum_order_value": 150.0,
            "average_prep_time_minutes": 25,
            "cuisine_types": ["Italian", "Fast Food"],
            "is_active": True,
            "is_accepting_orders": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Fresh Mart",
            "store_type": "grocery",
            "description": "Fresh vegetables, fruits and daily essentials",
            "address_line": "789 Market Lane",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400003",
            "lat": 19.0700,
            "lng": 72.8700,
            "phone": "9876543212",
            "delivery_radius_km": 3.0,
            "minimum_order_value": 200.0,
            "average_prep_time_minutes": 15,
            "is_active": True,
            "is_accepting_orders": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "name": "Clean & Fresh Laundry",
            "store_type": "laundry",
            "description": "Professional laundry and dry cleaning services",
            "address_line": "321 Service Road",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400004",
            "lat": 19.0800,
            "lng": 72.8800,
            "phone": "9876543213",
            "delivery_radius_km": 5.0,
            "minimum_order_value": 150.0,
            "average_prep_time_minutes": 60,
            "is_active": True,
            "is_accepting_orders": True,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    
    for store in restaurants:
        await db.stores.insert_one(store)
        
        # Create categories and items for each store
        if store["store_type"] == "restaurant":
            categories = [
                {"name": "Starters", "items": [
                    {"name": "Paneer Tikka", "price": 180, "description": "Grilled cottage cheese with spices", "is_veg": True},
                    {"name": "Chicken Wings", "price": 220, "description": "Crispy fried chicken wings", "is_veg": False},
                    {"name": "Spring Rolls", "price": 150, "description": "Crispy vegetable rolls", "is_veg": True}
                ]},
                {"name": "Main Course", "items": [
                    {"name": "Butter Chicken", "price": 280, "description": "Creamy tomato-based chicken curry", "is_veg": False},
                    {"name": "Paneer Butter Masala", "price": 220, "description": "Cottage cheese in rich gravy", "is_veg": True},
                    {"name": "Dal Makhani", "price": 180, "description": "Creamy black lentils", "is_veg": True}
                ]},
                {"name": "Breads", "items": [
                    {"name": "Butter Naan", "price": 40, "description": "Soft bread with butter", "is_veg": True},
                    {"name": "Garlic Naan", "price": 50, "description": "Bread with garlic topping", "is_veg": True},
                    {"name": "Tandoori Roti", "price": 30, "description": "Whole wheat bread", "is_veg": True}
                ]}
            ]
        elif store["store_type"] == "grocery":
            categories = [
                {"name": "Fruits", "items": [
                    {"name": "Apples (1kg)", "price": 150, "description": "Fresh red apples", "unit_type": "kg"},
                    {"name": "Bananas (1 dozen)", "price": 50, "description": "Ripe yellow bananas", "unit_type": "dozen"},
                    {"name": "Oranges (1kg)", "price": 80, "description": "Juicy oranges", "unit_type": "kg"}
                ]},
                {"name": "Vegetables", "items": [
                    {"name": "Tomatoes (1kg)", "price": 40, "description": "Fresh red tomatoes", "unit_type": "kg"},
                    {"name": "Onions (1kg)", "price": 35, "description": "Fresh onions", "unit_type": "kg"},
                    {"name": "Potatoes (1kg)", "price": 30, "description": "Fresh potatoes", "unit_type": "kg"}
                ]},
                {"name": "Dairy", "items": [
                    {"name": "Milk (1L)", "price": 60, "description": "Fresh cow milk", "unit_type": "litre"},
                    {"name": "Curd (500g)", "price": 35, "description": "Fresh curd", "unit_type": "pack"},
                    {"name": "Butter (100g)", "price": 55, "description": "Amul butter", "unit_type": "pack"}
                ]}
            ]
        else:  # laundry
            categories = [
                {"name": "Wash & Fold", "items": [
                    {"name": "Shirt", "price": 30, "description": "Wash and fold service"},
                    {"name": "Pants", "price": 40, "description": "Wash and fold service"},
                    {"name": "T-Shirt", "price": 25, "description": "Wash and fold service"}
                ]},
                {"name": "Dry Cleaning", "items": [
                    {"name": "Suit", "price": 350, "description": "Professional dry cleaning"},
                    {"name": "Saree", "price": 200, "description": "Delicate dry cleaning"},
                    {"name": "Blanket", "price": 250, "description": "Large item cleaning"}
                ]}
            ]
        
        for cat in categories:
            cat_id = str(uuid.uuid4())
            category = {
                "id": cat_id,
                "tenant_id": tenant_id,
                "store_id": store["id"],
                "module": "food" if store["store_type"] == "restaurant" else store["store_type"],
                "name": cat["name"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            await db.categories.insert_one(category)
            
            for item_data in cat["items"]:
                item = {
                    "id": str(uuid.uuid4()),
                    "tenant_id": tenant_id,
                    "store_id": store["id"],
                    "category_id": cat_id,
                    "module": "food" if store["store_type"] == "restaurant" else store["store_type"],
                    "name": item_data["name"],
                    "description": item_data.get("description", ""),
                    "base_price": item_data["price"],
                    "is_veg": item_data.get("is_veg"),
                    "unit_type": item_data.get("unit_type"),
                    "is_available": True,
                    "in_stock": True,
                    "created_at": datetime.utcnow().isoformat()
                }
                await db.items.insert_one(item)
    
    logger.info("✅ Sample data seeded successfully!")
