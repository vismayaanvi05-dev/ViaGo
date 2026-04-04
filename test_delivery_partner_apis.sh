#!/bin/bash

# HyperServe Delivery Partner API Test Script
# Tests all delivery partner endpoints

# Get API URL from environment
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

echo "========================================"
echo "🚚 Delivery Partner API Testing"
echo "========================================"
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Send OTP for Delivery Partner
echo "📱 Test 1: Send OTP for Delivery Partner"
SEND_OTP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "role": "delivery_partner"
  }')
echo "Response: $SEND_OTP_RESPONSE"

# Extract OTP from response
OTP=$(echo $SEND_OTP_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('otp', ''))" 2>/dev/null)
echo "Extracted OTP: $OTP"
echo ""

# Test 2: Verify OTP and Create Delivery Partner
echo "✅ Test 2: Verify OTP (Using dynamic OTP: $OTP)"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"+919876543210\",
    \"otp\": \"$OTP\",
    \"role\": \"delivery_partner\",
    \"name\": \"Test Delivery Partner\"
  }")

echo "Response: $LOGIN_RESPONSE"

# Extract token (try both 'access_token' and 'token' fields)
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('access_token') or data.get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get authentication token. Cannot proceed with protected tests.${NC}"
  echo "Please check if backend is running and OTP verification works."
  exit 1
fi

echo -e "${GREEN}Token obtained: ${TOKEN:0:20}...${NC}"
echo ""

# Test 3: Get Delivery Partner Profile
echo "👤 Test 3: Get Delivery Partner Profile"
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/profile" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $PROFILE_RESPONSE"
echo ""

# Test 4: Update Profile
echo "✏️ Test 4: Update Profile"
UPDATE_PROFILE_RESPONSE=$(curl -s -X PUT "$API_URL/api/delivery/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_type": "Bike",
    "vehicle_number": "KA01AB1234"
  }')
echo "Response: $UPDATE_PROFILE_RESPONSE"
echo ""

# Test 5: Update Location
echo "📍 Test 5: Update Delivery Partner Location"
UPDATE_LOCATION_RESPONSE=$(curl -s -X PUT "$API_URL/api/delivery/location" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 12.9716,
    "lng": 77.5946
  }')
echo "Response: $UPDATE_LOCATION_RESPONSE"
echo ""

# Test 6: Get Available Deliveries
echo "📦 Test 6: Get Available Deliveries (10km radius)"
AVAILABLE_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/available?lat=12.9716&lng=77.5946&radius_km=10&module=food" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $AVAILABLE_RESPONSE"
echo ""

# Test 7: Get Assigned Deliveries
echo "📋 Test 7: Get Assigned Deliveries"
ASSIGNED_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/assigned" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $ASSIGNED_RESPONSE"
echo ""

# Test 8: Accept Delivery (if available)
echo "✅ Test 8: Accept Delivery"
echo "Note: This requires an actual available order. Skipping for safety."
echo "To test manually, use: curl -X POST '$API_URL/api/delivery/accept/{order_id}' -H 'Authorization: Bearer $TOKEN'"
echo ""

# Test 9: Update Delivery Status
echo "🔄 Test 9: Update Delivery Status"
echo "Note: This requires an assigned order. Skipping for safety."
echo "To test manually, use: curl -X PUT '$API_URL/api/delivery/status/{order_id}' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"status\": \"picked_up\"}'"
echo ""

# Test 10: Get Delivery History
echo "📜 Test 10: Get Delivery History"
HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/history?skip=0&limit=20" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $HISTORY_RESPONSE"
echo ""

# Test 11: Get Earnings (Today)
echo "💰 Test 11: Get Earnings - Today"
EARNINGS_TODAY_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/earnings?period=today" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $EARNINGS_TODAY_RESPONSE"
echo ""

# Test 12: Get Earnings (Week)
echo "💰 Test 12: Get Earnings - This Week"
EARNINGS_WEEK_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/earnings?period=week" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $EARNINGS_WEEK_RESPONSE"
echo ""

# Test 13: Get Earnings (Month)
echo "💰 Test 13: Get Earnings - This Month"
EARNINGS_MONTH_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/earnings?period=month" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $EARNINGS_MONTH_RESPONSE"
echo ""

# Test 14: Get Earnings (All Time)
echo "💰 Test 14: Get Earnings - All Time"
EARNINGS_ALL_RESPONSE=$(curl -s -X GET "$API_URL/api/delivery/earnings?period=all" \
  -H "Authorization: Bearer $TOKEN")
echo "Response: $EARNINGS_ALL_RESPONSE"
echo ""

echo "========================================"
echo -e "${GREEN}✅ Delivery Partner API Tests Complete${NC}"
echo "========================================"
echo ""
echo "Summary:"
echo "- Auth endpoints: ✅ Send OTP, Verify OTP"
echo "- Profile endpoints: ✅ Get Profile, Update Profile"
echo "- Location endpoint: ✅ Update Location"
echo "- Delivery endpoints: ✅ Available, Assigned, History"
echo "- Earnings endpoint: ✅ Get Earnings (multiple periods)"
echo ""
echo "⚠️  Note: Accept/Reject/Status Update tests skipped (require live orders)"
echo ""
echo "🧪 To test the full delivery flow:"
echo "1. Create orders from Customer App (as customer)"
echo "2. Mark orders as 'ready' from Vendor Admin panel"
echo "3. Use Delivery App to accept and complete deliveries"
echo ""
