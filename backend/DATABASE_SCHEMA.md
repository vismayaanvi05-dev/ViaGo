# HyperServe SaaS Platform - Database Schema Documentation

## 📊 Complete Database Schema (All Modules)

This document outlines the comprehensive database design for all modules: **Food, Grocery, and Laundry**

---

## 🏗️ CORE COLLECTIONS

### 1. **tenants**
Multi-tenant foundation - each business using the platform
```
{
  id: UUID,
  name: String,
  business_type: 'single_vendor' | 'multi_vendor',
  active_modules: ['food', 'grocery', 'laundry'],
  logo_url: String?,
  domain: String?,
  status: 'active' | 'inactive',
  created_at: DateTime,
  updated_at: DateTime
}
```

### 2. **tenant_settings** ⭐ NEW
Controls for delivery charge, tax, admin markup
```
{
  id: UUID,
  tenant_id: UUID,
  
  // Delivery Charge Settings
  delivery_charge_type: 'flat' | 'distance_based',
  flat_delivery_charge: Float,
  delivery_charge_per_km: Float,
  free_delivery_above: Float?,
  
  // Tax Settings
  tax_enabled: Boolean,
  tax_name: 'GST' | 'VAT' | 'Sales Tax',
  tax_percentage: Float,
  
  // Admin Markup (Profit Margin)
  default_admin_markup_percentage: Float,
  
  currency: String,
  minimum_order_value: Float,
  created_at: DateTime,
  updated_at: DateTime
}
```

### 3. **users**
All users across roles
```
{
  id: UUID,
  tenant_id: UUID?,  // null for super_admin
  name: String,
  phone: String,  // Primary identifier
  email: String?,
  role: 'super_admin' | 'tenant_admin' | 'vendor' | 'delivery' | 'customer' | 'staff',
  profile_photo: String?,
  status: 'active' | 'inactive',
  is_deleted: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### 4. **addresses**
User addresses for delivery
```
{
  id: UUID,
  user_id: UUID,
  tenant_id: UUID?,
  address_type: 'home' | 'work' | 'other',
  address_line: String,
  landmark: String?,
  city: String,
  state: String,
  pincode: String,
  lat: Float?,
  lng: Float?,
  is_default: Boolean,
  created_at: DateTime
}
```

---

## 💰 MONETIZATION COLLECTIONS

### 5. **subscription_plans**
Platform pricing plans
```
{
  id: UUID,
  name: String,
  billing_cycle: 'monthly' | 'quarterly' | 'yearly',
  price: Float,
  trial_days: Int,
  grace_period_days: Int,
  features: [String],
  max_orders_per_month: Int?,
  is_active: Boolean,
  created_at: DateTime
}
```

### 6. **tenant_subscriptions**
Tenant's active subscription and commission settings
```
{
  id: UUID,
  tenant_id: UUID,
  plan_id: UUID?,
  pricing_model: 'subscription' | 'commission' | 'hybrid',
  commission_type: 'percentage' | 'flat',
  commission_percentage: Float,
  commission_flat_fee: Float,
  food_commission: Float?,
  grocery_commission: Float?,
  laundry_commission: Float?,
  start_date: DateTime,
  end_date: DateTime?,
  next_billing_date: DateTime?,
  status: 'active' | 'trial' | 'expired' | 'cancelled',
  auto_renew: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### 7. **wallets**
Tenant earnings wallet
```
{
  id: UUID,
  tenant_id: UUID,
  balance: Float,
  total_earned: Float,
  total_withdrawn: Float,
  created_at: DateTime,
  updated_at: DateTime
}
```

### 8. **wallet_transactions**
Ledger of all wallet transactions
```
{
  id: UUID,
  tenant_id: UUID,
  wallet_id: UUID,
  transaction_type: 'credit' | 'debit',
  amount: Float,
  source: 'order' | 'payout' | 'refund' | 'commission' | 'subscription',
  reference_id: UUID?,  // order_id or payout_id
  description: String?,
  balance_after: Float,
  created_at: DateTime
}
```

### 9. **payouts**
Withdrawal requests
```
{
  id: UUID,
  tenant_id: UUID,
  amount: Float,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  payout_method: 'bank_transfer' | 'upi',
  bank_details: Object?,
  processed_at: DateTime?,
  notes: String?,
  created_at: DateTime
}
```

---

## 🏪 STORE & CATALOG COLLECTIONS

### 10. **stores**
Physical stores/restaurants/laundries
```
{
  id: UUID,
  tenant_id: UUID,
  name: String,
  store_type: 'restaurant' | 'grocery' | 'laundry',
  description: String?,
  logo_url: String?,
  banner_url: String?,
  address_line: String,
  city: String,
  state: String,
  pincode: String,
  lat: Float?,
  lng: Float?,
  phone: String?,
  email: String?,
  delivery_radius_km: Float,
  minimum_order_value: Float,
  average_prep_time_minutes: Int,
  cuisine_types: [String],  // For food
  opening_time: String?,
  closing_time: String?,
  is_active: Boolean,
  is_accepting_orders: Boolean,
  is_deleted: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### 11. **categories**
Menu/product categories
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID?,
  module: 'food' | 'grocery' | 'laundry',
  name: String,
  description: String?,
  image_url: String?,
  parent_id: UUID?,  // For subcategories
  sort_order: Int,
  is_active: Boolean,
  created_at: DateTime
}
```

### 12. **items** ⭐ UNIFIED
Products/Services across all modules
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID,
  category_id: UUID,
  module: 'food' | 'grocery' | 'laundry',
  name: String,
  description: String?,
  images: [String],
  base_price: Float,
  mrp: Float?,  // For grocery
  pricing_type: 'fixed' | 'weight_based' | 'per_item',
  
  // Food-specific
  is_veg: Boolean?,
  cuisine_type: String?,
  
  // Grocery-specific
  unit_type: 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'packet'?,
  brand: String?,
  
  // Laundry-specific
  service_type: 'wash_fold' | 'wash_iron' | 'dry_clean' | 'iron_only'?,
  turnaround_hours: Int?,
  
  // Admin Markup ⭐ NEW
  admin_markup_percentage: Float?,  // Override default
  admin_markup_amount: Float?,  // Calculated
  
  tags: [String],
  is_featured: Boolean,
  is_available: Boolean,
  track_inventory: Boolean,
  created_at: DateTime,
  updated_at: DateTime,
  is_deleted: Boolean
}
```

### 13. **item_variants**
Size/weight variations
```
{
  id: UUID,
  item_id: UUID,
  tenant_id: UUID,
  name: String,  // 'Small', '500g', '1kg'
  price: Float,
  weight: Float?,
  unit: String?,
  stock_quantity: Int?,
  sku: String?,
  is_available: Boolean,
  created_at: DateTime
}
```

### 14. **add_ons**
Extra options (food) or services (laundry)
```
{
  id: UUID,
  item_id: UUID,
  tenant_id: UUID,
  name: String,
  price: Float,
  is_available: Boolean,
  created_at: DateTime
}
```

---

## 📦 INVENTORY (GROCERY)

### 15. **inventory**
Real-time stock tracking
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID,
  item_id: UUID,
  variant_id: UUID?,
  stock_quantity: Int,
  low_stock_threshold: Int,
  unit: String,
  last_restocked_at: DateTime?,
  updated_at: DateTime
}
```

