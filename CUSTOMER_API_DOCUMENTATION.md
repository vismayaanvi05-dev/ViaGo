# Customer Mobile App - Complete API Documentation

## Base URL
```
Production: https://hyperserve-food-mvp.preview.emergentagent.com/api/customer
Development: http://localhost:8001/api/customer
```

## Authentication
Most endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. APP CONFIGURATION

### GET /config
Get app configuration and available modules based on location

**Query Parameters:**
- `lat` (float, optional): Latitude
- `lng` (float, optional): Longitude

**Response:**
```json
{
  "app_name": "HyperServe",
  "version": "1.0.0",
  "available_modules": ["food", "grocery", "laundry"],
  "theme": {
    "primary_color": "#8B5CF6",
    "secondary_color": "#EC4899"
  }
}
```

---

## 2. STORE DISCOVERY

### GET /stores
Discover stores based on location and module (Module-first architecture)

**Query Parameters:**
- `lat` (float, required): Latitude
- `lng` (float, required): Longitude
- `module` (string, optional): 'food' | 'grocery' | 'laundry'
- `search` (string, optional): Search query
- `skip` (int, optional): Pagination offset (default: 0)
- `limit` (int, optional): Results limit (default: 20)

**Response:**
```json
{
  "stores": [
    {
      "id": "store-uuid",
      "tenant_id": "tenant-uuid",
      "name": "Store Name",
      "store_type": "restaurant",
      "distance_km": 2.5,
      "is_deliverable": true,
      "rating": 4.5,
      "total_reviews": 120,
      "delivery_radius_km": 5.0,
      "minimum_order_value": 200.0,
      "average_prep_time_minutes": 30,
      "cuisine_types": ["Indian", "Chinese"],
      "is_active": true,
      "is_accepting_orders": true
    }
  ],
  "total": 10,
  "module": "food"
}
```

---

## 3. SEARCH

### GET /search
Search across stores and items

**Query Parameters:**
- `q` (string, required): Search query
- `lat` (float, required): Latitude
- `lng` (float, required): Longitude
- `module` (string, optional): Filter by module

**Response:**
```json
{
  "stores": [
    {
      "id": "store-uuid",
      "name": "Pizza Palace",
      "distance_km": 1.2,
      "is_deliverable": true
    }
  ],
  "items": [
    {
      "id": "item-uuid",
      "name": "Margherita Pizza",
      "base_price": 299.0,
      "store_name": "Pizza Palace",
      "store_type": "restaurant"
    }
  ]
}
```

---

## 4. STORE DETAILS

### GET /restaurants/{store_id}
Get food store details with full menu

**Authentication:** Required

