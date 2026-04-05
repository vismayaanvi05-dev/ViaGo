#!/usr/bin/env python3
"""
ViaGo Updated Authentication Testing Script
Tests the new authentication flows:
- Customer: OTP Authentication (self-signup)
- Driver: Password Authentication (admin-created accounts)
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test data
CUSTOMER_EMAIL = "newcustomer@test.com"
DRIVER_EMAIL = "driver2@test.com"
DRIVER_PASSWORD = "pass123"

# Global variables
customer_token = None
driver_token = None
created_driver_id = None

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
            response = requests.get(url, headers=headers, params=params, timeout=60)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, params=params, timeout=60)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, params=params, timeout=60)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, params=params, timeout=60)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def test_customer_otp_flow():
    """Test 1: Customer OTP Authentication Flow"""
    global customer_token
    print("🔍 Testing Customer OTP Authentication Flow...")
    
    # Step 1: Send OTP for customer
    otp_data = {
        "email": CUSTOMER_EMAIL,
        "role": "customer"
    }
    
    response = make_request("POST", "/auth/send-otp", otp_data)
    if not response or response.status_code != 200:
        print_test_result("Customer Send OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        if response:
            print(f"    Response: {response.text}")
        return False
    
    otp_response = response.json()
    if not otp_response.get("success"):
        print_test_result("Customer Send OTP", False, f"OTP send failed: {otp_response}")
        return False
    
    otp = otp_response.get("otp")
    print_test_result("Customer Send OTP", True, f"OTP received: {otp}")
    
    # Step 2: Verify OTP for customer
    verify_data = {
        "email": CUSTOMER_EMAIL,
        "otp": otp,
        "role": "customer",
        "name": "New Customer"
    }
    
    response = make_request("POST", "/auth/verify-otp", verify_data)
    if not response or response.status_code != 200:
        print_test_result("Customer Verify OTP", False, f"HTTP {response.status_code if response else 'No response'}")
        if response:
            print(f"    Response: {response.text}")
        return False
    
    verify_response = response.json()
    customer_token = verify_response.get("access_token")
    if customer_token:
        print_test_result("Customer Verify OTP", True, f"Customer access token received: {customer_token[:20]}...")
        return True
    else:
        print_test_result("Customer Verify OTP", False, f"No token in response: {verify_response}")
        return False

def test_driver_creation():
    """Test 2: Admin Driver Creation"""
    global created_driver_id
    print("🔍 Testing Admin Driver Creation...")
    
    # Create a new driver via admin API
    driver_data = {
        "name": "Driver Two",
        "email": DRIVER_EMAIL,
        "password": DRIVER_PASSWORD,
        "vehicle_type": "Bike"
    }
    
    response = make_request("POST", "/auth/admin/drivers", driver_data)
    if not response or response.status_code != 200:
        print_test_result("Create Driver", False, f"HTTP {response.status_code if response else 'No response'}")
        if response:
            print(f"    Response: {response.text}")
        return False
    
    create_response = response.json()
    if create_response.get("success"):
        created_driver_id = create_response.get("driver", {}).get("id")
        print_test_result("Create Driver", True, f"Driver created: {create_response.get('driver', {}).get('name')}, ID: {created_driver_id}")
        return True
    else:
        print_test_result("Create Driver", False, f"Driver creation failed: {create_response}")
        return False

def test_driver_password_login():
    """Test 3: Driver Password Authentication Flow"""
    global driver_token
    print("🔍 Testing Driver Password Authentication Flow...")
    
    # Login with driver credentials
    login_data = {
        "email": DRIVER_EMAIL,
        "password": DRIVER_PASSWORD
    }
    
    response = make_request("POST", "/auth/driver/login", login_data)
    if not response or response.status_code != 200:
        print_test_result("Driver Login", False, f"HTTP {response.status_code if response else 'No response'}")
        if response:
            print(f"    Response: {response.text}")
        return False
    
    login_response = response.json()
    driver_token = login_response.get("access_token")
    if driver_token:
        print_test_result("Driver Login", True, f"Driver access token received: {driver_token[:20]}...")
        return True
    else:
        print_test_result("Driver Login", False, f"No token in response: {login_response}")
        return False

def test_admin_driver_management():
    """Test 4: Admin Driver Management APIs"""
    print("🔍 Testing Admin Driver Management...")
    
    # Test 4a: List all drivers
    response = make_request("GET", "/auth/admin/drivers")
    if not response or response.status_code != 200:
        print_test_result("List Drivers", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    drivers_response = response.json()
    drivers = drivers_response.get("drivers", [])
    print_test_result("List Drivers", True, f"Found {len(drivers)} drivers")
    
    if not created_driver_id:
        print_test_result("Driver Management", False, "No driver ID available for update/delete tests")
        return False
    
    # Test 4b: Update driver status
    update_data = {
        "status": "inactive"
    }
    
    response = make_request("PUT", f"/auth/admin/drivers/{created_driver_id}", update_data)
    if not response or response.status_code != 200:
        print_test_result("Update Driver", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    update_response = response.json()
    if update_response.get("success"):
        print_test_result("Update Driver", True, "Driver status updated to inactive")
    else:
        print_test_result("Update Driver", False, f"Update failed: {update_response}")
        return False
    
    # Test 4c: Soft delete driver
    response = make_request("DELETE", f"/auth/admin/drivers/{created_driver_id}")
    if not response or response.status_code != 200:
        print_test_result("Delete Driver", False, f"HTTP {response.status_code if response else 'No response'}")
        return False
    
    delete_response = response.json()
    if delete_response.get("success"):
        print_test_result("Delete Driver", True, "Driver soft deleted successfully")
        return True
    else:
        print_test_result("Delete Driver", False, f"Delete failed: {delete_response}")
        return False

def test_otp_rejection_for_drivers():
    """Test 5: Verify OTP is NOT allowed for drivers"""
    print("🔍 Testing OTP Rejection for Drivers...")
    
    # Try to send OTP for delivery_partner role - should fail
    otp_data = {
        "email": "test@test.com",
        "role": "delivery_partner"
    }
    
    try:
        response = make_request("POST", "/auth/send-otp", otp_data)
        if response is None:
            print_test_result("OTP Rejection for Drivers", False, "No response received")
            return False
            
        if response.status_code == 400:
            error_response = response.json()
            if "OTP authentication is only available for customers" in error_response.get("detail", ""):
                print_test_result("OTP Rejection for Drivers", True, "Correctly rejected OTP for delivery_partner role")
                return True
            else:
                print_test_result("OTP Rejection for Drivers", False, f"Wrong error message: {error_response}")
                return False
        else:
            print_test_result("OTP Rejection for Drivers", False, f"Expected 400 error, got HTTP {response.status_code}")
            print(f"    Response: {response.text}")
            return False
    except Exception as e:
        print_test_result("OTP Rejection for Drivers", False, f"Exception occurred: {str(e)}")
        return False

def main():
    """Run all authentication tests"""
    print("🚀 Starting ViaGo Updated Authentication Tests")
    print("=" * 60)
    
    test_results = []
    
    # Run all tests in sequence
    test_results.append(("Customer OTP Authentication Flow", test_customer_otp_flow()))
    test_results.append(("Admin Driver Creation", test_driver_creation()))
    test_results.append(("Driver Password Authentication Flow", test_driver_password_login()))
    test_results.append(("Admin Driver Management", test_admin_driver_management()))
    test_results.append(("OTP Rejection for Drivers", test_otp_rejection_for_drivers()))
    
    # Summary
    print("=" * 60)
    print("📊 AUTHENTICATION TEST SUMMARY")
    print("=" * 60)
    
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
        print("\n🎉 All authentication tests passed! Updated auth flows working correctly.")
        print("\n✅ Authentication separation confirmed:")
        print("   - Customers: OTP-based self-signup ✅")
        print("   - Drivers: Password-based login (admin-created) ✅")
        print("   - OTP correctly rejected for drivers ✅")
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")

if __name__ == "__main__":
    main()