---

## 📅 SCHEDULING (GROCERY & LAUNDRY)

### 16. **delivery_slots**
Time slot management
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID,
  slot_type: 'delivery' | 'pickup',
  date: String,  // "2025-08-15"
  start_time: String,  // "08:00"
  end_time: String,  // "10:00"
  capacity: Int,
  booked_count: Int,
  is_available: Boolean,
  created_at: DateTime
}
```

---

## 🛒 ORDER COLLECTIONS

### 17. **orders** ⭐ WITH ADMIN MARKUP
Main order records
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID,
  customer_id: UUID,
  module: 'food' | 'grocery' | 'laundry',
  order_number: String,  // "ORD20250815001"
  
  delivery_address_id: UUID,
  delivery_address: Object,  // Snapshot
  
  // Amount Breakdown ⭐ NEW
  subtotal: Float,
  admin_markup_total: Float,  // Total admin profit
  delivery_charge: Float,
  tax_amount: Float,
  discount_amount: Float,
  total_amount: Float,
  
  // Platform Revenue
  commission_percentage: Float,
  commission_amount: Float,
  vendor_payout: Float,
  
  payment_method: 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet',
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded',
  payment_id: String?,
  
  delivery_type: 'instant' | 'scheduled',
  scheduled_delivery_slot_id: UUID?,
  estimated_delivery_time: DateTime?,
  
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled',
  
  coupon_code: String?,
  special_instructions: String?,
  allow_substitution: Boolean,
  
  placed_at: DateTime,
  confirmed_at: DateTime?,
  delivered_at: DateTime?,
  cancelled_at: DateTime?,
  cancellation_reason: String?,
  
  created_at: DateTime,
  updated_at: DateTime
}
```

### 18. **order_items**
Line items in order
```
{
  id: UUID,
  order_id: UUID,
  tenant_id: UUID,
  item_id: UUID,
  item_name: String,
  variant_id: UUID?,
  variant_name: String?,
  quantity: Int,
  unit_price: Float,
  admin_markup_per_item: Float,  ⭐ NEW
  total_price: Float,
  add_ons: [Object],
  add_ons_total: Float,
  is_substituted: Boolean,
  substituted_item_id: UUID?,
  substitution_reason: String?,
  item_status: 'pending' | 'picked' | 'unavailable' | 'substituted',
  created_at: DateTime
}
```