**Response:**
```json
{
  "id": "store-uuid",
  "name": "Restaurant Name",
  "categories": [
    {
      "id": "cat-uuid",
      "name": "Pizzas",
      "items": [
        {
          "id": "item-uuid",
          "name": "Margherita Pizza",
          "base_price": 299.0,
          "is_veg": true,
          "variants": [
            {
              "id": "variant-uuid",
              "name": "Medium",
              "price": 299.0
            }
          ],
          "addons": [
            {
              "id": "addon-uuid",
              "name": "Extra Cheese",
              "price": 50.0
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /stores/{store_id}/grocery
Get grocery store with inventory

**Authentication:** Required

**Response:**
```json
{
  "id": "store-uuid",
  "name": "Grocery Store",
  "store_type": "grocery",
  "categories": [
    {
      "id": "cat-uuid",
      "name": "Fruits",
      "items": [
        {
          "id": "item-uuid",
          "name": "Apple",
          "base_price": 150.0,
          "unit_type": "kg",
          "current_stock": 100,
          "in_stock": true
        }
      ]
    }
  ]
}
```

### GET /stores/{store_id}/laundry
Get laundry store with services and pricing

**Authentication:** Required

**Response:**
```json
{
  "id": "store-uuid",
  "name": "Laundry Store",
  "store_type": "laundry",
  "categories": [
    {
      "id": "cat-uuid",
      "name": "Wash & Iron",
      "items": [
        {
          "id": "item-uuid",
          "name": "Shirt",
          "pricing": [
            {
              "service_type": "wash_iron",
              "price": 30.0
            }
          ]
        }
      ]
    }
  ],
  "available_slots": [
    {
      "id": "slot-uuid",
      "slot_type": "pickup",
      "start_time": "09:00",
      "end_time": "12:00"
    }
  ]
}
```

---

## 5. PROFILE MANAGEMENT

### GET /profile
Get customer profile

**Authentication:** Required

**Response:**
```json
{
  "id": "user-uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "profile_photo": "https://...",
  "total_orders": 25
}
```

### PUT /profile
Update customer profile

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "profile_photo": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## 6. CART MANAGEMENT

### POST /cart/add
Add item to cart (One cart = One store rule)

**Authentication:** Required

**Request Body:**
```json
{
  "store_id": "store-uuid",
  "item_id": "item-uuid",
  "quantity": 2,
  "variant_id": "variant-uuid",
  "add_ons": ["addon-id-1", "addon-id-2"]
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": { ... }
}
```

**Conflict Response (Different Store):**
```json
{
  "success": false,
  "error": "cart_conflict",
  "message": "Your cart contains items from another store. Clear cart to continue.",
  "current_store_id": "other-store-uuid"
}
```

### GET /cart
Get current cart

**Authentication:** Required

**Response:**
```json
{
  "cart": {
    "id": "cart-uuid",
    "user_id": "user-uuid",
    "store_id": "store-uuid",
    "module": "food",
    "items": [
      {
        "id": "cart-item-uuid",
        "item_id": "item-uuid",
        "item_name": "Pizza",
        "quantity": 2,
        "unit_price": 299.0,
        "variant_id": "variant-uuid",
        "add_ons": []
      }
    ],
    "applied_coupon": {
      "code": "FIRST50",
      "discount_amount": 50.0
    }
  },
  "store": { ... },
  "subtotal": 598.0,
  "item_count": 1
}
```

### PUT /cart/update
Update cart item quantity

**Authentication:** Required

**Request Body:**
```json
{
  "item_id": "item-uuid",
  "quantity": 3
}
```

### DELETE /cart/remove?item_id={item_id}
Remove item from cart

**Authentication:** Required

### DELETE /cart/clear
Clear entire cart

**Authentication:** Required

---

## 7. COUPONS

### GET /coupons
Get available coupons

**Authentication:** Required

**Query Parameters:**
- `store_id` (string, optional): Filter by store
- `module` (string, optional): Filter by module

**Response:**
```json
[
  {
    "id": "coupon-uuid",
    "code": "FIRST50",
    "description": "Get ₹50 off on first order",
    "discount_type": "flat",
    "discount_value": 50.0,
    "min_order_value": 200.0,
    "valid_from": "2026-01-01T00:00:00",
    "valid_until": "2026-12-31T23:59:59",
    "user_used": false,
    "remaining_uses": 1
  }
]
```

### POST /cart/apply-coupon
Apply coupon to cart

**Authentication:** Required

**Request Body:**
```json
{
  "coupon_code": "FIRST50"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coupon applied successfully",
  "discount": 50.0,
  "cart": { ... }
}
```

---

## 8. ADDRESS MANAGEMENT

### POST /addresses
Create delivery address

**Authentication:** Required

**Request Body:**
```json
{
  "address_type": "home",
  "address_line": "123 Main Street",
  "landmark": "Near Park",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "lat": 12.9716,
  "lng": 77.5946,
  "is_default": true
}
```

### GET /addresses
Get all saved addresses

**Authentication:** Required

### PUT /addresses/{address_id}
Update address

**Authentication:** Required

### DELETE /addresses/{address_id}
Delete address

**Authentication:** Required

---

## 9. ORDERS

### POST /orders
Place new order

**Authentication:** Required

**Request Body:**
```json
{
  "store_id": "store-uuid",
  "delivery_address_id": "address-uuid",
  "items": [
    {
      "item_id": "item-uuid",
      "quantity": 2,
      "variant_id": "variant-uuid",
      "add_ons": ["addon-id"]
    }
  ],
  "payment_method": "cod",
  "delivery_type": "instant",
  "special_instructions": "Ring the bell twice",
  "allow_substitution": false,
  "coupon_code": "FIRST50"
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order-uuid",
  "order_number": "ORD20260404001",
  "total_amount": 548.0,
  "message": "Order placed successfully"
}
```

### GET /orders
Get order history

**Authentication:** Required

**Query Parameters:**
- `skip` (int, optional): Pagination offset
- `limit` (int, optional): Results limit

**Response:**
```json
[
  {
    "id": "order-uuid",
    "order_number": "ORD20260404001",
    "store_name": "Restaurant Name",
    "total_amount": 548.0,
    "status": "delivered",
    "module": "food",
    "placed_at": "2026-04-04T10:00:00",
    "delivered_at": "2026-04-04T11:00:00"
  }
]
```

### GET /orders/{order_id}
Get order tracking details

**Authentication:** Required

**Response:**
```json
{
  "id": "order-uuid",
  "order_number": "ORD20260404001",
  "status": "out_for_delivery",
  "items": [ ... ],
  "delivery": {
    "status": "in_transit",
    "delivery_partner_name": "John",
    "delivery_partner_phone": "9876543210"
  },
  "store": { ... },
  "delivery_address": { ... }
}
```

---

## 10. REVIEWS

### POST /reviews
Submit review for delivered order

**Authentication:** Required

**Request Body:**
```json
{
  "order_id": "order-uuid",
  "food_rating": 4.5,
  "delivery_rating": 5.0,
  "comment": "Great food and fast delivery!",
  "images": ["https://..."]
}
```

---

## Error Responses

All endpoints follow consistent error format:

```json
{
  "detail": "Error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Notes

1. **One Cart Per Store Rule**: If user tries to add items from different store, API returns `cart_conflict` error
2. **Location Required**: Store discovery requires lat/lng for accurate distance calculation
3. **Module-First**: Stores are filtered by module (food/grocery/laundry) for clean UX
4. **Dynamic Branding**: Each store has its own logo, banner, colors (tenant-specific)
5. **Real-time**: Order tracking provides live status updates

---

## Next Steps

Once APIs are tested and working:
1. Build React Native mobile app
2. Implement navigation flow
3. Add state management (Context API / Redux)
4. Integrate payment gateway
5. Add push notifications
