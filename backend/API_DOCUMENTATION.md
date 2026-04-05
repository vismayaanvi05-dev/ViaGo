# 🚀 HyperServe API Documentation

## Base URL
```
Development: http://localhost:8001/api
Production: https://your-domain.com/api
```

---

## 🔐 Authentication

All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### POST /api/auth/send-otp
Send OTP to phone number
```json
{
  "phone": "9876543210",
  "role": "customer"
}
```

### POST /api/auth/verify-otp
Verify OTP and login/register
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "role": "customer",
  "name": "John Doe"  // Required for new users
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {...},
  "tenant": {...}
}
```

### GET /api/auth/me
Get current user info (requires auth)

---

## 👑 Super Admin APIs

**Required Role:** `super_admin`

### Tenant Management
- `POST /api/super-admin/tenants` - Create tenant
- `GET /api/super-admin/tenants` - List tenants
- `GET /api/super-admin/tenants/{tenant_id}` - Get tenant
- `PUT /api/super-admin/tenants/{tenant_id}` - Update tenant
- `DELETE /api/super-admin/tenants/{tenant_id}` - Deactivate tenant

### Subscription Plans
- `POST /api/super-admin/subscription-plans` - Create plan
- `GET /api/super-admin/subscription-plans` - List plans
- `PUT /api/super-admin/subscription-plans/{plan_id}` - Update plan

### Tenant Subscriptions
- `POST /api/super-admin/tenant-subscriptions` - Assign plan to tenant
- `GET /api/super-admin/tenant-subscriptions/{tenant_id}` - Get tenant subscription

### Analytics
- `GET /api/super-admin/analytics/dashboard` - Platform-wide analytics
- `GET /api/super-admin/analytics/tenants-revenue` - Top tenants by revenue

### Payouts
- `GET /api/super-admin/payouts` - List all payouts
- `PUT /api/super-admin/payouts/{payout_id}` - Process payout

---

## 🏪 Tenant Admin APIs

**Required Role:** `tenant_admin`

### Tenant Settings (Delivery, Tax, Markup)
- `GET /api/tenant-admin/settings` - Get settings
- `PUT /api/tenant-admin/settings` - Update settings

**Settings Structure:**
```json
{
  "delivery_charge_type": "flat",  // or "distance_based"
  "flat_delivery_charge": 50,
  "delivery_charge_per_km": 10,
  "free_delivery_above": 500,
  "tax_enabled": true,
  "tax_name": "GST",
  "tax_percentage": 5,
  "default_admin_markup_percentage": 10,
  "minimum_order_value": 100
}
```

### Store Management
- `POST /api/tenant-admin/stores` - Create store/restaurant
- `GET /api/tenant-admin/stores` - List stores
- `GET /api/tenant-admin/stores/{store_id}` - Get store
- `PUT /api/tenant-admin/stores/{store_id}` - Update store
- `DELETE /api/tenant-admin/stores/{store_id}` - Delete store

### Category Management
- `POST /api/tenant-admin/categories` - Create category
- `GET /api/tenant-admin/categories?store_id=...&module=food` - List categories
- `PUT /api/tenant-admin/categories/{category_id}` - Update category
- `DELETE /api/tenant-admin/categories/{category_id}` - Delete category

### Item/Menu Management
- `POST /api/tenant-admin/items` - Create item
- `GET /api/tenant-admin/items?store_id=...&module=food` - List items
- `GET /api/tenant-admin/items/{item_id}` - Get item
- `PUT /api/tenant-admin/items/{item_id}` - Update item (includes markup)
- `DELETE /api/tenant-admin/items/{item_id}` - Delete item

**Item with Admin Markup:**
```json
{
  "name": "Margherita Pizza",
  "base_price": 200,
  "admin_markup_percentage": 10,  // Overrides default
  "category_id": "...",
  "store_id": "...",
  "module": "food",
  "is_veg": true
}
```

### Variants & Add-ons
- `POST /api/tenant-admin/variants` - Create variant
- `GET /api/tenant-admin/variants?item_id=...` - List variants
- `PUT /api/tenant-admin/variants/{variant_id}` - Update variant
- `DELETE /api/tenant-admin/variants/{variant_id}` - Delete variant

- `POST /api/tenant-admin/addons` - Create add-on
- `GET /api/tenant-admin/addons?item_id=...` - List add-ons
- `PUT /api/tenant-admin/addons/{addon_id}` - Update add-on
- `DELETE /api/tenant-admin/addons/{addon_id}` - Delete add-on

### Order Management
- `GET /api/tenant-admin/orders?store_id=...&status=...` - List orders
- `GET /api/tenant-admin/orders/{order_id}` - Get order details
- `PUT /api/tenant-admin/orders/{order_id}/status` - Update order status
  - Statuses: `confirmed`, `preparing`, `ready`, `cancelled`

### Reports
- `GET /api/tenant-admin/reports/sales` - Sales report with markup breakdown
- `GET /api/tenant-admin/reports/wallet` - Wallet balance & transactions

**Sales Report Response:**
```json
{
  "total_orders": 150,
  "total_revenue": 50000,
  "total_subtotal": 45000,
  "total_admin_markup": 3000,
  "total_delivery_charges": 1500,
  "total_tax": 2250,
  "total_commission": 5000,
  "total_vendor_payout": 45000
}
```

---

## 🛒 Customer APIs

**Required Role:** `customer`

### Address Management
- `POST /api/customer/addresses` - Create address
- `GET /api/customer/addresses` - List addresses
- `PUT /api/customer/addresses/{address_id}` - Update address
- `DELETE /api/customer/addresses/{address_id}` - Delete address

### Browse Restaurants
- `GET /api/customer/restaurants?lat=...&lng=...&cuisine_type=...&search=...`
- `GET /api/customer/restaurants/{store_id}` - Get restaurant with full menu

**Restaurant Response includes:**
- Store details
- Categories with items
- Items with variants and add-ons
- Distance calculation (if lat/lng provided)

### Order Placement
- `POST /api/customer/orders` - Place order

**Order Request:**
```json
{
  "store_id": "...",
  "delivery_address_id": "...",
  "items": [
    {
      "item_id": "...",
      "variant_id": "...",
      "quantity": 2,
      "add_ons": ["addon_id_1", "addon_id_2"]
    }
  ],
  "payment_method": "upi",
  "delivery_type": "instant",
  "special_instructions": "Extra spicy",
  "allow_substitution": false
}
```

**Order Response:**
```json
{
  "success": true,
  "order_id": "...",
  "order_number": "ORD20250815001",
  "total_amount": 450,
  "message": "Order placed successfully"
}
```

### Order Tracking
- `GET /api/customer/orders` - Get order history
- `GET /api/customer/orders/{order_id}` - Get order tracking details

### Reviews
- `POST /api/customer/reviews` - Submit review for completed order
```json
{
  "order_id": "...",
  "food_rating": 4.5,
  "delivery_rating": 5,
  "comment": "Great food!",
  "images": ["url1", "url2"]
}
```

---

## 🚚 Delivery Partner APIs

**Required Role:** `delivery`

### Available Orders
- `GET /api/delivery/available-orders?lat=...&lng=...` - Get unassigned deliveries

### My Deliveries
- `GET /api/delivery/my-deliveries?status=...` - Get assigned deliveries

### Accept & Update
- `POST /api/delivery/accept/{delivery_id}` - Accept delivery
- `PUT /api/delivery/status/{delivery_id}?status=picked_up` - Update status
  - Statuses: `picked_up`, `in_transit`, `delivered`, `failed`

### Earnings
- `GET /api/delivery/earnings` - Get earnings summary

**Earnings Response:**
```json
{
  "total_deliveries": 50,
  "total_earnings": 2500,
  "today_deliveries": 5,
  "today_earnings": 250,
  "earning_per_delivery": 50
}
```

---

## 📊 Order Amount Breakdown

Every order includes detailed breakdown:
```json
{
  "subtotal": 400,              // Sum of item prices
  "admin_markup_total": 40,     // Total admin profit margin
  "delivery_charge": 50,        // From tenant settings
  "tax_amount": 20,             // Calculated tax
  "discount_amount": 10,        // Coupon discount
  "total_amount": 500,
  
  "commission_percentage": 10,
  "commission_amount": 50,      // Platform revenue
  "vendor_payout": 450          // Tenant receives
}
```

---

## 🎯 Order Status Flow

### Food Order:
1. `placed` → Customer places order
2. `confirmed` → Restaurant confirms
3. `preparing` → Food being prepared
4. `ready` → Ready for pickup
5. `out_for_delivery` → Delivery partner picked up
6. `delivered` → Order completed
7. `cancelled` → Order cancelled

---

## 🔑 User Roles

1. **super_admin** - Platform owner (full access)
2. **tenant_admin** - Business owner (tenant-scoped access)
3. **vendor** - Store staff (branch-level access)
4. **delivery** - Delivery partner
5. **customer** - End consumer
6. **staff** - Store staff (pickers, laundry processors)

---

## 💡 Key Features

✅ **Multi-tenant isolation** - Every query filtered by tenant_id
✅ **Admin markup tracking** - Per-item profit margins
✅ **Flexible pricing** - Delivery charge & tax configurable
✅ **Commission system** - Automatic calculation & wallet credits
✅ **Wallet system** - Track earnings & payouts
✅ **Distance-based delivery** - Calculate delivery charges by distance
✅ **Real-time order tracking** - Status updates through workflow

---

## 🚀 Quick Start Guide

### 1. Create Super Admin
```bash
# Use OTP flow with role="super_admin"
POST /api/auth/send-otp
POST /api/auth/verify-otp
```

### 2. Create Tenant
```bash
POST /api/super-admin/tenants
```

### 3. Assign Subscription
```bash
POST /api/super-admin/tenant-subscriptions
```

### 4. Configure Tenant Settings
```bash
PUT /api/tenant-admin/settings
```

### 5. Create Store & Menu
```bash
POST /api/tenant-admin/stores
POST /api/tenant-admin/categories
POST /api/tenant-admin/items
```

### 6. Customers Can Order!
```bash
GET /api/customer/restaurants
POST /api/customer/orders
```

---

## 📝 Notes

- All datetime fields are in ISO 8601 format
- All amounts are in currency units (INR by default)
- Phone numbers are primary identifiers (unique per role)
- UUIDs used for all IDs (better for distributed systems)
- MongoDB collections automatically created on first insert

---

**API Version:** 1.0.0
**Last Updated:** August 2025
