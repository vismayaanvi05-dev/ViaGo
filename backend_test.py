#!/usr/bin/env python3
"""
ViaGo Backend API Test Suite with Resend Email Integration
Testing email flows for OTP authentication and driver management
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://intelligent-chandrasekhar-2.preview.emergentagent.com/api"

# Test emails
VERIFIED_EMAIL = "flashfood813@gmail.com"  # Verified Resend email
TEST_EMAIL = "test@example.com"  # Non-verified email for fallback testing

class ViaGoEmailTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        
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
    
    def test_otp_email_verified(self):
        """Test 1: OTP Email Sending (Sandbox Mode) with verified email"""
        try:
            payload = {
                "email": VERIFIED_EMAIL,
                "role": "customer"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                email_sent = data.get("email_sent", False)
                has_otp_in_response = "otp" in data
                
                if email_sent and not has_otp_in_response:
                    self.log_test(
                        "OTP Email Sending (Verified Email)", 
                        True, 
                        f"Email sent successfully to {VERIFIED_EMAIL}, OTP not in response (as expected)"
                    )
                    return True, data
                elif not email_sent and has_otp_in_response:
                    self.log_test(
                        "OTP Email Sending (Verified Email)", 
                        False, 
                        f"Email failed to send but OTP shown in response: {data.get('otp')}"
                    )
                    return False, data
                else:
                    self.log_test(
                        "OTP Email Sending (Verified Email)", 
                        False, 
                        f"Unexpected response: email_sent={email_sent}, has_otp={has_otp_in_response}"
                    )
                    return False, data
            else:
                self.log_test(
                    "OTP Email Sending (Verified Email)", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("OTP Email Sending (Verified Email)", False, f"Error: {str(e)}")
            return False, None
    
    def test_otp_email_fallback(self):
        """Test 2: OTP Email Fallback (Non-verified email)"""
        try:
            payload = {
                "email": TEST_EMAIL,
                "role": "customer"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                email_sent = data.get("email_sent", False)
                has_otp_in_response = "otp" in data
                
                if not email_sent and has_otp_in_response:
                    self.log_test(
                        "OTP Email Fallback (Non-verified Email)", 
                        True, 
                        f"Email failed as expected, OTP shown for testing: {data.get('otp')}"
                    )
                    return True, data
                elif email_sent:
                    self.log_test(
                        "OTP Email Fallback (Non-verified Email)", 
                        False, 
                        f"Unexpected: Email sent to non-verified address {TEST_EMAIL}"
                    )
                    return False, data
                else:
                    self.log_test(
                        "OTP Email Fallback (Non-verified Email)", 
                        False, 
                        f"No OTP in response and email_sent={email_sent}"
                    )
                    return False, data
            else:
                self.log_test(
                    "OTP Email Fallback (Non-verified Email)", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("OTP Email Fallback (Non-verified Email)", False, f"Error: {str(e)}")
            return False, None
    
    def test_customer_registration_flow(self):
        """Test 3: Full Customer Registration Flow with Welcome Email"""
        try:
            # Step 1: Send OTP to test email
            otp_payload = {
                "email": TEST_EMAIL,
                "role": "customer"
            }
            
            otp_response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=otp_payload)
            
            if otp_response.status_code != 200:
                self.log_test(
                    "Customer Registration Flow", 
                    False, 
                    f"Failed to send OTP: {otp_response.status_code}"
                )
                return False
            
            otp_data = otp_response.json()
            otp = otp_data.get("otp")
            
            if not otp:
                self.log_test(
                    "Customer Registration Flow", 
                    False, 
                    "No OTP received in response"
                )
                return False
            
            # Step 2: Verify OTP with name (new user registration)
            verify_payload = {
                "email": TEST_EMAIL,
                "otp": otp,
                "name": "John Doe Test"
            }
            
            verify_response = self.session.post(f"{BACKEND_URL}/auth/verify-otp", json=verify_payload)
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                access_token = verify_data.get("access_token")
                user_data = verify_data.get("user")
                
                if access_token and user_data:
                    self.log_test(
                        "Customer Registration Flow", 
                        True, 
                        f"New customer registered successfully. User ID: {user_data.get('id')}, Welcome email should be sent"
                    )
                    return True
                else:
                    self.log_test(
                        "Customer Registration Flow", 
                        False, 
                        f"Missing access_token or user data in response"
                    )
                    return False
            else:
                self.log_test(
                    "Customer Registration Flow", 
                    False, 
                    f"OTP verification failed: {verify_response.status_code}, {verify_response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Customer Registration Flow", False, f"Error: {str(e)}")
            return False
    
    def test_driver_creation_with_email(self):
        """Test 4: Driver Creation with Email Notification"""
        try:
            # Generate unique email for driver
            driver_email = f"driver_{uuid.uuid4().hex[:8]}@test.com"
            driver_password = "testpass123"
            
            payload = {
                "name": "Test Driver",
                "email": driver_email,
                "password": driver_password,
                "phone": "9876543210",
                "vehicle_type": "Bike",
                "vehicle_number": "MH01AB1234"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/admin/drivers", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                email_sent = data.get("email_sent", False)
                driver_data = data.get("driver", {})
                
                if success and driver_data:
                    self.log_test(
                        "Driver Creation with Email", 
                        True, 
                        f"Driver created successfully. ID: {driver_data.get('id')}, Email sent: {email_sent}"
                    )
                    return True, driver_email, driver_password
                else:
                    self.log_test(
                        "Driver Creation with Email", 
                        False, 
                        f"Driver creation failed: success={success}"
                    )
                    return False, None, None
            else:
                self.log_test(
                    "Driver Creation with Email", 
                    False, 
                    f"Status code: {response.status_code}, Response: {response.text}"
                )
                return False, None, None
                
        except Exception as e:
            self.log_test("Driver Creation with Email", False, f"Error: {str(e)}")
            return False, None, None
    
    def test_driver_login(self, email, password):
        """Test 5: Driver Login (unchanged)"""
        try:
            payload = {
                "email": email,
                "password": password
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/driver/login", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access_token")
                user_data = data.get("user")
                
                if access_token and user_data and user_data.get("role") == "delivery_partner":
                    self.log_test(
                        "Driver Login", 
                        True, 
                        f"Driver login successful. User ID: {user_data.get('id')}"
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
    
    def test_role_separation(self):
        """Test role separation - OTP should be rejected for delivery_partner role"""
        try:
            payload = {
                "email": TEST_EMAIL,
                "role": "delivery_partner"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/send-otp", json=payload)
            
            if response.status_code == 400:
                data = response.json()
                detail = data.get("detail", "")
                
                if "OTP authentication is only available for customers" in detail:
                    self.log_test(
                        "Role Separation (OTP Rejection)", 
                        True, 
                        "OTP correctly rejected for delivery_partner role"
                    )
                    return True
                else:
                    self.log_test(
                        "Role Separation (OTP Rejection)", 
                        False, 
                        f"Wrong error message: {detail}"
                    )
                    return False
            else:
                self.log_test(
                    "Role Separation (OTP Rejection)", 
                    False, 
                    f"Expected 400 status, got {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test("Role Separation (OTP Rejection)", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all email integration tests"""
        print("🚀 Starting ViaGo Backend API Email Integration Tests")
        print("=" * 60)
        
        # Test 0: Health check
        if not self.test_health_check():
            print("❌ Health check failed, aborting tests")
            return
        
        # Test 1: OTP Email Sending (Verified Email)
        self.test_otp_email_verified()
        
        # Test 2: OTP Email Fallback (Non-verified Email)
        self.test_otp_email_fallback()
        
        # Test 3: Customer Registration Flow
        self.test_customer_registration_flow()
        
        # Test 4: Driver Creation with Email
        driver_created, driver_email, driver_password = self.test_driver_creation_with_email()
        
        # Test 5: Driver Login (if driver was created)
        if driver_created and driver_email and driver_password:
            self.test_driver_login(driver_email, driver_password)
        
        # Test 6: Role Separation
        self.test_role_separation()
        
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
    tester = ViaGoEmailTester()
    results = tester.run_all_tests()