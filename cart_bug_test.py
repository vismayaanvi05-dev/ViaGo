#!/usr/bin/env python3
"""
ViaGo Cart Management Bug Fix Test
Testing the specific ObjectId serialization bug fix in cart/add endpoint
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test data from review request
STORE_ID = "48fd1ff8-d0f6-402d-86bf-64a3bc65b731"  # Spice Garden
ITEM_1 = "983f6ac6-1a1d-449c-ad0b-3ee38bd3cf2a"  # Paneer Tikka, ₹180
ITEM_2 = "38af6011-9d24-462c-90f1-ab1b4d600eaa"  # Chicken Wings, ₹220
ITEM_3 = "e9efeb5a-ddc1-491a-98ab-6d77385d962f"  # Spring Rolls, ₹150

# Test credentials
TEST_EMAIL = "test@example.com"
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"

class CartBugTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.customer_token = None
        self.driver_token = None
        self.customer_id = None
        self.order_id = None
        
    def log_test(self, test_name, success, details):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        print()
        
    def test_health_check(self):
        """Test basic health check"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('status')}, DB: {data.get('database')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
            return False
    
    def authenticate_customer(self):
        """Authenticate customer using OTP flow"""
        try:
            # Step 1: Send OTP
            otp_payload = {
                "email": TEST_EMAIL,
                "role": "customer"
            }
            
            otp_response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=otp_payload)
            
            if otp_response.status_code != 200:
                self.log_test("Customer Authentication - Send OTP", False, f"Status: {otp_response.status_code}")
                return False
            
            otp_data = otp_response.json()
            otp = otp_data.get("otp")
            
            if not otp:
                self.log_test("Customer Authentication - Send OTP", False, "No OTP in response")
                return False
            
            self.log_test("Customer Authentication - Send OTP", True, f"OTP received: {otp}")
            
            # Step 2: Verify OTP
            verify_payload = {
                "email": TEST_EMAIL,
                "otp": otp,
                "name": "Test Customer"
            }
            
            verify_response = self.session.post(f"{BACKEND_URL}/auth/verify-otp", json=verify_payload)
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                self.customer_token = verify_data.get("access_token")
                user_data = verify_data.get("user")
                self.customer_id = user_data.get("id") if user_data else None
                
                if self.customer_token and self.customer_id:
                    self.log_test("Customer Authentication - Verify OTP", True, f"Customer ID: {self.customer_id}")
                    return True
                else:
                    self.log_test("Customer Authentication - Verify OTP", False, "Missing token or user ID")
                    return False
            else:
                self.log_test("Customer Authentication - Verify OTP", False, f"Status: {verify_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Customer Authentication", False, f"Error: {str(e)}")
            return False
    
    def test_cart_bug_fix(self):
        """Test the specific cart ObjectId serialization bug fix"""
        if not self.customer_token:
            self.log_test("Cart Bug Fix Test", False, "No customer token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        try:
            # Step 1: Add first item to cart (creates new cart)
            first_item_payload = {
                "store_id": STORE_ID,
                "item_id": ITEM_1,
                "quantity": 1
            }
            
            first_response = self.session.post(f"{BACKEND_URL}/customer/cart/add", json=first_item_payload, headers=headers)
            
            if first_response.status_code != 200:
                self.log_test("Cart Bug Fix - Add First Item", False, f"Status: {first_response.status_code}, Response: {first_response.text}")
                return False
            
            first_data = first_response.json()
            self.log_test("Cart Bug Fix - Add First Item", True, f"First item added successfully")
            
            # Step 2: Add SECOND item to same cart (THIS WAS THE BUG)
            second_item_payload = {
                "store_id": STORE_ID,
                "item_id": ITEM_2,
                "quantity": 1
            }
            
            second_response = self.session.post(f"{BACKEND_URL}/customer/cart/add", json=second_item_payload, headers=headers)
            
            if second_response.status_code != 200:
                self.log_test("Cart Bug Fix - Add Second Item (THE BUG)", False, f"Status: {second_response.status_code}, Response: {second_response.text}")
                return False
            
            second_data = second_response.json()
            self.log_test("Cart Bug Fix - Add Second Item (THE BUG)", True, f"Second item added successfully - BUG FIXED!")
            
            # Step 3: Add same item again (quantity should increase)
            third_response = self.session.post(f"{BACKEND_URL}/customer/cart/add", json=second_item_payload, headers=headers)
            
            if third_response.status_code != 200:
                self.log_test("Cart Bug Fix - Increase Quantity", False, f"Status: {third_response.status_code}, Response: {third_response.text}")
                return False
            
            third_data = third_response.json()
            self.log_test("Cart Bug Fix - Increase Quantity", True, f"Quantity increased successfully")
            
            # Step 4: Get cart to verify items and subtotal
            cart_response = self.session.get(f"{BACKEND_URL}/customer/cart", headers=headers)
            
            if cart_response.status_code != 200:
                self.log_test("Cart Bug Fix - Get Cart", False, f"Status: {cart_response.status_code}")
                return False
            
            cart_data = cart_response.json()
            cart_obj = cart_data.get("cart")
            items = cart_obj.get("items", []) if cart_obj else []
            subtotal = cart_data.get("subtotal", 0)
            
            if len(items) >= 2:
                self.log_test("Cart Bug Fix - Get Cart", True, f"Cart has {len(items)} items, subtotal: ₹{subtotal}")
                return True
            else:
                self.log_test("Cart Bug Fix - Get Cart", False, f"Expected at least 2 items, got {len(items)}. Cart data: {cart_data}")
                return False
                
        except Exception as e:
            self.log_test("Cart Bug Fix Test", False, f"Error: {str(e)}")
            return False
    
    def test_cart_operations(self):
        """Test additional cart operations"""
        if not self.customer_token:
            self.log_test("Cart Operations Test", False, "No customer token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        try:
            # Get current cart
            cart_response = self.session.get(f"{BACKEND_URL}/customer/cart", headers=headers)
            if cart_response.status_code != 200:
                self.log_test("Cart Operations - Get Cart", False, f"Status: {cart_response.status_code}")
                return False
            
            cart_data = cart_response.json()
            cart_obj = cart_data.get("cart")
            items = cart_obj.get("items", []) if cart_obj else []
            
            if not items:
                self.log_test("Cart Operations - Get Cart", False, "No items in cart")
                return False
            
            # Test update cart item quantity
            first_item = items[0]
            item_id = first_item.get("item_id")
            new_quantity = first_item.get("quantity", 1) + 1
            
            update_payload = {
                "item_id": item_id,
                "quantity": new_quantity
            }
            
            update_response = self.session.put(f"{BACKEND_URL}/customer/cart/update", json=update_payload, headers=headers)
            
            if update_response.status_code == 200:
                self.log_test("Cart Operations - Update Quantity", True, f"Updated item quantity to {new_quantity}")
            else:
                self.log_test("Cart Operations - Update Quantity", False, f"Status: {update_response.status_code}")
            
            # Test remove item from cart
            if len(items) > 1:
                remove_item_id = items[1].get("item_id")
                
                remove_response = self.session.delete(f"{BACKEND_URL}/customer/cart/remove?item_id={remove_item_id}", headers=headers)
                
                if remove_response.status_code == 200:
                    self.log_test("Cart Operations - Remove Item", True, f"Removed item {remove_item_id}")
                else:
                    self.log_test("Cart Operations - Remove Item", False, f"Status: {remove_response.status_code}")
            else:
                self.log_test("Cart Operations - Remove Item", False, "Not enough items to test removal")
            
            return True
            
        except Exception as e:
            self.log_test("Cart Operations Test", False, f"Error: {str(e)}")
            return False
    
    def test_e2e_order_flow(self):
        """Test complete E2E order flow"""
        if not self.customer_token:
            self.log_test("E2E Order Flow", False, "No customer token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        
        try:
            # Step 1: Ensure cart has items
            cart_response = self.session.get(f"{BACKEND_URL}/customer/cart", headers=headers)
            if cart_response.status_code != 200:
                self.log_test("E2E Order Flow - Check Cart", False, f"Status: {cart_response.status_code}")
                return False
            
            cart_data = cart_response.json()
            cart_obj = cart_data.get("cart")
            
            if not cart_obj or not cart_obj.get("items"):
                # Add an item to cart
                add_payload = {
                    "store_id": STORE_ID,
                    "item_id": ITEM_3,
                    "quantity": 2
                }
                add_response = self.session.post(f"{BACKEND_URL}/customer/cart/add", json=add_payload, headers=headers)
                if add_response.status_code != 200:
                    self.log_test("E2E Order Flow - Add Item", False, f"Status: {add_response.status_code}")
                    return False
                
                # Get cart again
                cart_response = self.session.get(f"{BACKEND_URL}/customer/cart", headers=headers)
                cart_data = cart_response.json()
                cart_obj = cart_data.get("cart")
            
            # Step 2: Create address
            address_payload = {
                "address_line": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "landmark": "Near Test Mall",
                "is_default": True
            }
            
            address_response = self.session.post(f"{BACKEND_URL}/customer/addresses", json=address_payload, headers=headers)
            
            if address_response.status_code != 200:
                self.log_test("E2E Order Flow - Create Address", False, f"Status: {address_response.status_code}")
                return False
            
            address_data = address_response.json()
            address_id = address_data.get("id")
            self.log_test("E2E Order Flow - Create Address", True, f"Address created: {address_id}")
            
            # Step 3: Place order with correct structure
            cart_items = cart_obj.get("items", [])
            order_items = []
            for item in cart_items:
                order_items.append({
                    "item_id": item["item_id"],
                    "quantity": item["quantity"],
                    "variant_id": item.get("variant_id")
                })
            
            order_payload = {
                "store_id": cart_obj.get("store_id"),
                "delivery_address_id": address_id,
                "items": order_items,
                "payment_method": "cash_on_delivery"
            }
            
            order_response = self.session.post(f"{BACKEND_URL}/customer/orders", json=order_payload, headers=headers)
            
            if order_response.status_code == 200:
                order_data = order_response.json()
                self.order_id = order_data.get("order_id")
                total_amount = order_data.get("total_amount")
                self.log_test("E2E Order Flow - Place Order", True, f"Order placed: {self.order_id}, Total: ₹{total_amount}")
                return True
            else:
                self.log_test("E2E Order Flow - Place Order", False, f"Status: {order_response.status_code}, Response: {order_response.text}")
                return False
                
        except Exception as e:
            self.log_test("E2E Order Flow", False, f"Error: {str(e)}")
            return False
    
    def authenticate_driver(self):
        """Authenticate driver using password login"""
        try:
            login_payload = {
                "email": DRIVER_EMAIL,
                "password": DRIVER_PASSWORD
            }
            
            login_response = self.session.post(f"{BACKEND_URL}/auth/driver/login", json=login_payload)
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                self.driver_token = login_data.get("access_token")
                user_data = login_data.get("user")
                
                if self.driver_token and user_data:
                    self.log_test("Driver Authentication", True, f"Driver logged in: {user_data.get('id')}")
                    return True
                else:
                    self.log_test("Driver Authentication", False, "Missing token or user data")
                    return False
            else:
                self.log_test("Driver Authentication", False, f"Status: {login_response.status_code}, Response: {login_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Driver Authentication", False, f"Error: {str(e)}")
            return False
    
    def test_driver_delivery_flow(self):
        """Test driver delivery management flow"""
        if not self.driver_token:
            self.log_test("Driver Delivery Flow", False, "No driver token available")
            return False
        
        headers = {"Authorization": f"Bearer {self.driver_token}"}
        
        try:
            # Step 1: Get available deliveries (with required lat/lng parameters)
            deliveries_response = self.session.get(f"{BACKEND_URL}/delivery/available?lat=19.076&lng=72.8777&radius_km=10", headers=headers)
            
            if deliveries_response.status_code != 200:
                self.log_test("Driver Delivery Flow - Get Available", False, f"Status: {deliveries_response.status_code}, Response: {deliveries_response.text}")
                return False
            
            deliveries_data = deliveries_response.json()
            available_orders = deliveries_data.get("deliveries", [])
            self.log_test("Driver Delivery Flow - Get Available", True, f"Found {len(available_orders)} available deliveries")
            
            # Step 2: Accept delivery (if available)
            if available_orders and self.order_id:
                # Try to accept our test order
                accept_response = self.session.post(f"{BACKEND_URL}/delivery/accept/{self.order_id}", headers=headers)
                
                if accept_response.status_code == 200:
                    self.log_test("Driver Delivery Flow - Accept Delivery", True, f"Accepted order: {self.order_id}")
                    
                    # Step 3: Update delivery status
                    status_payload = {
                        "status": "picked_up"
                    }
                    status_response = self.session.put(f"{BACKEND_URL}/delivery/status/{self.order_id}", json=status_payload, headers=headers)
                    
                    if status_response.status_code == 200:
                        self.log_test("Driver Delivery Flow - Update Status", True, "Status updated to picked_up")
                    else:
                        self.log_test("Driver Delivery Flow - Update Status", False, f"Status: {status_response.status_code}")
                else:
                    self.log_test("Driver Delivery Flow - Accept Delivery", False, f"Status: {accept_response.status_code}, Response: {accept_response.text}")
            elif not self.order_id:
                self.log_test("Driver Delivery Flow - Accept Delivery", False, "No test order ID available")
            
            # Step 4: Check earnings
            earnings_response = self.session.get(f"{BACKEND_URL}/delivery/earnings", headers=headers)
            
            if earnings_response.status_code == 200:
                earnings_data = earnings_response.json()
                total_earnings = earnings_data.get("total_earnings", 0)
                self.log_test("Driver Delivery Flow - Check Earnings", True, f"Total earnings: ₹{total_earnings}")
            else:
                self.log_test("Driver Delivery Flow - Check Earnings", False, f"Status: {earnings_response.status_code}")
            
            return True
            
        except Exception as e:
            self.log_test("Driver Delivery Flow", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all cart bug fix and E2E tests"""
        print("🚀 Starting ViaGo Cart Bug Fix & E2E Tests")
        print("=" * 60)
        
        # Test 0: Health check
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return
        
        # Test 1: Customer authentication
        if not self.authenticate_customer():
            print("❌ Customer authentication failed, aborting cart tests")
            return
        
        # Test 2: Cart bug fix (CRITICAL TEST)
        self.test_cart_bug_fix()
        
        # Test 3: Additional cart operations
        self.test_cart_operations()
        
        # Test 4: E2E order flow
        self.test_e2e_order_flow()
        
        # Test 5: Driver authentication
        self.authenticate_driver()
        
        # Test 6: Driver delivery flow
        self.test_driver_delivery_flow()
        
        # Summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"   {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = CartBugTester()
    results = tester.run_all_tests()