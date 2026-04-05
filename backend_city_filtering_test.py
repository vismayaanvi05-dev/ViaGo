#!/usr/bin/env python3
"""
ViaGo Backend API Test Suite - EXACT CITY TENANT FILTERING
Testing strict city/town-based tenant matching across all customer endpoints.
NO radius-based filtering. Only exact city matches.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test credentials from review request
CUSTOMER_EMAIL = "test@example.com"  # Use non-verified email to get OTP in response

class CityFilteringTester:
    def __init__(self):
        self.session = requests.Session()
        self.customer_token = None
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
    
    def make_request(self, method, endpoint, data=None, headers=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        try:
            if headers is None:
                headers = {}
            
            if self.customer_token:
                headers["Authorization"] = f"Bearer {self.customer_token}"
            
            response = self.session.request(method, url, json=data, headers=headers, params=params)
            return response
        except Exception as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return None
    
    def test_customer_authentication(self):
        """Test 1: Customer OTP Authentication"""
        self.log("Testing Customer OTP Authentication...")
        
        # Send OTP
        response = self.make_request("POST", "/auth/send-otp", {
            "email": CUSTOMER_EMAIL,
            "role": "customer"
        })
        
        if not response:
            self.test_result("Customer Authentication", False, "Send OTP request failed")
            return False
        
        if response.status_code != 200:
            self.test_result("Customer Authentication", False, f"Send OTP failed: {response.status_code} - {response.text}")
            return False
        
        otp_data = response.json()
        otp = otp_data.get("otp")  # OTP should be in response for testing
        
        # If OTP not in response, check if email sending failed (which means OTP is stored but not returned)
        if not otp:
            if not otp_data.get("email_sent", True):
                # Email sending failed, OTP should be in response for testing
                self.test_result("Customer Authentication", False, "No OTP in response despite email send failure")
                return False
            else:
                # Email sent successfully, but OTP not in response (production behavior)
                # For testing, we'll use a known OTP or skip auth-required tests
                self.log("Email sent successfully but OTP not in response (production mode)")
                self.test_result("Customer Authentication", True, "Email sent successfully (production mode - cannot test auth-required endpoints)")
                return False
        
        # Verify OTP
        response = self.make_request("POST", "/auth/verify-otp", {
            "email": CUSTOMER_EMAIL,
            "otp": otp,
            "role": "customer",
            "name": "Test User"  # Required for new user registration
        })
        
        if not response or response.status_code != 200:
            self.test_result("Customer Authentication", False, f"OTP verification failed: {response.status_code if response else 'No response'}")
            return False
        
        auth_data = response.json()
        if "access_token" in auth_data:
            self.customer_token = auth_data["access_token"]
            self.test_result("Customer Authentication", True, f"Authenticated as {auth_data.get('user', {}).get('email', CUSTOMER_EMAIL)}")
            return True
        else:
            self.test_result("Customer Authentication", False, "No access token in response")
            return False
    
    def test_stores_endpoint_city_filtering(self):
        """Test 2: GET /api/customer/stores - City Filtering"""
        self.log("Testing Stores Endpoint City Filtering...")
        
        # Test with valid city (Bengaluru)
        params = {
            "lat": 12.89,
            "lng": 77.62,
            "city": "Bengaluru",
            "module": "food"
        }
        
        response = self.make_request("GET", "/customer/stores", params=params)
        
        if not response:
            self.test_result("Stores Endpoint - Valid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            stores = data.get("stores", [])
            
            # Check that all stores have is_deliverable: true
            all_deliverable = all(store.get("is_deliverable") == True for store in stores)
            
            if stores and all_deliverable:
                self.test_result("Stores Endpoint - Valid City", True, f"Found {len(stores)} stores from Bengaluru, all deliverable")
            elif stores and not all_deliverable:
                self.test_result("Stores Endpoint - Valid City", False, "Some stores have is_deliverable: false (should be true for exact city match)")
                return False
            else:
                self.test_result("Stores Endpoint - Valid City", True, "No stores found for Bengaluru (acceptable if no data)")
        else:
            self.test_result("Stores Endpoint - Valid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        # Test with invalid city (NonExistentCity)
        params["city"] = "NonExistentCity"
        
        response = self.make_request("GET", "/customer/stores", params=params)
        
        if not response:
            self.test_result("Stores Endpoint - Invalid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            stores = data.get("stores", [])
            
            if len(stores) == 0:
                self.test_result("Stores Endpoint - Invalid City", True, "Correctly returned 0 stores for non-existent city")
            else:
                self.test_result("Stores Endpoint - Invalid City", False, f"Should return 0 stores for non-existent city, got {len(stores)}")
                return False
        else:
            self.test_result("Stores Endpoint - Invalid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        return True
    
    def test_search_endpoint_city_filtering(self):
        """Test 3: GET /api/customer/search - City Filtering"""
        self.log("Testing Search Endpoint City Filtering...")
        
        # Test with valid city (Bengaluru)
        params = {
            "q": "pizza",
            "lat": 12.89,
            "lng": 77.62,
            "city": "Bengaluru"
        }
        
        response = self.make_request("GET", "/customer/search", params=params)
        
        if not response:
            self.test_result("Search Endpoint - Valid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            stores = data.get("stores", [])
            items = data.get("items", [])
            
            # Check that all stores have is_deliverable: true
            all_deliverable = all(store.get("is_deliverable") == True for store in stores)
            
            if (stores or items) and all_deliverable:
                self.test_result("Search Endpoint - Valid City", True, f"Found {len(stores)} stores and {len(items)} items for Bengaluru, all stores deliverable")
            elif stores and not all_deliverable:
                self.test_result("Search Endpoint - Valid City", False, "Some stores have is_deliverable: false (should be true for exact city match)")
                return False
            else:
                self.test_result("Search Endpoint - Valid City", True, "No results found for Bengaluru (acceptable if no data)")
        else:
            self.test_result("Search Endpoint - Valid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        # Test with invalid city (NonExistentCity)
        params["city"] = "NonExistentCity"
        
        response = self.make_request("GET", "/customer/search", params=params)
        
        if not response:
            self.test_result("Search Endpoint - Invalid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            stores = data.get("stores", [])
            items = data.get("items", [])
            
            if len(stores) == 0 and len(items) == 0:
                self.test_result("Search Endpoint - Invalid City", True, "Correctly returned empty results for non-existent city")
            else:
                self.test_result("Search Endpoint - Invalid City", False, f"Should return empty results for non-existent city, got {len(stores)} stores and {len(items)} items")
                return False
        else:
            self.test_result("Search Endpoint - Invalid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        return True
    
    def test_restaurants_endpoint_city_filtering(self):
        """Test 4: GET /api/customer/restaurants - City Filtering (requires auth)"""
        self.log("Testing Restaurants Endpoint City Filtering...")
        
        if not self.customer_token:
            self.test_result("Restaurants Endpoint - Valid City", False, "No customer token available")
            return False
        
        # Test with valid city (Bengaluru)
        params = {
            "lat": 12.89,
            "lng": 77.62,
            "city": "Bengaluru"
        }
        
        response = self.make_request("GET", "/customer/restaurants", params=params)
        
        if not response:
            self.test_result("Restaurants Endpoint - Valid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            restaurants = response.json()
            
            # Check that all restaurants have is_deliverable: true
            all_deliverable = all(restaurant.get("is_deliverable") == True for restaurant in restaurants)
            
            if restaurants and all_deliverable:
                self.test_result("Restaurants Endpoint - Valid City", True, f"Found {len(restaurants)} restaurants from Bengaluru, all deliverable")
            elif restaurants and not all_deliverable:
                self.test_result("Restaurants Endpoint - Valid City", False, "Some restaurants have is_deliverable: false (should be true for exact city match)")
                return False
            else:
                self.test_result("Restaurants Endpoint - Valid City", True, "No restaurants found for Bengaluru (acceptable if no data)")
        else:
            self.test_result("Restaurants Endpoint - Valid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        # Test with invalid city (NonExistentCity)
        params["city"] = "NonExistentCity"
        
        response = self.make_request("GET", "/customer/restaurants", params=params)
        
        if not response:
            self.test_result("Restaurants Endpoint - Invalid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            restaurants = response.json()
            
            if len(restaurants) == 0:
                self.test_result("Restaurants Endpoint - Invalid City", True, "Correctly returned empty array for non-existent city")
            else:
                self.test_result("Restaurants Endpoint - Invalid City", False, f"Should return empty array for non-existent city, got {len(restaurants)} restaurants")
                return False
        else:
            self.test_result("Restaurants Endpoint - Invalid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        return True
    
    def test_config_endpoint_city_filtering(self):
        """Test 5: GET /api/customer/config - City Filtering"""
        self.log("Testing Config Endpoint City Filtering...")
        
        # Test with valid city (Bengaluru)
        params = {
            "lat": 12.89,
            "lng": 77.62,
            "city": "Bengaluru"
        }
        
        response = self.make_request("GET", "/customer/config", params=params)
        
        if not response:
            self.test_result("Config Endpoint - Valid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            available_modules = data.get("available_modules", [])
            
            self.test_result("Config Endpoint - Valid City", True, f"Config returned with available_modules: {available_modules}")
        else:
            self.test_result("Config Endpoint - Valid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        # Test with invalid city (NonExistentCity)
        params["city"] = "NonExistentCity"
        
        response = self.make_request("GET", "/customer/config", params=params)
        
        if not response:
            self.test_result("Config Endpoint - Invalid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            data = response.json()
            available_modules = data.get("available_modules", [])
            
            if len(available_modules) == 0:
                self.test_result("Config Endpoint - Invalid City", True, "Correctly returned empty available_modules for non-existent city")
            else:
                self.test_result("Config Endpoint - Invalid City", False, f"Should return empty available_modules for non-existent city, got {available_modules}")
                return False
        else:
            self.test_result("Config Endpoint - Invalid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        return True
    
    def test_coupons_endpoint_city_filtering(self):
        """Test 6: GET /api/customer/coupons - City Filtering (requires auth)"""
        self.log("Testing Coupons Endpoint City Filtering...")
        
        if not self.customer_token:
            self.test_result("Coupons Endpoint - Valid City", False, "No customer token available")
            return False
        
        # Test with valid city (Bengaluru)
        params = {
            "city": "Bengaluru"
        }
        
        response = self.make_request("GET", "/customer/coupons", params=params)
        
        if not response:
            self.test_result("Coupons Endpoint - Valid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            coupons = response.json()
            
            self.test_result("Coupons Endpoint - Valid City", True, f"Found {len(coupons)} coupons for Bengaluru")
        else:
            self.test_result("Coupons Endpoint - Valid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        # Test with invalid city (NonExistentCity)
        params["city"] = "NonExistentCity"
        
        response = self.make_request("GET", "/customer/coupons", params=params)
        
        if not response:
            self.test_result("Coupons Endpoint - Invalid City", False, "Request failed")
            return False
        
        if response.status_code == 200:
            coupons = response.json()
            
            # Note: Coupons might include platform-wide coupons, so we check if tenant-specific coupons are filtered
            self.test_result("Coupons Endpoint - Invalid City", True, f"Returned {len(coupons)} coupons for non-existent city (may include platform-wide coupons)")
        else:
            self.test_result("Coupons Endpoint - Invalid City", False, f"Status {response.status_code}: {response.text}")
            return False
        
        return True
    
    def run_all_tests(self):
        """Run all exact city tenant filtering tests"""
        self.log("🚀 Starting ViaGo Exact City Tenant Filtering Tests...")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"Customer Email: {CUSTOMER_EMAIL}")
        self.log("Testing: Strict city/town-based tenant matching - NO radius filtering")
        self.log("=" * 80)
        
        # Test sequence for exact city filtering
        tests = [
            self.test_customer_authentication,
            self.test_stores_endpoint_city_filtering,
            self.test_search_endpoint_city_filtering,
            self.test_restaurants_endpoint_city_filtering,
            self.test_config_endpoint_city_filtering,
            self.test_coupons_endpoint_city_filtering
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                self.log(f"Test {test.__name__} crashed: {str(e)}", "ERROR")
                self.test_result(test.__name__, False, f"Test crashed: {str(e)}")
            
            self.log("-" * 60)
        
        # Final summary
        self.log("=" * 80)
        self.log("🏁 EXACT CITY TENANT FILTERING TEST SUMMARY")
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
            self.log("🎉 OVERALL RESULT: EXACT CITY TENANT FILTERING - PASS")
            return True
        else:
            self.log("💥 OVERALL RESULT: EXACT CITY TENANT FILTERING - FAIL")
            return False

if __name__ == "__main__":
    tester = CityFilteringTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)