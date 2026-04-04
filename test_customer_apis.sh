#!/bin/bash

# Customer API Testing Script
# Tests all customer endpoints

API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

echo "🧪 Testing Customer APIs"
echo "API URL: $API_URL"
echo "=========================================="

# Test 1: App Config (No Auth Required)
echo ""
echo "📱 Test 1: GET /api/customer/config"
curl -s -X GET "$API_URL/api/customer/config?lat=12.9716&lng=77.5946" | python3 -m json.tool | head -20

# Test 2: Store Discovery (No Auth - but let's test structure)
echo ""
echo "🏪 Test 2: GET /api/customer/stores (Food Module)"
curl -s -X GET "$API_URL/api/customer/stores?lat=12.9716&lng=77.5946&module=food&limit=3" | python3 -m json.tool | head -30

# Test 3: Store Discovery (Grocery)
echo ""
echo "🛒 Test 3: GET /api/customer/stores (Grocery Module)"
curl -s -X GET "$API_URL/api/customer/stores?lat=12.9716&lng=77.5946&module=grocery&limit=2" | python3 -m json.tool | head -25

# Test 4: Store Discovery (Laundry)
echo ""
echo "🧺 Test 4: GET /api/customer/stores (Laundry Module)"
curl -s -X GET "$API_URL/api/customer/stores?lat=12.9716&lng=77.5946&module=laundry&limit=2" | python3 -m json.tool | head -25

# Test 5: Search
echo ""
echo "🔍 Test 5: GET /api/customer/search"
curl -s -X GET "$API_URL/api/customer/search?q=pizza&lat=12.9716&lng=77.5946" | python3 -m json.tool | head -20

echo ""
echo "✅ Basic (No-Auth) Tests Complete!"
echo ""
echo "🔐 For authenticated tests (Cart, Profile, Orders), please:"
echo "1. Create a customer account via OTP"
echo "2. Use the token to test protected endpoints"
echo ""
echo "Available authenticated endpoints:"
echo "  - GET /api/customer/profile"
echo "  - PUT /api/customer/profile"
echo "  - POST /api/customer/cart/add"
echo "  - GET /api/customer/cart"
echo "  - PUT /api/customer/cart/update"
echo "  - DELETE /api/customer/cart/remove"
echo "  - DELETE /api/customer/cart/clear"
echo "  - GET /api/customer/coupons"
echo "  - POST /api/customer/cart/apply-coupon"
echo "  - POST /api/customer/orders"
echo "  - GET /api/customer/orders"
echo "  - GET /api/customer/orders/{order_id}"
echo ""