### 19. **deliveries**
Delivery tracking
```
{
  id: UUID,
  tenant_id: UUID,
  order_id: UUID,
  delivery_partner_id: UUID?,
  delivery_type: 'platform' | 'self',
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed',
  assigned_at: DateTime?,
  picked_up_at: DateTime?,
  delivered_at: DateTime?,
  delivery_partner_name: String?,
  delivery_partner_phone: String?,
  delivery_otp: String?,
  delivery_proof_image: String?,
  customer_signature: String?,
  failure_reason: String?,
  retry_count: Int,
  created_at: DateTime,
  updated_at: DateTime
}
```

---

## 🎟️ COUPONS & PROMOTIONS

### 20. **coupons**
Discount coupons
```
{
  id: UUID,
  tenant_id: UUID,
  store_id: UUID?,
  code: String,
  description: String,
  discount_type: 'flat' | 'percentage',
  discount_value: Float,
  max_discount: Float?,
  min_order_value: Float,
  usage_limit_per_user: Int,
  total_usage_limit: Int?,
  current_usage_count: Int,
  applicable_modules: [String],
  valid_from: DateTime,
  valid_until: DateTime,
  is_active: Boolean,
  created_at: DateTime
}
```

---

## 🔄 SUBSTITUTION (GROCERY)

### 21. **substitutions**
Item replacements
```
{
  id: UUID,
  tenant_id: UUID,
  order_id: UUID,
  order_item_id: UUID,
  original_item_id: UUID,
  replacement_item_id: UUID,
  reason: 'out_of_stock' | 'quality_issue',
  status: 'suggested' | 'accepted' | 'rejected',
  created_at: DateTime
}
```

---

## 🧺 LAUNDRY-SPECIFIC

### 22. **laundry_service_details**
Service-specific details
```
{
  id: UUID,
  tenant_id: UUID,
  item_id: UUID,
  service_type: String,
  turnaround_hours: Int,
  pricing_model: 'per_item' | 'per_kg',
  price_per_item: Float?,
  price_per_kg: Float?,
  created_at: DateTime
}
```

### 23. **laundry_order_details**
Extended laundry order info
```
{
  id: UUID,
  order_id: UUID,
  tenant_id: UUID,
  pickup_slot_id: UUID?,
  delivery_slot_id: UUID?,
  estimated_weight_kg: Float?,
  actual_weight_kg: Float?,
  final_price: Float?,
  special_instructions: String?,
  created_at: DateTime
}
```

---

## ⭐ REVIEWS & RATINGS

### 24. **reviews**
Customer feedback
```
{
  id: UUID,
  tenant_id: UUID,
  order_id: UUID,
  customer_id: UUID,
  store_id: UUID,
  food_rating: Float?,
  delivery_rating: Float?,
  overall_rating: Float,
  comment: String?,
  images: [String],
  is_verified: Boolean,
  created_at: DateTime
}
```

---

## 📊 INDEXES (Performance Optimization)

```javascript
// Critical indexes for performance
db.users.createIndex({ phone: 1, role: 1 })
db.users.createIndex({ tenant_id: 1 })
db.stores.createIndex({ tenant_id: 1 })
db.items.createIndex({ tenant_id: 1, store_id: 1, module: 1 })
db.orders.createIndex({ tenant_id: 1, customer_id: 1 })
db.orders.createIndex({ store_id: 1, status: 1 })
db.orders.createIndex({ order_number: 1 })
db.inventory.createIndex({ tenant_id: 1, store_id: 1, item_id: 1 })
db.wallet_transactions.createIndex({ tenant_id: 1, created_at: -1 })
```

---

## 🎯 KEY DESIGN FEATURES

✅ **Multi-Tenant Ready**: Every collection has `tenant_id` for strict data isolation
✅ **Unified Schema**: Single `items` table for all modules (food/grocery/laundry)
✅ **Admin Controls**: Delivery charge, tax, item-level markup configurable
✅ **Commission System**: Flexible percentage/flat fee per order
✅ **Module Extensible**: Easy to add meat/cosmetics/home services
✅ **UUID Primary Keys**: Better for distributed SaaS architecture
✅ **Soft Deletes**: `is_deleted` flag for data retention

---

## 📈 FUTURE EXTENSIONS

When adding new modules (Meat, Home Cleaning, Cosmetics):
1. Add new `module` value to items
2. Create module-specific extension tables (like laundry_service_details)
3. No changes needed to core collections
4. Commission rules extend via tenant_subscriptions

---

**Total Collections: 24**
**Ready for:** Food ✅ | Grocery ✅ | Laundry ✅ | Future Modules ✅
