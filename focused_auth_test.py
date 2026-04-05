#!/usr/bin/env python3
"""
ViaGo Authentication Testing - Focused Test
Tests the specific flows requested in the review
"""

import requests
import json
import time
import uuid

# Configuration
BASE_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

def test_flow(test_name, test_func):
    """Run a test and print results"""
    print(f"\n🔍 {test_name}")
    print("-" * 50)
    try:
        result = test_func()
        if result:
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED")
        return result
    except Exception as e:
        print(f"❌ {test_name} - ERROR: {str(e)}")
        return False

def customer_otp_flow():
    """Test Customer OTP Authentication Flow"""
    email = f"customer{int(time.time())}@test.com"
    
    # Step 1: Send OTP
    print(f"1. Sending OTP to {email}")
    response = requests.post(f"{BASE_URL}/auth/send-otp", 
                           json={"email": email, "role": "customer"}, 
                           timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Send OTP failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    otp = data.get("otp")
    print(f"   ✅ OTP received: {otp}")
    
    # Step 2: Verify OTP
    print("2. Verifying OTP")
    response = requests.post(f"{BASE_URL}/auth/verify-otp", 
                           json={
                               "email": email, 
                               "otp": otp, 
                               "role": "customer", 
                               "name": "New Customer"
                           }, 
                           timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Verify OTP failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    token = data.get("access_token")
    print(f"   ✅ Customer access token received: {token[:20]}...")
    return True

def driver_creation_and_login():
    """Test Driver Creation and Password Login"""
    email = f"driver{int(time.time())}@test.com"
    password = "pass123"
    
    # Step 1: Create driver
    print(f"1. Creating driver with email {email}")
    response = requests.post(f"{BASE_URL}/auth/admin/drivers", 
                           json={
                               "name": "Driver Two", 
                               "email": email, 
                               "password": password, 
                               "vehicle_type": "Bike"
                           }, 
                           timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Create driver failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    driver_id = data.get("driver", {}).get("id")
    print(f"   ✅ Driver created with ID: {driver_id}")
    
    # Step 2: Login with password
    print("2. Logging in with password")
    response = requests.post(f"{BASE_URL}/auth/driver/login", 
                           json={"email": email, "password": password}, 
                           timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Driver login failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    token = data.get("access_token")
    print(f"   ✅ Driver access token received: {token[:20]}...")
    return driver_id

def admin_driver_management(driver_id):
    """Test Admin Driver Management"""
    if not driver_id:
        print("   ❌ No driver ID provided")
        return False
    
    # Step 1: List drivers
    print("1. Listing all drivers")
    response = requests.get(f"{BASE_URL}/auth/admin/drivers", timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ List drivers failed: {response.status_code}")
        return False
    
    data = response.json()
    drivers = data.get("drivers", [])
    print(f"   ✅ Found {len(drivers)} drivers")
    
    # Step 2: Update driver
    print("2. Updating driver status")
    response = requests.put(f"{BASE_URL}/auth/admin/drivers/{driver_id}", 
                          json={"status": "inactive"}, 
                          timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Update driver failed: {response.status_code}")
        return False
    
    print("   ✅ Driver status updated")
    
    # Step 3: Delete driver
    print("3. Soft deleting driver")
    response = requests.delete(f"{BASE_URL}/auth/admin/drivers/{driver_id}", timeout=30)
    
    if response.status_code != 200:
        print(f"   ❌ Delete driver failed: {response.status_code}")
        return False
    
    print("   ✅ Driver soft deleted")
    return True

def otp_rejection_for_drivers():
    """Test OTP rejection for delivery_partner role"""
    print("1. Attempting OTP for delivery_partner role")
    response = requests.post(f"{BASE_URL}/auth/send-otp", 
                           json={"email": "test@test.com", "role": "delivery_partner"}, 
                           timeout=30)
    
    if response.status_code == 400:
        data = response.json()
        if "OTP authentication is only available for customers" in data.get("detail", ""):
            print("   ✅ Correctly rejected OTP for delivery_partner role")
            return True
        else:
            print(f"   ❌ Wrong error message: {data}")
            return False
    else:
        print(f"   ❌ Expected 400 error, got {response.status_code}")
        return False

def main():
    """Run all tests"""
    print("🚀 ViaGo Updated Authentication Testing")
    print("=" * 60)
    
    results = []
    
    # Test 1: Customer OTP Flow
    results.append(test_flow("Customer OTP Authentication Flow", customer_otp_flow))
    
    # Test 2: Driver Creation and Login
    driver_id = None
    def driver_test():
        nonlocal driver_id
        driver_id = driver_creation_and_login()
        return driver_id is not None
    
    results.append(test_flow("Driver Password Authentication Flow", driver_test))
    
    # Test 3: Admin Driver Management
    def admin_test():
        return admin_driver_management(driver_id)
    
    results.append(test_flow("Admin Driver Management", admin_test))
    
    # Test 4: OTP Rejection for Drivers
    results.append(test_flow("OTP Rejection for Drivers", otp_rejection_for_drivers))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    test_names = [
        "Customer OTP Authentication Flow",
        "Driver Password Authentication Flow", 
        "Admin Driver Management",
        "OTP Rejection for Drivers"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {name}")
    
    print(f"\nPassed: {passed}/{total}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("\n🎉 All authentication tests passed!")
        print("\n✅ Authentication separation confirmed:")
        print("   - Customers: OTP-based self-signup ✅")
        print("   - Drivers: Password-based login (admin-created) ✅") 
        print("   - OTP correctly rejected for drivers ✅")
        print("   - Admin driver management working ✅")
    else:
        print(f"\n⚠️  {total-passed} test(s) failed.")

if __name__ == "__main__":
    main()