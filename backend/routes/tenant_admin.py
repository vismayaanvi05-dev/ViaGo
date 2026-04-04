from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.tenant import TenantSettings, TenantSettingsUpdate
from models.store import Store, StoreCreate, StoreUpdate, Category, CategoryCreate, CategoryUpdate
from models.item import Item, ItemCreate, ItemUpdate, ItemVariant, ItemVariantCreate, ItemVariantUpdate, AddOn, AddOnCreate, AddOnUpdate
from middleware.auth import get_current_user, require_role, verify_tenant_access, get_tenant_id
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/tenant-admin", tags=["Tenant Admin"])

def get_db():
    from server import db
    return db

# ==================== TENANT SETTINGS ====================

@router.get("/settings", response_model=TenantSettings)
async def get_tenant_settings(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get tenant settings (delivery charge, tax, markup)
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    settings = await db.tenant_settings.find_one({"tenant_id": tenant_id}, {"_id": 0})
    
    if not settings:
        # Create default settings if not exists
        default_settings = TenantSettings(tenant_id=tenant_id)
        settings_dict = default_settings.model_dump()
        settings_dict["created_at"] = settings_dict["created_at"].isoformat()
        settings_dict["updated_at"] = settings_dict["updated_at"].isoformat()
        await db.tenant_settings.insert_one(settings_dict)
        return default_settings
    
    # Convert datetime strings
    if isinstance(settings.get("created_at"), str):
        settings["created_at"] = datetime.fromisoformat(settings["created_at"])
    if isinstance(settings.get("updated_at"), str):
        settings["updated_at"] = datetime.fromisoformat(settings["updated_at"])
    
    return settings

@router.put("/settings", response_model=TenantSettings)
async def update_tenant_settings(
    settings_data: TenantSettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update tenant settings (delivery charge, tax, markup)
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    update_data = {k: v for k, v in settings_data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.tenant_settings.update_one(
        {"tenant_id": tenant_id},
        {"$set": update_data}
    )
    
    # Get updated settings
    updated_settings = await db.tenant_settings.find_one({"tenant_id": tenant_id}, {"_id": 0})
    
    # Convert datetime strings
    if isinstance(updated_settings.get("created_at"), str):
        updated_settings["created_at"] = datetime.fromisoformat(updated_settings["created_at"])
    if isinstance(updated_settings.get("updated_at"), str):
        updated_settings["updated_at"] = datetime.fromisoformat(updated_settings["updated_at"])
    
    return updated_settings

# ==================== STORE MANAGEMENT ====================

@router.post("/stores", response_model=Store)
async def create_store(
    store_data: StoreCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new store/restaurant
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    store = Store(tenant_id=tenant_id, **store_data.model_dump())
    store_dict = store.model_dump()
    store_dict["created_at"] = store_dict["created_at"].isoformat()
    store_dict["updated_at"] = store_dict["updated_at"].isoformat()
    
    await db.stores.insert_one(store_dict)
    return store

@router.get("/stores", response_model=List[Store])
async def list_my_stores(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_type: str = None
):
    """
    List all stores for tenant
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_deleted": False}
    if store_type:
        query["store_type"] = store_type
    
    stores = await db.stores.find(query, {"_id": 0}).to_list(100)
    
    for store in stores:
        if isinstance(store.get("created_at"), str):
            store["created_at"] = datetime.fromisoformat(store["created_at"])
        if isinstance(store.get("updated_at"), str):
            store["updated_at"] = datetime.fromisoformat(store["updated_at"])
    
    return stores

@router.get("/stores/{store_id}", response_model=Store)
async def get_store(
    store_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get store details
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    store = await db.stores.find_one({"id": store_id, "is_deleted": False}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    await verify_tenant_access(current_user, store["tenant_id"])
    
    # Convert datetime strings
    if isinstance(store.get("created_at"), str):
        store["created_at"] = datetime.fromisoformat(store["created_at"])
    if isinstance(store.get("updated_at"), str):
        store["updated_at"] = datetime.fromisoformat(store["updated_at"])
    
    return store

@router.put("/stores/{store_id}", response_model=Store)
async def update_store(
    store_id: str,
    store_data: StoreUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update store details
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    store = await db.stores.find_one({"id": store_id, "is_deleted": False})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    await verify_tenant_access(current_user, store["tenant_id"])
    
    update_data = {k: v for k, v in store_data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.stores.update_one(
        {"id": store_id},
        {"$set": update_data}
    )
    
    updated_store = await db.stores.find_one({"id": store_id}, {"_id": 0})
    
    # Convert datetime strings
    if isinstance(updated_store.get("created_at"), str):
        updated_store["created_at"] = datetime.fromisoformat(updated_store["created_at"])
    if isinstance(updated_store.get("updated_at"), str):
        updated_store["updated_at"] = datetime.fromisoformat(updated_store["updated_at"])
    
    return updated_store

@router.delete("/stores/{store_id}")
async def delete_store(
    store_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Soft delete store
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    store = await db.stores.find_one({"id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    await verify_tenant_access(current_user, store["tenant_id"])
    
    await db.stores.update_one(
        {"id": store_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"success": True, "message": "Store deleted"}

# ==================== CATEGORY MANAGEMENT ====================

@router.post("/categories", response_model=Category)
async def create_category(
    category_data: CategoryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create menu/product category
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # If store_id provided, verify access
    if category_data.store_id:
        store = await db.stores.find_one({"id": category_data.store_id})
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")
        await verify_tenant_access(current_user, store["tenant_id"])
    
    category = Category(tenant_id=tenant_id, **category_data.model_dump())
    category_dict = category.model_dump()
    category_dict["created_at"] = category_dict["created_at"].isoformat()
    
    await db.categories.insert_one(category_dict)
    return category

@router.get("/categories", response_model=List[Category])
async def list_categories(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: str = None,
    module: str = None
):
    """
    List categories for tenant/store
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    if store_id:
        query["store_id"] = store_id
    if module:
        query["module"] = module
    
    categories = await db.categories.find(query, {"_id": 0}).sort("sort_order", 1).to_list(100)
    
    for category in categories:
        if isinstance(category.get("created_at"), str):
            category["created_at"] = datetime.fromisoformat(category["created_at"])
    
    return categories

@router.put("/categories/{category_id}", response_model=Category)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update category
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await verify_tenant_access(current_user, category["tenant_id"])
    
    update_data = {k: v for k, v in category_data.model_dump(exclude_unset=True).items()}
    
    await db.categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    updated_category = await db.categories.find_one({"id": category_id}, {"_id": 0})
    
    if isinstance(updated_category.get("created_at"), str):
        updated_category["created_at"] = datetime.fromisoformat(updated_category["created_at"])
    
    return updated_category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete category
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await verify_tenant_access(current_user, category["tenant_id"])
    
    await db.categories.update_one(
        {"id": category_id},
        {"$set": {"is_active": False}}
    )
    
    return {"success": True, "message": "Category deleted"}

# ==================== ITEM/MENU MANAGEMENT ====================

@router.post("/items", response_model=Item)
async def create_item(
    item_data: ItemCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create menu item/product
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Verify store access
    store = await db.stores.find_one({"id": item_data.store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    await verify_tenant_access(current_user, store["tenant_id"])
    
    # Get tenant settings for default markup
    settings = await db.tenant_settings.find_one({"tenant_id": tenant_id})
    default_markup = settings.get("default_admin_markup_percentage", 0) if settings else 0
    
    # Calculate admin markup
    markup_percentage = item_data.admin_markup_percentage if item_data.admin_markup_percentage is not None else default_markup
    
    from utils.helpers import calculate_admin_markup
    markup_amount = calculate_admin_markup(item_data.base_price, markup_percentage)
    
    item = Item(
        tenant_id=tenant_id,
        **item_data.model_dump(),
        admin_markup_percentage=markup_percentage,
        admin_markup_amount=markup_amount
    )
    
    item_dict = item.model_dump()
    item_dict["created_at"] = item_dict["created_at"].isoformat()
    item_dict["updated_at"] = item_dict["updated_at"].isoformat()
    
    await db.items.insert_one(item_dict)
    return item

@router.get("/items", response_model=List[Item])
async def list_items(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: str = None,
    category_id: str = None,
    module: str = None,
    skip: int = 0,
    limit: int = 100
):
    """
    List items for tenant
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_deleted": False}
    if store_id:
        query["store_id"] = store_id
    if category_id:
        query["category_id"] = category_id
    if module:
        query["module"] = module
    
    items = await db.items.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for item in items:
        if isinstance(item.get("created_at"), str):
            item["created_at"] = datetime.fromisoformat(item["created_at"])
        if isinstance(item.get("updated_at"), str):
            item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    
    return items

@router.get("/items/{item_id}", response_model=Item)
async def get_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get item details
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    item = await db.items.find_one({"id": item_id, "is_deleted": False}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await verify_tenant_access(current_user, item["tenant_id"])
    
    # Convert datetime strings
    if isinstance(item.get("created_at"), str):
        item["created_at"] = datetime.fromisoformat(item["created_at"])
    if isinstance(item.get("updated_at"), str):
        item["updated_at"] = datetime.fromisoformat(item["updated_at"])
    
    return item

@router.put("/items/{item_id}", response_model=Item)
async def update_item(
    item_id: str,
    item_data: ItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update item
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    item = await db.items.find_one({"id": item_id, "is_deleted": False})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await verify_tenant_access(current_user, item["tenant_id"])
    
    update_data = {k: v for k, v in item_data.model_dump(exclude_unset=True).items()}
    
    # Recalculate markup if price or markup percentage changed
    if "base_price" in update_data or "admin_markup_percentage" in update_data:
        base_price = update_data.get("base_price", item["base_price"])
        markup_percentage = update_data.get("admin_markup_percentage", item.get("admin_markup_percentage", 0))
        
        from utils.helpers import calculate_admin_markup
        update_data["admin_markup_amount"] = calculate_admin_markup(base_price, markup_percentage)
    
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.items.update_one(
        {"id": item_id},
        {"$set": update_data}
    )
    
    updated_item = await db.items.find_one({"id": item_id}, {"_id": 0})
    
    # Convert datetime strings
    if isinstance(updated_item.get("created_at"), str):
        updated_item["created_at"] = datetime.fromisoformat(updated_item["created_at"])
    if isinstance(updated_item.get("updated_at"), str):
        updated_item["updated_at"] = datetime.fromisoformat(updated_item["updated_at"])
    
    return updated_item

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Soft delete item
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await verify_tenant_access(current_user, item["tenant_id"])
    
    await db.items.update_one(
        {"id": item_id},
        {"$set": {"is_deleted": True, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"success": True, "message": "Item deleted"}

# Continue in next file...



# ==================== VENDOR ADMIN MANAGEMENT ====================

from pydantic import BaseModel, EmailStr
from utils.helpers import get_password_hash

class VendorAdminCreate(BaseModel):
    store_id: str
    name: str
    email: EmailStr
    password: str

@router.post("/vendor-admins")
async def create_vendor_admin(
    vendor_data: VendorAdminCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create Vendor Admin with username/password (Tenant Admin only)
    For multi-vendor setup - restaurant/store owners
    """
    await require_role(current_user, ["tenant_admin"])
    
    tenant_id = current_user["tenant_id"]
    
    # Check if store exists and belongs to tenant
    store = await db.stores.find_one({"id": vendor_data.store_id, "tenant_id": tenant_id}, {"_id": 0})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": vendor_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create vendor admin user
    from models.user import User
    user = User(
        tenant_id=tenant_id,
        name=vendor_data.name,
        email=vendor_data.email,
        phone="",  # Optional for vendor admins
        role="vendor"
    )
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(vendor_data.password)
    user_dict["store_id"] = vendor_data.store_id  # Link to store
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return {
        "success": True,
        "message": "Vendor Admin created successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "store_id": vendor_data.store_id,
            "store_name": store["name"]
        }
    }

@router.get("/vendor-admins")
async def list_vendor_admins(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List all vendor admins for the tenant (Tenant Admin only)
    """
    await require_role(current_user, ["tenant_admin"])
    
    tenant_id = current_user["tenant_id"]
    
    vendors = await db.users.find(
        {"role": "vendor", "tenant_id": tenant_id},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    # Get store names
    for vendor in vendors:
        if vendor.get("store_id"):
            store = await db.stores.find_one({"id": vendor["store_id"]}, {"_id": 0, "name": 1})
            if store:
                vendor["store_name"] = store["name"]
    
    return vendors
