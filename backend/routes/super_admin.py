from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.tenant import Tenant, TenantCreate, TenantUpdate, TenantSettings, TenantSettingsUpdate
from models.monetization import (
    SubscriptionPlan, SubscriptionPlanCreate, SubscriptionPlanUpdate,
    TenantSubscription, TenantSubscriptionCreate, TenantSubscriptionUpdate,
    Wallet, WalletTransaction, Payout, PayoutCreate, PayoutUpdate
)
from middleware.auth import get_current_user, require_role
from datetime import datetime
from typing import List
import uuid

router = APIRouter(prefix="/super-admin", tags=["Super Admin"])

def get_db():
    from server import db
    return db

# ==================== TENANT MANAGEMENT ====================

@router.post("/tenants", response_model=Tenant)
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new tenant (Super Admin only)
    """
    await require_role(current_user, ["super_admin"])
    
    # Create tenant
    tenant = Tenant(**tenant_data.model_dump())
    tenant_dict = tenant.model_dump()
    tenant_dict["created_at"] = tenant_dict["created_at"].isoformat()
    tenant_dict["updated_at"] = tenant_dict["updated_at"].isoformat()
    
    await db.tenants.insert_one(tenant_dict)
    
    # Create default tenant settings
    settings = TenantSettings(tenant_id=tenant.id)
    settings_dict = settings.model_dump()
    settings_dict["created_at"] = settings_dict["created_at"].isoformat()
    settings_dict["updated_at"] = settings_dict["updated_at"].isoformat()
    await db.tenant_settings.insert_one(settings_dict)
    
    # Create wallet for tenant
    wallet = Wallet(tenant_id=tenant.id)
    wallet_dict = wallet.model_dump()
    wallet_dict["created_at"] = wallet_dict["created_at"].isoformat()
    wallet_dict["updated_at"] = wallet_dict["updated_at"].isoformat()
    await db.wallets.insert_one(wallet_dict)
    
    return tenant

@router.get("/tenants", response_model=List[Tenant])
async def list_tenants(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: str = None,
    skip: int = 0,
    limit: int = 100
):
    """
    List all tenants with optional status filter
    """
    await require_role(current_user, ["super_admin"])
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    tenants = await db.tenants.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Convert datetime strings
    for tenant in tenants:
        if isinstance(tenant.get("created_at"), str):
            tenant["created_at"] = datetime.fromisoformat(tenant["created_at"])
        if isinstance(tenant.get("updated_at"), str):
            tenant["updated_at"] = datetime.fromisoformat(tenant["updated_at"])
    
    return tenants

@router.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get tenant details
    """
    await require_role(current_user, ["super_admin"])
    
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Convert datetime strings
    if isinstance(tenant.get("created_at"), str):
        tenant["created_at"] = datetime.fromisoformat(tenant["created_at"])
    if isinstance(tenant.get("updated_at"), str):
        tenant["updated_at"] = datetime.fromisoformat(tenant["updated_at"])
    
    return tenant

