from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.item import ItemVariant, ItemVariantCreate, ItemVariantUpdate, AddOn, AddOnCreate, AddOnUpdate
from models.order import Order, OrderUpdate
from middleware.auth import get_current_user, require_role, verify_tenant_access, get_tenant_id
from datetime import datetime
from typing import List

router = APIRouter(prefix="/tenant-admin", tags=["Tenant Admin - Items & Orders"])

def get_db():
    from server import db
    return db

# ==================== ITEM VARIANTS ====================

@router.post("/variants", response_model=ItemVariant)
async def create_variant(
    variant_data: ItemVariantCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create item variant (size, weight option)
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    # Verify item access
    item = await db.items.find_one({"id": variant_data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await verify_tenant_access(current_user, item["tenant_id"])
    
    variant = ItemVariant(tenant_id=tenant_id, **variant_data.model_dump())
    variant_dict = variant.model_dump()
    variant_dict["created_at"] = variant_dict["created_at"].isoformat()
    
    await db.item_variants.insert_one(variant_dict)
    return variant

@router.get("/variants")
async def list_variants(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List variants for an item
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    # Verify item access
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await verify_tenant_access(current_user, item["tenant_id"])
    
    variants = await db.item_variants.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    
    for variant in variants:
        if isinstance(variant.get("created_at"), str):
            variant["created_at"] = datetime.fromisoformat(variant["created_at"])
    
    return variants

@router.put("/variants/{variant_id}", response_model=ItemVariant)
async def update_variant(
    variant_id: str,
    variant_data: ItemVariantUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update variant
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    variant = await db.item_variants.find_one({"id": variant_id})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    await verify_tenant_access(current_user, variant["tenant_id"])
    
    update_data = {k: v for k, v in variant_data.model_dump(exclude_unset=True).items()}
    
    await db.item_variants.update_one(
        {"id": variant_id},
        {"$set": update_data}
    )
    
    updated_variant = await db.item_variants.find_one({"id": variant_id}, {"_id": 0})
    
    if isinstance(updated_variant.get("created_at"), str):
        updated_variant["created_at"] = datetime.fromisoformat(updated_variant["created_at"])
    
    return updated_variant

@router.delete("/variants/{variant_id}")
async def delete_variant(
    variant_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete variant
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    variant = await db.item_variants.find_one({"id": variant_id})
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    await verify_tenant_access(current_user, variant["tenant_id"])
    
    await db.item_variants.delete_one({"id": variant_id})
    
    return {"success": True, "message": "Variant deleted"}

# ==================== ADD-ONS ====================

@router.post("/addons", response_model=AddOn)
async def create_addon(
    addon_data: AddOnCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create item add-on
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    # Verify item access
    item = await db.items.find_one({"id": addon_data.item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await verify_tenant_access(current_user, item["tenant_id"])
    
    addon = AddOn(tenant_id=tenant_id, **addon_data.model_dump())
    addon_dict = addon.model_dump()
    addon_dict["created_at"] = addon_dict["created_at"].isoformat()
    
    await db.add_ons.insert_one(addon_dict)
    return addon

@router.get("/addons")
async def list_addons(
    item_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List add-ons for an item
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    # Verify item access
    item = await db.items.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await verify_tenant_access(current_user, item["tenant_id"])
    
    addons = await db.add_ons.find({"item_id": item_id}, {"_id": 0}).to_list(100)
    
    for addon in addons:
        if isinstance(addon.get("created_at"), str):
            addon["created_at"] = datetime.fromisoformat(addon["created_at"])
    
    return addons

@router.put("/addons/{addon_id}", response_model=AddOn)
async def update_addon(
    addon_id: str,
    addon_data: AddOnUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update add-on
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    addon = await db.add_ons.find_one({"id": addon_id})
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found")
    
    await verify_tenant_access(current_user, addon["tenant_id"])
    
    update_data = {k: v for k, v in addon_data.model_dump(exclude_unset=True).items()}
    
    await db.add_ons.update_one(
        {"id": addon_id},
        {"$set": update_data}
    )
    
    updated_addon = await db.add_ons.find_one({"id": addon_id}, {"_id": 0})
    
    if isinstance(updated_addon.get("created_at"), str):
        updated_addon["created_at"] = datetime.fromisoformat(updated_addon["created_at"])
    
    return updated_addon

@router.delete("/addons/{addon_id}")
async def delete_addon(
    addon_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Delete add-on
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    addon = await db.add_ons.find_one({"id": addon_id})
    if not addon:
        raise HTTPException(status_code=404, detail="Add-on not found")
    
    await verify_tenant_access(current_user, addon["tenant_id"])
    
    await db.add_ons.delete_one({"id": addon_id})
    
    return {"success": True, "message": "Add-on deleted"}

# ==================== ORDER MANAGEMENT ====================

@router.get("/orders")
async def list_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: str = None,
    status_filter: str = None,
    skip: int = 0,
    limit: int = 50
):
    """
    List orders for tenant (with filters)
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    query = {"tenant_id": tenant_id}
    if store_id:
        query["store_id"] = store_id
    if status_filter:
        query["status"] = status_filter
    
    orders = await db.orders.find(query, {"_id": 0}).skip(skip).limit(limit).sort("placed_at", -1).to_list(limit)
    
    # Enrich with customer and store details
    for order in orders:
        # Get customer name
        customer = await db.users.find_one({"id": order["customer_id"]}, {"_id": 0, "name": 1, "phone": 1})
        if customer:
            order["customer_name"] = customer.get("name")
            order["customer_phone"] = customer.get("phone")
        
        # Get store name
        store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0, "name": 1})
        if store:
            order["store_name"] = store.get("name")
        
        # Convert datetime strings
        if isinstance(order.get("placed_at"), str):
            order["placed_at"] = datetime.fromisoformat(order["placed_at"])
        if order.get("confirmed_at") and isinstance(order["confirmed_at"], str):
            order["confirmed_at"] = datetime.fromisoformat(order["confirmed_at"])
        if order.get("delivered_at") and isinstance(order["delivered_at"], str):
            order["delivered_at"] = datetime.fromisoformat(order["delivered_at"])
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("updated_at"), str):
            order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    
    return orders

@router.get("/orders/{order_id}")
async def get_order_details(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get order details with items
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await verify_tenant_access(current_user, order["tenant_id"])
    
    # Get order items
    order_items = await db.order_items.find({"order_id": order_id}, {"_id": 0}).to_list(100)
    order["items"] = order_items
    
    # Get customer details
    customer = await db.users.find_one({"id": order["customer_id"]}, {"_id": 0})
    order["customer"] = customer
    
    # Get store details
    store = await db.stores.find_one({"id": order["store_id"]}, {"_id": 0})
    order["store"] = store
    
    # Get delivery details if exists
    delivery = await db.deliveries.find_one({"order_id": order_id}, {"_id": 0})
    if delivery:
        order["delivery"] = delivery
    
    # Convert datetime strings
    if isinstance(order.get("placed_at"), str):
        order["placed_at"] = datetime.fromisoformat(order["placed_at"])
    if order.get("confirmed_at") and isinstance(order["confirmed_at"], str):
        order["confirmed_at"] = datetime.fromisoformat(order["confirmed_at"])
    if order.get("delivered_at") and isinstance(order["delivered_at"], str):
        order["delivered_at"] = datetime.fromisoformat(order["delivered_at"])
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("updated_at"), str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    
    return order

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update order status (confirm, preparing, ready, etc.)
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await verify_tenant_access(current_user, order["tenant_id"])
    
    # Validate status transition
    valid_statuses = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}
    
    # Set timestamps based on status
    if status == "confirmed":
        update_data["confirmed_at"] = datetime.utcnow().isoformat()
    elif status == "delivered":
        update_data["delivered_at"] = datetime.utcnow().isoformat()
        # Credit wallet on delivery
        await credit_vendor_wallet(db, order)
    elif status == "cancelled":
        update_data["cancelled_at"] = datetime.utcnow().isoformat()
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {"success": True, "message": f"Order status updated to {status}"}

async def credit_vendor_wallet(db, order):
    """
    Credit vendor wallet when order is delivered
    """
    # Get wallet
    wallet = await db.wallets.find_one({"tenant_id": order["tenant_id"]})
    if not wallet:
        return
    
    # Calculate vendor payout (already in order)
    payout_amount = order.get("vendor_payout", 0)
    
    if payout_amount > 0:
        new_balance = wallet["balance"] + payout_amount
        
        await db.wallets.update_one(
            {"tenant_id": order["tenant_id"]},
            {"$set": {
                "balance": new_balance,
                "total_earned": wallet["total_earned"] + payout_amount,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        # Create transaction record
        from models.monetization import WalletTransaction
        transaction = WalletTransaction(
            tenant_id=order["tenant_id"],
            wallet_id=wallet["id"],
            transaction_type="credit",
            amount=payout_amount,
            source="order",
            reference_id=order["id"],
            description=f"Order {order['order_number']} completed",
            balance_after=new_balance
        )
        transaction_dict = transaction.model_dump()
        transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
        await db.wallet_transactions.insert_one(transaction_dict)

# ==================== FINANCIAL REPORTS ====================

@router.get("/reports/sales")
async def get_sales_report(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    store_id: str = None,
    start_date: str = None,
    end_date: str = None
):
    """
    Get sales report with admin markup breakdown
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Build query
    query = {"tenant_id": tenant_id, "payment_status": "completed"}
    if store_id:
        query["store_id"] = store_id
    
    # Aggregate pipeline
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total_amount"},
            "total_subtotal": {"$sum": "$subtotal"},
            "total_admin_markup": {"$sum": "$admin_markup_total"},
            "total_delivery_charges": {"$sum": "$delivery_charge"},
            "total_tax": {"$sum": "$tax_amount"},
            "total_discounts": {"$sum": "$discount_amount"},
            "total_commission": {"$sum": "$commission_amount"},
            "total_vendor_payout": {"$sum": "$vendor_payout"}
        }}
    ]
    
    result = await db.orders.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "total_orders": 0,
            "total_revenue": 0,
            "total_subtotal": 0,
            "total_admin_markup": 0,
            "total_delivery_charges": 0,
            "total_tax": 0,
            "total_discounts": 0,
            "total_commission": 0,
            "total_vendor_payout": 0
        }
    
    report = result[0]
    report.pop("_id")
    
    # Round all values
    for key in report:
        if isinstance(report[key], float):
            report[key] = round(report[key], 2)
    
    return report

@router.get("/reports/wallet")
async def get_wallet_report(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get wallet balance and transaction history
    """
    await require_role(current_user, ["tenant_admin", "super_admin"])
    tenant_id = await get_tenant_id(current_user)
    
    if not tenant_id:
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    # Get wallet
    wallet = await db.wallets.find_one({"tenant_id": tenant_id}, {"_id": 0})
    
    if not wallet:
        return {
            "wallet": {"balance": 0, "total_earned": 0, "total_withdrawn": 0},
            "recent_transactions": []
        }
    
    # Get recent transactions
    transactions = await db.wallet_transactions.find(
        {"tenant_id": tenant_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    
    # Convert datetime strings
    for txn in transactions:
        if isinstance(txn.get("created_at"), str):
            txn["created_at"] = datetime.fromisoformat(txn["created_at"])
    
    return {
        "wallet": wallet,
        "recent_transactions": transactions
    }
