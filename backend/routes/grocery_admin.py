from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from models.grocery import (
    GroceryCategory, GroceryCategoryCreate, GroceryCategoryUpdate,
    GroceryProduct, GroceryProductCreate, GroceryProductUpdate,
    InventoryTransaction, InventoryTransactionCreate, StockUpdate
)
from middleware.auth import get_current_user, require_role, verify_tenant_access, get_tenant_id, require_module_access

router = APIRouter(prefix="/grocery-admin", tags=["Grocery Admin"])

def get_db():
    from server import db
    return db


# ==================== CATEGORY ENDPOINTS ====================

@router.get("/categories", response_model=List[GroceryCategory])
async def list_categories(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    parent_id: Optional[str] = None
):
    """List grocery categories"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    await require_module_access(current_user, "grocery")
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_active": True}
    
    # Vendor filtering
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    # Filter by parent (for subcategories)
    if parent_id == "null" or parent_id == "":
        query["parent_id"] = None
    elif parent_id:
        query["parent_id"] = parent_id
    
    categories = await db.grocery_categories.find(query, {"_id": 0}).sort("sort_order", 1).to_list(200)
    
    for cat in categories:
        if isinstance(cat.get("created_at"), str):
            cat["created_at"] = datetime.fromisoformat(cat["created_at"])
        if isinstance(cat.get("updated_at"), str):
            cat["updated_at"] = datetime.fromisoformat(cat["updated_at"])
    
    return categories


@router.post("/categories", response_model=GroceryCategory)
async def create_category(
    category_data: GroceryCategoryCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create grocery category"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Vendor store check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if category_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create categories for their store")
    
    category = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": category_data.store_id,
        "name": category_data.name,
        "description": category_data.description,
        "parent_id": category_data.parent_id,
        "image_url": category_data.image_url,
        "sort_order": category_data.sort_order,
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    await db.grocery_categories.insert_one(category)
    category["created_at"] = datetime.fromisoformat(category["created_at"])
    category["updated_at"] = datetime.fromisoformat(category["updated_at"])
    
    return category


@router.put("/categories/{category_id}", response_model=GroceryCategory)
async def update_category(
    category_id: str,
    category_data: GroceryCategoryUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update grocery category"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    category = await db.grocery_categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await verify_tenant_access(current_user, category["tenant_id"])
    
    # Vendor check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if category.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's categories")
    
    update_data = {k: v for k, v in category_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.now().isoformat()
    
    await db.grocery_categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    updated = await db.grocery_categories.find_one({"id": category_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete grocery category (soft delete)"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    category = await db.grocery_categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    await verify_tenant_access(current_user, category["tenant_id"])
    
    # Vendor check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if category.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only delete their store's categories")
    
    await db.grocery_categories.update_one(
        {"id": category_id},
        {"$set": {"is_active": False, "updated_at": datetime.now().isoformat()}}
    )
    
    return {"message": "Category deleted successfully"}


# ==================== PRODUCT ENDPOINTS ====================

@router.get("/products", response_model=List[GroceryProduct])
async def list_products(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None,
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List grocery products"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id, "is_deleted": False}
    
    # Vendor filtering
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if category_id:
        query["category_id"] = category_id
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.grocery_products.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
        if isinstance(product.get("updated_at"), str):
            product["updated_at"] = datetime.fromisoformat(product["updated_at"])
    
    return products


@router.post("/products", response_model=GroceryProduct)
async def create_product(
    product_data: GroceryProductCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create grocery product"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Vendor store check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if product_data.store_id != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only create products for their store")
    
    # Calculate discount percentage
    discount_pct = ((product_data.mrp - product_data.selling_price) / product_data.mrp * 100) if product_data.mrp > 0 else 0
    
    product = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": product_data.store_id,
        "category_id": product_data.category_id,
        "name": product_data.name,
        "description": product_data.description,
        "brand": product_data.brand,
        "mrp": product_data.mrp,
        "selling_price": product_data.selling_price,
        "discount_percentage": round(discount_pct, 2),
        "unit_type": product_data.unit_type,
        "unit_value": product_data.unit_value,
        "current_stock": product_data.current_stock,
        "low_stock_threshold": product_data.low_stock_threshold,
        "images": product_data.images,
        "is_organic": product_data.is_organic,
        "is_fresh": product_data.is_fresh,
        "tags": product_data.tags,
        "is_available": True,
        "is_deleted": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    await db.grocery_products.insert_one(product)
    
    # Create initial inventory transaction
    if product_data.current_stock > 0:
        transaction = {
            "id": str(uuid4()),
            "tenant_id": tenant_id,
            "store_id": product_data.store_id,
            "product_id": product["id"],
            "transaction_type": "stock_in",
            "quantity": product_data.current_stock,
            "previous_stock": 0,
            "new_stock": product_data.current_stock,
            "notes": "Initial stock",
            "created_by": current_user.get("user_id"),
            "created_at": datetime.now().isoformat()
        }
        await db.inventory_transactions.insert_one(transaction)
    
    product["created_at"] = datetime.fromisoformat(product["created_at"])
    product["updated_at"] = datetime.fromisoformat(product["updated_at"])
    
    return product


@router.put("/products/{product_id}", response_model=GroceryProduct)
async def update_product(
    product_id: str,
    product_data: GroceryProductUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update grocery product"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    product = await db.grocery_products.find_one({"id": product_id, "is_deleted": False})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await verify_tenant_access(current_user, product["tenant_id"])
    
    # Vendor check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if product.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's products")
    
    update_data = {k: v for k, v in product_data.dict(exclude_unset=True).items()}
    
    # Recalculate discount if price changed
    if "mrp" in update_data or "selling_price" in update_data:
        mrp = update_data.get("mrp", product["mrp"])
        selling_price = update_data.get("selling_price", product["selling_price"])
        update_data["discount_percentage"] = round(((mrp - selling_price) / mrp * 100), 2) if mrp > 0 else 0
    
    update_data["updated_at"] = datetime.now().isoformat()
    
    await db.grocery_products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    updated = await db.grocery_products.find_one({"id": product_id}, {"_id": 0})
    updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    
    return updated


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete grocery product (soft delete)"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    
    product = await db.grocery_products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await verify_tenant_access(current_user, product["tenant_id"])
    
    # Vendor check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if product.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only delete their store's products")
    
    await db.grocery_products.update_one(
        {"id": product_id},
        {"$set": {"is_deleted": True, "is_available": False, "updated_at": datetime.now().isoformat()}}
    )
    
    return {"message": "Product deleted successfully"}


# ==================== INVENTORY ENDPOINTS ====================

@router.post("/inventory/update-stock")
async def update_stock(
    stock_data: StockUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update product stock"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    product = await db.grocery_products.find_one({"id": stock_data.product_id, "is_deleted": False})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await verify_tenant_access(current_user, product["tenant_id"])
    
    # Vendor check
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if product.get("store_id") != vendor_store_id:
            raise HTTPException(status_code=403, detail="Vendors can only update their store's inventory")
    
    current_stock = product.get("current_stock", 0)
    new_stock = current_stock
    
    if stock_data.operation == "add":
        new_stock = current_stock + stock_data.quantity
        transaction_type = "stock_in"
    elif stock_data.operation == "subtract":
        new_stock = max(0, current_stock - stock_data.quantity)
        transaction_type = "stock_out"
    elif stock_data.operation == "set":
        new_stock = stock_data.quantity
        transaction_type = "adjustment"
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")
    
    # Update product stock
    await db.grocery_products.update_one(
        {"id": stock_data.product_id},
        {"$set": {"current_stock": new_stock, "updated_at": datetime.now().isoformat()}}
    )
    
    # Create inventory transaction
    transaction = {
        "id": str(uuid4()),
        "tenant_id": tenant_id,
        "store_id": stock_data.store_id,
        "product_id": stock_data.product_id,
        "transaction_type": transaction_type,
        "quantity": stock_data.quantity,
        "previous_stock": current_stock,
        "new_stock": new_stock,
        "notes": stock_data.notes,
        "created_by": current_user.get("user_id"),
        "created_at": datetime.now().isoformat()
    }
    await db.inventory_transactions.insert_one(transaction)
    
    return {
        "message": "Stock updated successfully",
        "previous_stock": current_stock,
        "new_stock": new_stock
    }


@router.get("/inventory/transactions", response_model=List[InventoryTransaction])
async def list_inventory_transactions(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    product_id: Optional[str] = None,
    store_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List inventory transactions"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    query = {"tenant_id": tenant_id}
    
    # Vendor filtering
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    if product_id:
        query["product_id"] = product_id
    
    transactions = await db.inventory_transactions.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for txn in transactions:
        if isinstance(txn.get("created_at"), str):
            txn["created_at"] = datetime.fromisoformat(txn["created_at"])
    
    return transactions


@router.get("/inventory/low-stock")
async def get_low_stock_products(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: Optional[str] = None
):
    """Get products with low stock"""
    await require_role(current_user, ["tenant_admin", "super_admin", "vendor"])
    tenant_id = await get_tenant_id(current_user)
    
    query = {"tenant_id": tenant_id, "is_deleted": False}
    
    # Vendor filtering
    if current_user.get("role") == "vendor":
        vendor_store_id = current_user.get("store_id")
        if not vendor_store_id:
            raise HTTPException(status_code=400, detail="Vendor must be assigned to a store")
        query["store_id"] = vendor_store_id
    elif store_id:
        query["store_id"] = store_id
    
    # Find products where current_stock <= low_stock_threshold
    products = await db.grocery_products.find(query, {"_id": 0}).to_list(1000)
    
    low_stock_products = [
        p for p in products 
        if p.get("current_stock", 0) <= p.get("low_stock_threshold", 0)
    ]
    
    return {
        "count": len(low_stock_products),
        "products": low_stock_products
    }
