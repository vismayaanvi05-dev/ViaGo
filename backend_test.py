#!/usr/bin/env python3
"""
ViaGo Backend API Testing Script
Tests all customer and delivery partner flows
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"
CUSTOMER_EMAIL = "customer@test.com"
DELIVERY_EMAIL = "delivery@test.com"

# Global variables to store tokens and IDs
customer_token = None
delivery_token = None
store_id = None
item_id = None
address_id = None
order_id = None

def print_test_result(test_name, success, details=""):
    """Print formatted test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")
    print()

def make_request(method, endpoint, data=None, headers=None, params=None):
    """Make HTTP request with error handling"""
    url = f"{BASE_URL}{endpoint}"
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, params=params, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, params=params, timeout=30)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_health_check():
    """Test 1: Health Check"""
    print("🔍 Testing Health Check...")
    
    response = make_request("GET", "/health")
    if response and response.status_code == 200:
        data = response.json()
        if data.get("status") == "healthy":
            print_test_result("Health Check", True, f"Status: {data.get('status')}, Database: {data.get('database')}")
            return True
        else:
            print_test_result("Health Check", False, f"Unexpected response: {data}")
            return False
    else:
        print_test_result("Health Check", False, f"HTTP {response.status_code if response else 'No response'}")
        return False

def test_customer_auth():
    """Test 2: Customer Authentication Flow"""
    global customer_token
    print("🔍 Testing Customer Authentication...")
    
    # Step 1: Send OTP
    otp_data = {
        "email": CUSTOMER_EMAIL,
        "role": "customer"
    }
    
    response = make_request("POST", "/auth/send-otp", otp_data)
    if not response or response.status_code != 200:
        print_test_result("Customer Send OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    otp_response = response.json()
    if not otp_response.get("success"):
        print_test_result("Customer Send OTP", False, f"OTP send failed: {otp_response}")
        return False
    
    otp = otp_response.get("otp")
    print_test_result("Customer Send OTP", True, f"OTP received: {otp}")
    
    # Step 2: Verify OTP
    verify_data = {
        "email": CUSTOMER_EMAIL,
        "otp": otp,
        "role": "customer",
        "name": "Test Customer"
    }
    
    response = make_request("POST", "/auth/verify-otp", verify_data)
    if not response or response.status_code != 200:
        print_test_result("Customer Verify OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    verify_response = response.json()
    customer_token = verify_response.get("access_token")
    if customer_token:
        print_test_result("Customer Verify OTP", True, f"Token received: {customer_token[:20]}...")
        return True
    else:
        print_test_result("Customer Verify OTP", False, f"No token in response: {verify_response}")
        return False

def test_store_discovery():
    """Test 3: Customer Store Discovery"""
    global store_id, item_id
    print("🔍 Testing Store Discovery...")
    
    # Test store discovery
    params = {
        "lat": 19.076,
        "lng": 72.8777,
        "module": "food"
    }
    
    response = make_request("GET", "/customer/stores", params=params)
    if not response or response.status_code != 200:
        print_test_result("Store Discovery", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    stores_data = response.json()
    stores = stores_data.get("stores", [])
    
    if not stores:
        print_test_result("Store Discovery", False, "No stores found")
        return False
    
    store_id = stores[0]["id"]
    print_test_result("Store Discovery", True, f"Found {len(stores)} stores, using store: {stores[0]['name']}")
    
    # Test restaurant details
    if not customer_token:
        print_test_result("Restaurant Details", False, "No customer token available")
        return False
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    response = make_request("GET", f"/customer/restaurants/{store_id}", headers=headers)
    
    if not response or response.status_code != 200:
        print_test_result("Restaurant Details", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    restaurant_data = response.json()
    categories = restaurant_data.get("categories", [])
    
    if categories and categories[0].get("items"):
        item_id = categories[0]["items"][0]["id"]
        print_test_result("Restaurant Details", True, f"Restaurant: {restaurant_data['name']}, Categories: {len(categories)}")
        return True
    else:
        print_test_result("Restaurant Details", False, "No menu items found")
        return False

def test_cart_flow():
    """Test 4: Customer Cart Flow"""
    print("🔍 Testing Cart Flow...")
    
    if not customer_token or not store_id or not item_id:
        print_test_result("Cart Flow", False, "Missing prerequisites (token, store_id, or item_id)")
        return False
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    
    # Add item to cart
    cart_data = {
        "store_id": store_id,
        "item_id": item_id,
        "quantity": 2
    }
    
    response = make_request("POST", "/customer/cart/add", cart_data, headers)
    if not response or response.status_code != 200:
        print_test_result("Add to Cart", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    add_response = response.json()
    if not add_response.get("success"):
        print_test_result("Add to Cart", False, f"Add to cart failed: {add_response}")
        return False
    
    print_test_result("Add to Cart", True, "Item added successfully")
    
    # Get cart
    response = make_request("GET", "/customer/cart", headers=headers)
    if not response or response.status_code != 200:
        print_test_result("Get Cart", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    cart_response = response.json()
    cart = cart_response.get("cart")
    if cart and cart.get("items"):
        print_test_result("Get Cart", True, f"Cart has {len(cart['items'])} items, Subtotal: ₹{cart_response.get('subtotal', 0)}")
        return True
    else:
        print_test_result("Get Cart", False, "Cart is empty or invalid")
        return False

def test_customer_address():
    """Test 5: Customer Address Management"""
    global address_id
    print("🔍 Testing Customer Address...")
    
    if not customer_token:
        print_test_result("Customer Address", False, "No customer token available")
        return False
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    
    # Create address
    address_data = {
        "address_line": "123 Test Street, Andheri West",
        "city": "Mumbai",
        "pincode": "400001",
        "state": "Maharashtra",
        "is_default": True,
        "lat": 19.0760,
        "lng": 72.8777
    }
    
    response = make_request("POST", "/customer/addresses", address_data, headers)
    if not response or response.status_code != 200:
        print_test_result("Create Address", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    address_response = response.json()
    address_id = address_response.get("id")
    if address_id:
        print_test_result("Create Address", True, f"Address created: {address_response.get('address_line')}")
    else:
        print_test_result("Create Address", False, f"No address ID in response: {address_response}")
        return False
    
    # Get addresses
    response = make_request("GET", "/customer/addresses", headers=headers)
    if not response or response.status_code != 200:
        print_test_result("Get Addresses", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    addresses = response.json()
    if isinstance(addresses, list) and len(addresses) > 0:
        print_test_result("Get Addresses", True, f"Found {len(addresses)} addresses")
        return True
    else:
        print_test_result("Get Addresses", False, "No addresses found")
        return False

def test_order_placement():
    """Test 6: Order Placement"""
    global order_id
    print("🔍 Testing Order Placement...")
    
    if not customer_token or not store_id or not item_id or not address_id:
        print_test_result("Order Placement", False, "Missing prerequisites")
        return False
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    
    # Place order
    order_data = {
        "store_id": store_id,
        "delivery_address_id": address_id,
        "payment_method": "cash_on_delivery",
        "special_instructions": "Please ring the bell twice",
        "items": [
            {
                "item_id": item_id,
                "quantity": 2
            }
        ]
    }
    
    response = make_request("POST", "/customer/orders", order_data, headers)
    if not response or response.status_code != 200:
        print_test_result("Place Order", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    order_response = response.json()
    if order_response.get("success"):
        order_id = order_response.get("order_id")
        print_test_result("Place Order", True, f"Order placed: {order_response.get('order_number')}, Total: ₹{order_response.get('total_amount')}")
    else:
        print_test_result("Place Order", False, f"Order placement failed: {order_response}")
        return False
    
    # Get orders
    response = make_request("GET", "/customer/orders", headers=headers)
    if not response or response.status_code != 200:
        print_test_result("Get Orders", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    orders_response = response.json()
    orders = orders_response.get("orders", [])
    if orders:
        print_test_result("Get Orders", True, f"Found {len(orders)} orders")
        return True
    else:
        print_test_result("Get Orders", False, "No orders found")
        return False

def test_delivery_partner_auth():
    """Test 7: Delivery Partner Authentication"""
    global delivery_token
    print("🔍 Testing Delivery Partner Authentication...")
    
    # Send OTP
    otp_data = {
        "email": DELIVERY_EMAIL,
        "role": "delivery_partner"
    }
    
    response = make_request("POST", "/auth/send-otp", otp_data)
    if not response or response.status_code != 200:
        print_test_result("Delivery Send OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    otp_response = response.json()
    otp = otp_response.get("otp")
    if not otp:
        print_test_result("Delivery Send OTP", False, f"No OTP received: {otp_response}")
        return False
    
    print_test_result("Delivery Send OTP", True, f"OTP received: {otp}")
    
    # Verify OTP
    verify_data = {
        "email": DELIVERY_EMAIL,
        "otp": otp,
        "role": "delivery_partner",
        "name": "Test Delivery Partner"
    }
    
    response = make_request("POST", "/auth/verify-otp", verify_data)
    if not response or response.status_code != 200:
        print_test_result("Delivery Verify OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    verify_response = response.json()
    delivery_token = verify_response.get("access_token")
    if delivery_token:
        print_test_result("Delivery Verify OTP", True, f"Token received: {delivery_token[:20]}...")
        return True
    else:
        print_test_result("Delivery Verify OTP", False, f"No token in response: {verify_response}")
        return False

def test_delivery_flow():
    """Test 8: Delivery Partner Flow"""
    print("🔍 Testing Delivery Partner Flow...")
    
    if not delivery_token:
        print_test_result("Delivery Flow", False, "No delivery token available")
        return False
    
    headers = {"Authorization": f"Bearer {delivery_token}"}
    
    # Get available deliveries
    params = {
        "lat": 19.076,
        "lng": 72.8777
    }
    
    response = make_request("GET", "/delivery/available", headers=headers, params=params)
    if not response or response.status_code != 200:
        print_test_result("Get Available Deliveries", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    available_response = response.json()
    deliveries = available_response.get("deliveries", [])
    print_test_result("Get Available Deliveries", True, f"Found {len(deliveries)} available deliveries")
    
    # If we have an order and deliveries available, test accepting it
    if order_id and deliveries:
        # Find our order in available deliveries
        target_order = None
        for delivery in deliveries:
            if delivery.get("id") == order_id:
                target_order = delivery
                break
        
        if target_order:
            # Accept delivery
            response = make_request("POST", f"/delivery/accept/{order_id}", headers=headers)
            if response and response.status_code == 200:
                accept_response = response.json()
                if accept_response.get("success"):
                    print_test_result("Accept Delivery", True, f"Delivery accepted for order: {order_id}")
                    
                    # Update delivery status
                    status_data = {"status": "picked_up"}
                    response = make_request("PUT", f"/delivery/status/{order_id}", status_data, headers)
                    if response and response.status_code == 200:
                        status_response = response.json()
                        if status_response.get("success"):
                            print_test_result("Update Delivery Status", True, "Status updated to picked_up")
                        else:
                            print_test_result("Update Delivery Status", False, f"Status update failed: {status_response}")
                    else:
                        print_test_result("Update Delivery Status", False, f"HTTP {response.status_code if response else 'No response'}")
                else:
                    print_test_result("Accept Delivery", False, f"Accept failed: {accept_response}")
            else:
                print_test_result("Accept Delivery", False, f"HTTP {response.status_code if response else 'No response'}")
        else:
            print_test_result("Accept Delivery", False, "Order not found in available deliveries")
    
    # Get earnings
    response = make_request("GET", "/delivery/earnings", headers=headers)
    if response and response.status_code == 200:
        earnings_response = response.json()
        print_test_result("Get Earnings", True, f"Total earnings: ₹{earnings_response.get('total_earnings', 0)}, Deliveries: {earnings_response.get('total_deliveries', 0)}")
        return True
    else:
        print_test_result("Get Earnings", False, f"HTTP {response.status_code if response else 'No response'}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting ViaGo Backend API Tests")
    print("=" * 50)
    
    test_results = []
    
    # Run all tests
    test_results.append(("Health Check", test_health_check()))
    test_results.append(("Customer Authentication", test_customer_auth()))
    test_results.append(("Store Discovery", test_store_discovery()))
    test_results.append(("Cart Flow", test_cart_flow()))
    test_results.append(("Customer Address", test_customer_address()))
    test_results.append(("Order Placement", test_order_placement()))
    test_results.append(("Delivery Partner Auth", test_delivery_partner_auth()))
    test_results.append(("Delivery Flow", test_delivery_flow()))
    
    # Summary
    print("=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(test_results)} tests")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Success Rate: {(passed/len(test_results)*100):.1f}%")
    
    if failed == 0:
        print("\n🎉 All tests passed! ViaGo backend is working correctly.")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")

if __name__ == "__main__":
    main()