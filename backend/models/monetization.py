from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

# ==================== SUBSCRIPTION MODELS ====================

class SubscriptionPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    billing_cycle: str  # 'monthly', 'quarterly', 'yearly'
    price: float
    trial_days: int = 0
    grace_period_days: int = 0
    features: List[str] = []
    max_orders_per_month: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionPlanCreate(BaseModel):
    name: str
    billing_cycle: str
    price: float
    trial_days: int = 0
    grace_period_days: int = 0
    features: List[str] = []
    max_orders_per_month: Optional[int] = None

class SubscriptionPlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    trial_days: Optional[int] = None
    grace_period_days: Optional[int] = None
    features: Optional[List[str]] = None
    max_orders_per_month: Optional[int] = None
    is_active: Optional[bool] = None

# ==================== TENANT SUBSCRIPTION ====================

class TenantSubscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    plan_id: Optional[str] = None  # None if commission_only
    pricing_model: str  # 'subscription', 'commission', 'hybrid'
    
    # Commission Settings (category-level for future)
    commission_type: str = "percentage"  # 'percentage' or 'flat'
    commission_percentage: float = 0.0
    commission_flat_fee: float = 0.0
    
    # Module-specific commission (future extension)
    food_commission: Optional[float] = None
    grocery_commission: Optional[float] = None
    laundry_commission: Optional[float] = None
    
    # Subscription dates
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    next_billing_date: Optional[datetime] = None
    
    status: str = "active"  # 'active', 'trial', 'expired', 'cancelled'
    auto_renew: bool = True
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TenantSubscriptionCreate(BaseModel):
    tenant_id: str
    plan_id: Optional[str] = None
    pricing_model: str
    commission_type: str = "percentage"
    commission_percentage: float = 0.0
    commission_flat_fee: float = 0.0
    auto_renew: bool = True

class TenantSubscriptionUpdate(BaseModel):
    plan_id: Optional[str] = None
    pricing_model: Optional[str] = None
    commission_percentage: Optional[float] = None
    commission_flat_fee: Optional[float] = None
    status: Optional[str] = None
    auto_renew: Optional[bool] = None

# ==================== WALLET MODELS ====================

class Wallet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    balance: float = 0.0
    total_earned: float = 0.0
    total_withdrawn: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WalletTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    wallet_id: str
    transaction_type: str  # 'credit', 'debit'
    amount: float
    source: str  # 'order', 'payout', 'refund', 'commission', 'subscription'
    reference_id: Optional[str] = None  # order_id or payout_id
    description: Optional[str] = None
    balance_after: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WalletTransactionCreate(BaseModel):
    tenant_id: str
    wallet_id: str
    transaction_type: str
    amount: float
    source: str
    reference_id: Optional[str] = None
    description: Optional[str] = None

# ==================== PAYOUT MODELS ====================

class Payout(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    amount: float
    status: str = "pending"  # 'pending', 'processing', 'completed', 'failed'
    payout_method: str = "bank_transfer"  # 'bank_transfer', 'upi'
    bank_details: Optional[dict] = None
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PayoutCreate(BaseModel):
    tenant_id: str
    amount: float
    payout_method: str = "bank_transfer"
    bank_details: Optional[dict] = None
    notes: Optional[str] = None

class PayoutUpdate(BaseModel):
    status: str
    processed_at: Optional[datetime] = None
    notes: Optional[str] = None
