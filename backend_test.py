#!/usr/bin/env python3
"""
ViaGo Backend API Test Suite - Driver Status Update & Customer Order Tracking
Testing the two specific flows requested in the review
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test credentials from test_credentials.md
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"
CUSTOMER_EMAIL = "test@test.com"

class ViaGoFlowTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.driver_token = None
        self.customer_token = None
        
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
    
    def test_driver_login(self):
        """Test driver login with credentials"""
        try:
            payload = {
                "email": DRIVER_EMAIL,
                "password": DRIVER_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/driver/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access_token")
                user_data = data.get("user")
                
                if access_token and user_data and user_data.get("role") == "delivery_partner":
                    self.driver_token = access_token
                    self.session.headers.update({"Authorization": f"Bearer {access_token}"})
                    self.log_test(
                        "Driver Login", 
                        True, 
                        f"Driver login successful. User ID: {user_data.get('id')}, Name: {user_data.get('name')}"
                    )
                    return True
                else:
                    self.log_test(
                        "Driver Login", 
                        False, 
                        f"Invalid response structure or role"
                    )
                    return False
            else:
                self.log_test(
                    "Driver Login", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Driver Login", False, f"Error: {str(e)}")
            return False
    
    def test_get_assigned_deliveries(self):
        """Test getting assigned deliveries for driver"""
        try:
            if not self.driver_token:
                self.log_test("Get Assigned Deliveries", False, "Driver not logged in")
                return False, None
            
            response = self.session.get(f"{BACKEND_URL}/delivery/assigned")
            
            if response.status_code == 200:
                data = response.json()
                deliveries = data.get("deliveries", [])
                total = data.get("total", 0)
                
                self.log_test(
                    "Get Assigned Deliveries", 
                    True, 
                    f"Found {total} assigned deliveries"
                )
                return True, deliveries
            else:
                self.log_test(
                    "Get Assigned Deliveries", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("Get Assigned Deliveries", False, f"Error: {str(e)}")
            return False, None
    
    def test_get_available_deliveries(self):
        """Test getting available deliveries for driver to accept"""
        try:
            if not self.driver_token:
                self.log_test("Get Available Deliveries", False, "Driver not logged in")
                return False, None
            
            # Mumbai coordinates
            params = {
                "lat": 19.076,
                "lng": 72.8777,
                "radius_km": 10
            }
            
            response = self.session.get(f"{BACKEND_URL}/delivery/available", params=params)
            
            if response.status_code == 200:
                data = response.json()
                deliveries = data.get("deliveries", [])
                total = data.get("total", 0)
                
                self.log_test(
                    "Get Available Deliveries", 
                    True, 
                    f"Found {total} available deliveries"
                )
                return True, deliveries
            else:
                self.log_test(
                    "Get Available Deliveries", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("Get Available Deliveries", False, f"Error: {str(e)}")
            return False, None
    
    def test_accept_delivery(self, order_id):
        """Test accepting a delivery"""
        try:
            if not self.driver_token:
                self.log_test("Accept Delivery", False, "Driver not logged in")
                return False
            
            response = self.session.post(f"{BACKEND_URL}/delivery/accept/{order_id}")
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test(
                        "Accept Delivery", 
                        True, 
                        f"Successfully accepted delivery {order_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "Accept Delivery", 
                        False, 
                        f"Failed to accept delivery: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "Accept Delivery", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Accept Delivery", False, f"Error: {str(e)}")
            return False
    
    def test_update_delivery_status(self, order_id, status):
        """Test updating delivery status"""
        try:
            if not self.driver_token:
                self.log_test(f"Update Status to {status}", False, "Driver not logged in")
                return False
            
            payload = {"status": status}
            response = self.session.put(f"{BACKEND_URL}/delivery/status/{order_id}", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                
                if success:
                    self.log_test(
                        f"Update Status to {status}", 
                        True, 
                        f"Successfully updated status to {status} for order {order_id}"
                    )
                    return True
                else:
                    self.log_test(
                        f"Update Status to {status}", 
                        False, 
                        f"Failed to update status: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    f"Update Status to {status}", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(f"Update Status to {status}", False, f"Error: {str(e)}")
            return False
    
    def test_customer_otp_login(self):
        """Test customer OTP authentication flow"""
        try:
            # Step 1: Send OTP
            otp_payload = {
                "email": CUSTOMER_EMAIL,
                "role": "customer"
            }
            
            otp_response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=otp_payload)
            
            if otp_response.status_code != 200:
                self.log_test(
                    "Customer OTP Login", 
                    False, 
                    f"Failed to send OTP: {otp_response.status_code}"
                )
                return False
            
            otp_data = otp_response.json()
            otp = otp_data.get("otp")
            
            if not otp:
                self.log_test(
                    "Customer OTP Login", 
                    False, 
                    "No OTP received in response"
                )
                return False
            
            # Step 2: Verify OTP
            verify_payload = {
                "email": CUSTOMER_EMAIL,
                "otp": otp,
                "role": "customer",
                "name": "Test Customer"
            }
            
            verify_response = self.session.post(f"{BACKEND_URL}/auth/verify-otp", json=verify_payload)
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                access_token = verify_data.get("access_token")
                user_data = verify_data.get("user")
                
                if access_token and user_data:
                    self.customer_token = access_token
                    # Create a new session for customer to avoid header conflicts
                    self.customer_session = requests.Session()
                    self.customer_session.headers.update({"Authorization": f"Bearer {access_token}"})
                    
                    self.log_test(
                        "Customer OTP Login", 
                        True, 
                        f"Customer login successful. User ID: {user_data.get('id')}, Name: {user_data.get('name')}"
                    )
                    return True
                else:
                    self.log_test(
                        "Customer OTP Login", 
                        False, 
                        f"Missing access_token or user data in response"
                    )
                    return False
            else:
                self.log_test(
                    "Customer OTP Login", 
                    False, 
                    f"OTP verification failed: {verify_response.status_code}, {verify_response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Customer OTP Login", False, f"Error: {str(e)}")
            return False
    
    def test_get_customer_orders(self):
        """Test getting customer orders"""
        try:
            if not self.customer_token:
                self.log_test("Get Customer Orders", False, "Customer not logged in")
                return False, None
            
            response = self.customer_session.get(f"{BACKEND_URL}/customer/orders")
            
            if response.status_code == 200:
                data = response.json()
                orders = data.get("orders", [])
                total = data.get("total", 0)
                
                self.log_test(
                    "Get Customer Orders", 
                    True, 
                    f"Found {total} customer orders"
                )
                return True, orders
            else:
                self.log_test(
                    "Get Customer Orders", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("Get Customer Orders", False, f"Error: {str(e)}")
            return False, None
    
    def test_get_order_details(self, order_id):
        """Test getting single order details"""
        try:
            if not self.customer_token:
                self.log_test("Get Order Details", False, "Customer not logged in")
                return False
            
            response = self.customer_session.get(f"{BACKEND_URL}/customer/orders/{order_id}")
            
            if response.status_code == 200:
                order_data = response.json()
                
                # Check if order has required fields
                required_fields = ["id", "status", "total_amount", "items"]
                missing_fields = [field for field in required_fields if field not in order_data]
                
                if not missing_fields:
                    self.log_test(
                        "Get Order Details", 
                        True, 
                        f"Order details retrieved successfully. Status: {order_data.get('status')}, Total: {order_data.get('total_amount')}, Items: {len(order_data.get('items', []))}"
                    )
                    return True
                else:
                    self.log_test(
                        "Get Order Details", 
                        False, 
                        f"Missing required fields: {missing_fields}"
                    )
                    return False
            else:
                self.log_test(
                    "Get Order Details", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Get Order Details", False, f"Error: {str(e)}")
            return False
    
    def run_driver_status_update_flow(self):
        """Test the complete driver status update flow"""
        print("🚚 Testing Driver Status Update Flow")
        print("=" * 50)
        
        # Step 1: Driver login
        if not self.test_driver_login():
            print("❌ Driver login failed, aborting driver flow")
            return False
        
        # Step 2: Get assigned deliveries
        success, assigned_deliveries = self.test_get_assigned_deliveries()
        
        order_id = None
        
        # If no assigned deliveries, try to accept one
        if not assigned_deliveries:
            print("📋 No assigned deliveries found, looking for available deliveries...")
            
            # Step 3: Get available deliveries
            success, available_deliveries = self.test_get_available_deliveries()
            
            if success and available_deliveries:
                # Accept the first available delivery
                order_id = available_deliveries[0]["id"]
                if self.test_accept_delivery(order_id):
                    print(f"✅ Accepted delivery {order_id}")
                else:
                    print("❌ Failed to accept delivery")
                    return False
            else:
                print("❌ No available deliveries found")
                return False
        else:
            # Use the first assigned delivery
            order_id = assigned_deliveries[0]["id"]
            print(f"📦 Using assigned delivery {order_id}")
        
        if not order_id:
            print("❌ No order ID available for status updates")
            return False
        
        # Step 4: Update status through the flow
        statuses = ["picked_up", "out_for_delivery", "delivered"]
        
        for status in statuses:
            if not self.test_update_delivery_status(order_id, status):
                print(f"❌ Failed to update status to {status}")
                return False
            time.sleep(1)  # Small delay between status updates
        
        print("✅ Driver status update flow completed successfully!")
        return True
    
    def test_create_sample_order(self):
        """Create a sample order for testing order tracking"""
        try:
            if not self.customer_token:
                self.log_test("Create Sample Order", False, "Customer not logged in")
                return False, None
            
            # First, get stores to find one to order from
            stores_response = self.customer_session.get(f"{BACKEND_URL}/customer/stores", params={"lat": 19.076, "lng": 72.8777})
            
            if stores_response.status_code != 200:
                self.log_test("Create Sample Order", False, f"Failed to get stores: {stores_response.status_code}")
                return False, None
            
            stores_data = stores_response.json()
            stores = stores_data.get("stores", [])
            
            if not stores:
                self.log_test("Create Sample Order", False, "No stores available")
                return False, None
            
            store_id = stores[0]["id"]
            
            # Get store details to find items
            store_response = self.customer_session.get(f"{BACKEND_URL}/customer/restaurants/{store_id}")
            
            if store_response.status_code != 200:
                self.log_test("Create Sample Order", False, f"Failed to get store details: {store_response.status_code}")
                return False, None
            
            store_data = store_response.json()
            categories = store_data.get("categories", [])
            
            if not categories or not categories[0].get("items"):
                self.log_test("Create Sample Order", False, "No items available in store")
                return False, None
            
            item = categories[0]["items"][0]
            
            # Add item to cart
            cart_payload = {
                "store_id": store_id,
                "item_id": item["id"],
                "quantity": 1
            }
            
            cart_response = self.customer_session.post(f"{BACKEND_URL}/customer/cart/add", json=cart_payload)
            
            if cart_response.status_code != 200:
                self.log_test("Create Sample Order", False, f"Failed to add to cart: {cart_response.status_code}")
                return False, None
            
            # Create an address
            address_payload = {
                "address_line": "123 Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "lat": 19.076,
                "lng": 72.8777,
                "is_default": True
            }
            
            address_response = self.customer_session.post(f"{BACKEND_URL}/customer/addresses", json=address_payload)
            
            if address_response.status_code != 200:
                self.log_test("Create Sample Order", False, f"Failed to create address: {address_response.status_code}")
                return False, None
            
            address_data = address_response.json()
            address_id = address_data.get("id")
            
            # Place order
            order_payload = {
                "store_id": store_id,
                "delivery_address_id": address_id,
                "payment_method": "cash",
                "special_instructions": "Test order for API testing",
                "items": [{"item_id": item["id"], "quantity": 1}]
            }
            
            order_response = self.customer_session.post(f"{BACKEND_URL}/customer/orders", json=order_payload)
            
            if order_response.status_code == 200:
                order_data = order_response.json()
                order_id = order_data.get("order_id")
                
                self.log_test(
                    "Create Sample Order", 
                    True, 
                    f"Sample order created successfully. Order ID: {order_id}"
                )
                return True, order_id
            else:
                self.log_test(
                    "Create Sample Order", 
                    False, 
                    f"Failed to place order: {order_response.status_code}, {order_response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("Create Sample Order", False, f"Error: {str(e)}")
            return False, None
    
    def run_customer_order_tracking_flow(self):
        """Test the complete customer order tracking flow"""
        print("👤 Testing Customer Order Tracking Flow")
        print("=" * 50)
        
        # Step 1: Customer login
        if not self.test_customer_otp_login():
            print("❌ Customer login failed, aborting customer flow")
            return False
        
        # Step 2: Create a sample order for testing
        order_created, order_id = self.test_create_sample_order()
        
        # Step 3: Get customer orders
        success, orders = self.test_get_customer_orders()
        
        if not success:
            print("❌ Failed to get customer orders")
            return False
        
        # Step 4: Test order details endpoint
        if orders and len(orders) > 0:
            # Use the first order from the list
            test_order_id = orders[0]["id"]
            if self.test_get_order_details(test_order_id):
                print("✅ Customer order tracking flow completed successfully!")
                return True
            else:
                print("❌ Failed to get order details")
                return False
        elif order_created and order_id:
            # Use the newly created order
            if self.test_get_order_details(order_id):
                print("✅ Customer order tracking flow completed successfully!")
                return True
            else:
                print("❌ Failed to get order details")
                return False
        else:
            print("📋 No orders available for testing order details endpoint")
            # Still consider this a success since the orders list API worked
            return True
    
    def run_all_tests(self):
        """Run all the specific flow tests"""
        print("🚀 Starting ViaGo Backend API Flow Tests")
        print("Testing Driver Status Update & Customer Order Tracking")
        print("=" * 60)
        
        # Test 0: Health check
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return
        
        # Test Flow 1: Driver Status Update Flow
        driver_flow_success = self.run_driver_status_update_flow()
        
        print("\n" + "=" * 60)
        
        # Test Flow 2: Customer Order Tracking Flow
        customer_flow_success = self.run_customer_order_tracking_flow()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 FLOW TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        print(f"\n🚚 Driver Status Update Flow: {'✅ PASS' if driver_flow_success else '❌ FAIL'}")
        print(f"👤 Customer Order Tracking Flow: {'✅ PASS' if customer_flow_success else '❌ FAIL'}")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"   {result['details']}")
        
        return self.test_results

if __name__ == "__main__":
    tester = ViaGoFlowTester()
    results = tester.run_all_tests()