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
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="HyperServe SaaS API",
    description="Multi-tenant SaaS platform for Food, Grocery, and Laundry delivery",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import all route modules
from routes.auth import router as auth_router
from routes.super_admin import router as super_admin_router
from routes.tenant_admin import router as tenant_admin_router
from routes.tenant_admin_orders import router as tenant_admin_orders_router
from routes.customer import router as customer_router
from routes.delivery_partner import router as delivery_partner_router
from routes.grocery_admin import router as grocery_admin_router
from routes.laundry_admin import router as laundry_admin_router
from routes.order_management import router as order_management_router

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "HyperServe API is running",
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
app.include_router(super_admin_router, prefix="/api")
app.include_router(tenant_admin_router, prefix="/api")
app.include_router(tenant_admin_orders_router, prefix="/api")
app.include_router(customer_router, prefix="/api")
app.include_router(delivery_partner_router, prefix="/api")
app.include_router(grocery_admin_router, prefix="/api")
app.include_router(laundry_admin_router, prefix="/api")
app.include_router(order_management_router, prefix="/api")

# Include the main API router
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
    logger.info("🚀 HyperServe API starting up...")
    logger.info(f"📊 Database: {os.environ['DB_NAME']}")
    logger.info("✅ All routes loaded successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    logger.info("Shutting down database connection...")
    client.close()