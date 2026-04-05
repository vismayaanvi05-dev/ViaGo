#!/usr/bin/env python3
"""
ViaGo Backend API Test Suite
Testing the updated Driver delivery flow with enriched data and expanded 5-step status flow
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test credentials
DRIVER_EMAIL = "driver@test.com"
DRIVER_PASSWORD = "driver123"

class ViaGoAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.driver_token = None
        self.test_order_id = None
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def test_result(self, test_name, success, details=""):
        self.results["total_tests"] += 1
        if success:
            self.results["passed"] += 1
            self.log(f"✅ {test_name} - PASSED", "PASS")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {details}")
            self.log(f"❌ {test_name} - FAILED: {details}", "FAIL")
        
        if details:
            self.log(f"   Details: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            if headers is None:
                headers = {}
            
            if self.driver_token:
                headers["Authorization"] = f"Bearer {self.driver_token}"
            
            response = self.session.request(method, url, json=data, headers=headers)
            return response
        except Exception as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return None
    
    def test_driver_login(self):
        """Test 1: Driver Login"""
        self.log("Testing Driver Login...")
        
        response = self.make_request("POST", "/auth/driver/login", {
            "email": DRIVER_EMAIL,
            "password": DRIVER_PASSWORD
        })
        
        if not response:
            self.test_result("Driver Login", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.driver_token = data["access_token"]
                user_info = data.get("user", {})
                self.test_result("Driver Login", True, f"Logged in as {user_info.get('name', 'Driver')}")
                return True
            else:
                self.test_result("Driver Login", False, "No access token in response")
                return False
        else:
            self.test_result("Driver Login", False, f"Status {response.status_code}: {response.text}")
            return False
    
    def test_available_deliveries_enriched(self):
        """Test 2: Available Deliveries with Enriched Data"""
        self.log("Testing Available Deliveries with enriched data...")
        
        response = self.make_request("GET", "/delivery/available?lat=19.076&lng=72.8777&radius_km=10")
        
        if not response:
            self.test_result("Available Deliveries (enriched)", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            deliveries = data.get("deliveries", [])
            
            if not deliveries:
                self.test_result("Available Deliveries (enriched)", True, "No available deliveries (expected)")
                return True
            
            # Check first delivery for enriched data
            delivery = deliveries[0]
            required_fields = {
                "pickup_location": ["name", "phone", "address"],
                "drop_location": ["address", "city"],
                "customer_phone": str,
                "customer": ["name", "phone"],
                "items": list
            }
            
            missing_fields = []
            for field, expected in required_fields.items():
                if field not in delivery:
                    missing_fields.append(field)
                elif isinstance(expected, list):
                    # Check nested fields
                    for subfield in expected:
                        if subfield not in delivery[field]:
                            missing_fields.append(f"{field}.{subfield}")
                elif expected == list and not isinstance(delivery[field], list):
                    missing_fields.append(f"{field} (should be list)")
            
            if missing_fields:
                self.test_result("Available Deliveries (enriched)", False, f"Missing enriched fields: {missing_fields}")
                return False
            else:
                self.test_result("Available Deliveries (enriched)", True, f"Found {len(deliveries)} deliveries with all enriched data")
                return True
        else:
            self.test_result("Available Deliveries (enriched)", False, f"Status {response.status_code}: {response.text}")
            return False
    
    def test_accept_delivery(self):
        """Test 3: Accept Delivery"""
        self.log("Testing Accept Delivery...")
        
        # First get available deliveries
        response = self.make_request("GET", "/delivery/available?lat=19.076&lng=72.8777&radius_km=10")
        
        if not response or response.status_code != 200:
            self.test_result("Accept Delivery", False, "Could not get available deliveries")
            return False
        
        data = response.json()
        deliveries = data.get("deliveries", [])
        
        if not deliveries:
            self.test_result("Accept Delivery", False, "No available deliveries to accept")
            return False
        
        # Accept the first delivery
        order_id = deliveries[0]["id"]
        self.test_order_id = order_id
        
        response = self.make_request("POST", f"/delivery/accept/{order_id}")
        
        if not response:
            self.test_result("Accept Delivery", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                self.test_result("Accept Delivery", True, f"Accepted order {order_id}")
                return True
            else:
                self.test_result("Accept Delivery", False, "Success flag not set")
                return False
        else:
            self.test_result("Accept Delivery", False, f"Status {response.status_code}: {response.text}")
            return False
    
    def test_assigned_deliveries_enriched(self):
        """Test 4: Assigned Deliveries with Enriched Data"""
        self.log("Testing Assigned Deliveries with enriched data...")
        
        response = self.make_request("GET", "/delivery/assigned")
        
        if not response:
            self.test_result("Assigned Deliveries (enriched)", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            deliveries = data.get("deliveries", [])
            
            if not deliveries:
                self.test_result("Assigned Deliveries (enriched)", False, "No assigned deliveries found")
                return False
            
            # Check first delivery for enriched data
            delivery = deliveries[0]
            required_fields = {
                "store": ["name", "phone", "address"],
                "pickup_location": ["name", "address", "phone"],
                "drop_location": ["address", "city"],
                "customer_phone": str,
                "customer": ["name", "phone"],
                "items": list
            }
            
            missing_fields = []
            for field, expected in required_fields.items():
                if field not in delivery:
                    missing_fields.append(field)
                elif isinstance(expected, list):
                    # Check nested fields
                    for subfield in expected:
                        if subfield not in delivery[field]:
                            missing_fields.append(f"{field}.{subfield}")
                elif expected == list and not isinstance(delivery[field], list):
                    missing_fields.append(f"{field} (should be list)")
            
            if missing_fields:
                self.test_result("Assigned Deliveries (enriched)", False, f"Missing enriched fields: {missing_fields}")
                return False
            else:
                self.test_result("Assigned Deliveries (enriched)", True, f"Found {len(deliveries)} assigned deliveries with all enriched data")
                return True
        else:
            self.test_result("Assigned Deliveries (enriched)", False, f"Status {response.status_code}: {response.text}")
            return False
    
    def test_5_step_status_flow(self):
        """Test 5: 5-Step Status Update Flow"""
        self.log("Testing 5-Step Status Update Flow...")
        
        if not self.test_order_id:
            self.test_result("5-Step Status Flow", False, "No order ID available for testing")
            return False
        
        # Define the 5-step flow
        status_flow = [
            "on_the_way",
            "picked_up", 
            "in_transit",
            "reached_location",
            "delivered"
        ]
        
        success_count = 0
        
        for i, status in enumerate(status_flow):
            self.log(f"  Step {i+1}: Updating to '{status}'...")
            
            response = self.make_request("PUT", f"/delivery/status/{self.test_order_id}", {
                "status": status
            })
            
            if not response:
                self.test_result(f"Status Update - {status}", False, "Request failed")
                continue
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.test_result(f"Status Update - {status}", True, f"Successfully updated to {status}")
                    success_count += 1
                else:
                    self.test_result(f"Status Update - {status}", False, "Success flag not set")
            else:
                self.test_result(f"Status Update - {status}", False, f"Status {response.status_code}: {response.text}")
        
        # Overall flow test result
        if success_count == len(status_flow):
            self.test_result("5-Step Status Flow (Complete)", True, f"All {len(status_flow)} status updates successful")
            return True
        else:
            self.test_result("5-Step Status Flow (Complete)", False, f"Only {success_count}/{len(status_flow)} status updates successful")
            return False
    
    def test_invalid_status(self):
        """Test 6: Invalid Status Test"""
        self.log("Testing Invalid Status rejection...")
        
        if not self.test_order_id:
            self.test_result("Invalid Status Test", False, "No order ID available for testing")
            return False
        
        response = self.make_request("PUT", f"/delivery/status/{self.test_order_id}", {
            "status": "invalid"
        })
        
        if not response:
            self.test_result("Invalid Status Test", False, "Request failed")
            return False
        
        if response.status_code == 400:
            self.test_result("Invalid Status Test", True, "Invalid status correctly rejected with 400")
            return True
        else:
            self.test_result("Invalid Status Test", False, f"Expected 400, got {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting ViaGo Backend API Tests...")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"Driver Credentials: {DRIVER_EMAIL} / {DRIVER_PASSWORD}")
        self.log("=" * 60)
        
        # Test sequence
        tests = [
            self.test_driver_login,
            self.test_available_deliveries_enriched,
            self.test_accept_delivery,
            self.test_assigned_deliveries_enriched,
            self.test_5_step_status_flow,
            self.test_invalid_status
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log(f"Test {test.__name__} crashed: {str(e)}", "ERROR")
                self.test_result(test.__name__, False, f"Test crashed: {str(e)}")
            
            self.log("-" * 40)
        
        # Final summary
        self.log("=" * 60)
        self.log("🏁 TEST SUMMARY")
        self.log(f"Total Tests: {self.results['total_tests']}")
        self.log(f"Passed: {self.results['passed']}")
        self.log(f"Failed: {self.results['failed']}")
        
        if self.results['failed'] > 0:
            self.log("❌ FAILED TESTS:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        success_rate = (self.results['passed'] / self.results['total_tests']) * 100 if self.results['total_tests'] > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            self.log("🎉 OVERALL RESULT: PASS")
            return True
        else:
            self.log("💥 OVERALL RESULT: FAIL")
            return False

if __name__ == "__main__":
    tester = ViaGoAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)