@router.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant_id: str,
    tenant_data: TenantUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update tenant details
    """
    await require_role(current_user, ["super_admin"])
    
    # Check if tenant exists
    existing = await db.tenants.find_one({"id": tenant_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in tenant_data.model_dump(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow().isoformat()
    
    await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": update_data}
    )
    
    # Get updated tenant
    updated_tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    
    # Convert datetime strings
    if isinstance(updated_tenant.get("created_at"), str):
        updated_tenant["created_at"] = datetime.fromisoformat(updated_tenant["created_at"])
    if isinstance(updated_tenant.get("updated_at"), str):
        updated_tenant["updated_at"] = datetime.fromisoformat(updated_tenant["updated_at"])
    
    return updated_tenant

@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Soft delete tenant
    """
    await require_role(current_user, ["super_admin"])
    
    result = await db.tenants.update_one(
        {"id": tenant_id},
        {"$set": {"status": "inactive", "updated_at": datetime.utcnow().isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    return {"success": True, "message": "Tenant deactivated"}

# ==================== SUBSCRIPTION PLANS ====================

@router.post("/subscription-plans", response_model=SubscriptionPlan)
async def create_subscription_plan(
    plan_data: SubscriptionPlanCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create subscription plan
    """
    await require_role(current_user, ["super_admin"])
    
    plan = SubscriptionPlan(**plan_data.model_dump())
    plan_dict = plan.model_dump()
    plan_dict["created_at"] = plan_dict["created_at"].isoformat()
    
    await db.subscription_plans.insert_one(plan_dict)
    return plan

@router.get("/subscription-plans")
async def list_subscription_plans(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    is_active: bool = None
):
    """
    List all subscription plans
    """
    await require_role(current_user, ["super_admin"])
    
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    plans = await db.subscription_plans.find(query, {"_id": 0}).to_list(100)
    
    for plan in plans:
        if isinstance(plan.get("created_at"), str):
            plan["created_at"] = datetime.fromisoformat(plan["created_at"])
        # Handle field name variations from seeded data
        if "billing_cycle" not in plan:
            plan["billing_cycle"] = "monthly"
        if "price" not in plan:
            plan["price"] = plan.get("monthly_fee", 0)
    
    return plans

@router.put("/subscription-plans/{plan_id}", response_model=SubscriptionPlan)
async def update_subscription_plan(
    plan_id: str,
    plan_data: SubscriptionPlanUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update subscription plan
    """
    await require_role(current_user, ["super_admin"])
    
    update_data = {k: v for k, v in plan_data.model_dump(exclude_unset=True).items()}
    
    result = await db.subscription_plans.update_one(
        {"id": plan_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    updated_plan = await db.subscription_plans.find_one({"id": plan_id}, {"_id": 0})
    
    if isinstance(updated_plan.get("created_at"), str):
        updated_plan["created_at"] = datetime.fromisoformat(updated_plan["created_at"])
    
    return updated_plan

# ==================== TENANT SUBSCRIPTIONS ====================

@router.post("/tenant-subscriptions", response_model=TenantSubscription)
async def assign_subscription_to_tenant(
    subscription_data: TenantSubscriptionCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Assign subscription plan to tenant
    """
    await require_role(current_user, ["super_admin"])
    
    # Check if tenant exists
    tenant = await db.tenants.find_one({"id": subscription_data.tenant_id})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # If plan_id provided, check if plan exists
    if subscription_data.plan_id:
        plan = await db.subscription_plans.find_one({"id": subscription_data.plan_id})
        if not plan:
            raise HTTPException(status_code=404, detail="Subscription plan not found")
    
    subscription = TenantSubscription(**subscription_data.model_dump())
    subscription_dict = subscription.model_dump()
    subscription_dict["start_date"] = subscription_dict["start_date"].isoformat()
    if subscription_dict.get("end_date"):
        subscription_dict["end_date"] = subscription_dict["end_date"].isoformat()
    if subscription_dict.get("next_billing_date"):
        subscription_dict["next_billing_date"] = subscription_dict["next_billing_date"].isoformat()
    subscription_dict["created_at"] = subscription_dict["created_at"].isoformat()
    subscription_dict["updated_at"] = subscription_dict["updated_at"].isoformat()
    
    await db.tenant_subscriptions.insert_one(subscription_dict)
    return subscription

@router.get("/tenant-subscriptions/{tenant_id}", response_model=TenantSubscription)
async def get_tenant_subscription(
    tenant_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get tenant's active subscription
    """
    await require_role(current_user, ["super_admin"])
    
    subscription = await db.tenant_subscriptions.find_one(
        {"tenant_id": tenant_id, "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    # Convert datetime strings
    if isinstance(subscription.get("start_date"), str):
        subscription["start_date"] = datetime.fromisoformat(subscription["start_date"])
    if subscription.get("end_date") and isinstance(subscription["end_date"], str):
        subscription["end_date"] = datetime.fromisoformat(subscription["end_date"])
    if subscription.get("next_billing_date") and isinstance(subscription["next_billing_date"], str):
        subscription["next_billing_date"] = datetime.fromisoformat(subscription["next_billing_date"])
    if isinstance(subscription.get("created_at"), str):
        subscription["created_at"] = datetime.fromisoformat(subscription["created_at"])
    if isinstance(subscription.get("updated_at"), str):
        subscription["updated_at"] = datetime.fromisoformat(subscription["updated_at"])
    
    return subscription

# ==================== ANALYTICS ====================

@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get platform-wide analytics
    """
    await require_role(current_user, ["super_admin"])
    
    # Total tenants
    total_tenants = await db.tenants.count_documents({"status": "active"})
    
    # Total orders
    total_orders = await db.orders.count_documents({})
    
    # Total revenue (sum of commission_amount from all completed orders)
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total_commission": {"$sum": "$commission_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total_commission"] if revenue_result else 0
    
    # GMV (Gross Merchandise Value)
    gmv_pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {"_id": None, "total_gmv": {"$sum": "$total_amount"}}}
    ]
    gmv_result = await db.orders.aggregate(gmv_pipeline).to_list(1)
    total_gmv = gmv_result[0]["total_gmv"] if gmv_result else 0
    
    # Active subscriptions
    active_subscriptions = await db.tenant_subscriptions.count_documents({"status": "active"})
    
    return {
        "total_tenants": total_tenants,
        "total_orders": total_orders,
        "total_platform_revenue": round(total_revenue, 2),
        "total_gmv": round(total_gmv, 2),
        "active_subscriptions": active_subscriptions
    }

@router.get("/analytics/tenants-revenue")
async def get_tenants_revenue(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    limit: int = 10
):
    """
    Get top tenants by revenue
    """
    await require_role(current_user, ["super_admin"])
    
    pipeline = [
        {"$match": {"payment_status": "completed"}},
        {"$group": {
            "_id": "$tenant_id",
            "total_orders": {"$sum": 1},
            "total_revenue": {"$sum": "$total_amount"},
            "total_commission": {"$sum": "$commission_amount"}
        }},
        {"$sort": {"total_revenue": -1}},
        {"$limit": limit}
    ]
    
    results = await db.orders.aggregate(pipeline).to_list(limit)
    
    # Enrich with tenant names
    for result in results:
        tenant = await db.tenants.find_one({"id": result["_id"]}, {"_id": 0, "name": 1})
        result["tenant_name"] = tenant["name"] if tenant else "Unknown"
        result["tenant_id"] = result.pop("_id")
    
    return results

# ==================== PAYOUTS ====================

@router.get("/payouts")
async def list_all_payouts(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    status_filter: str = None,
    skip: int = 0,
    limit: int = 50
):
    """
    List all payout requests across tenants
    """
    await require_role(current_user, ["super_admin"])
    
    query = {}
    if status_filter:
        query["status"] = status_filter
    
    payouts = await db.payouts.find(query, {"_id": 0}).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enrich with tenant names
    for payout in payouts:
        tenant = await db.tenants.find_one({"id": payout["tenant_id"]}, {"_id": 0, "name": 1})
        payout["tenant_name"] = tenant["name"] if tenant else "Unknown"
        
        if isinstance(payout.get("created_at"), str):
            payout["created_at"] = datetime.fromisoformat(payout["created_at"])
        if payout.get("processed_at") and isinstance(payout["processed_at"], str):
            payout["processed_at"] = datetime.fromisoformat(payout["processed_at"])
    
    return payouts

@router.put("/payouts/{payout_id}")
async def process_payout(
    payout_id: str,
    payout_update: PayoutUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Process payout request (approve/reject)
    """
    await require_role(current_user, ["super_admin"])
    
    payout = await db.payouts.find_one({"id": payout_id})
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    update_data = payout_update.model_dump(exclude_unset=True)
    if update_data.get("processed_at"):
        update_data["processed_at"] = update_data["processed_at"].isoformat()
    
    await db.payouts.update_one(
        {"id": payout_id},
        {"$set": update_data}
    )
    
    # If completed, deduct from wallet
    if payout_update.status == "completed":
        wallet = await db.wallets.find_one({"tenant_id": payout["tenant_id"]})
        if wallet:
            new_balance = wallet["balance"] - payout["amount"]
            await db.wallets.update_one(
                {"tenant_id": payout["tenant_id"]},
                {"$set": {
                    "balance": new_balance,
                    "total_withdrawn": wallet["total_withdrawn"] + payout["amount"],
                    "updated_at": datetime.utcnow().isoformat()
                }}
            )
            
            # Create wallet transaction
            transaction = WalletTransaction(
                tenant_id=payout["tenant_id"],
                wallet_id=wallet["id"],
                transaction_type="debit",
                amount=payout["amount"],
                source="payout",
                reference_id=payout_id,
                description=f"Payout processed",
                balance_after=new_balance
            )
            transaction_dict = transaction.model_dump()
            transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
            await db.wallet_transactions.insert_one(transaction_dict)
    
    return {"success": True, "message": "Payout processed"}


# ==================== TENANT ADMIN MANAGEMENT ====================

from pydantic import BaseModel, EmailStr
from utils.helpers import get_password_hash

class TenantAdminCreate(BaseModel):
    tenant_id: str
    name: str
    email: EmailStr
    password: str

@router.post("/tenant-admins")
async def create_tenant_admin(
    admin_data: TenantAdminCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create Tenant Admin with username/password (Super Admin only)
    """
    await require_role(current_user, ["super_admin"])
    
    # Check if tenant exists
    tenant = await db.tenants.find_one({"id": admin_data.tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": admin_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Create tenant admin user
    from models.user import User
    user = User(
        tenant_id=admin_data.tenant_id,
        name=admin_data.name,
        email=admin_data.email,
        phone="",  # Optional for admin users
        role="tenant_admin"
    )
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(admin_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return {
        "success": True,
        "message": "Tenant Admin created successfully",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    }

@router.get("/tenant-admins")
async def list_tenant_admins(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
    tenant_id: str = None
):
    """
    List all tenant admins (Super Admin only)
    """
    await require_role(current_user, ["super_admin"])
    
    query = {"role": "tenant_admin"}
    if tenant_id:
        query["tenant_id"] = tenant_id
    
    admins = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    
    return admins

