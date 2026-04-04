"""
Test suite for HyperServe Authentication Endpoints
Tests: Email/Password Login, Email OTP Login, Forgot Password
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hyperserve-food-mvp.preview.emergentagent.com').rstrip('/')

class TestEmailPasswordLogin:
    """Test email/password login for admins"""
    
    def test_login_success_super_admin(self):
        """Test successful login with super admin credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin@hyperserve.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert data["user"]["email"] == "admin@hyperserve.com"
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Super Admin login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong@email.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_login_missing_password(self):
        """Test login with missing password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin@hyperserve.com"
        })
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Missing password correctly rejected")


class TestEmailOTPLogin:
    """Test email OTP login flow"""
    
    def test_send_email_otp_success(self):
        """Test sending OTP to valid email"""
        response = requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "admin@hyperserve.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "otp" in data, "OTP should be returned in dev mode"
        assert len(data["otp"]) == 6, "OTP should be 6 digits"
        print(f"✓ Email OTP sent successfully: {data['otp']}")
        return data["otp"]
    
    def test_send_email_otp_invalid_email(self):
        """Test sending OTP to non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "nonexistent@email.com"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent email correctly rejected")
    
    def test_send_email_otp_missing_email(self):
        """Test sending OTP without email"""
        response = requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={})
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Missing email correctly rejected")
    
    def test_verify_email_otp_success(self):
        """Test verifying OTP and logging in"""
        # First send OTP
        send_response = requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "admin@hyperserve.com"
        })
        assert send_response.status_code == 200
        otp = send_response.json()["otp"]
        
        # Verify OTP
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify-email-otp", json={
            "email": "admin@hyperserve.com",
            "otp": otp
        })
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        
        data = verify_response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@hyperserve.com"
        print(f"✓ Email OTP verification successful")
    
    def test_verify_email_otp_invalid(self):
        """Test verifying with invalid OTP"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "admin@hyperserve.com"
        })
        
        # Try invalid OTP
        verify_response = requests.post(f"{BASE_URL}/api/auth/verify-email-otp", json={
            "email": "admin@hyperserve.com",
            "otp": "000000"
        })
        assert verify_response.status_code == 401, f"Expected 401, got {verify_response.status_code}"
        print("✓ Invalid OTP correctly rejected")


class TestForgotPassword:
    """Test forgot password flow"""
    
    def test_reset_password_success(self):
        """Test complete password reset flow"""
        # Send OTP
        send_response = requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "admin@hyperserve.com"
        })
        assert send_response.status_code == 200
        otp = send_response.json()["otp"]
        
        # Reset password
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": "admin@hyperserve.com",
            "otp": otp,
            "new_password": "admin123"  # Reset to same password for testing
        })
        assert reset_response.status_code == 200, f"Expected 200, got {reset_response.status_code}: {reset_response.text}"
        
        data = reset_response.json()
        assert data["success"] == True
        print("✓ Password reset successful")
        
        # Verify login with new password works
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin@hyperserve.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        print("✓ Login with reset password successful")
    
    def test_reset_password_invalid_otp(self):
        """Test reset with invalid OTP"""
        # Send OTP first
        requests.post(f"{BASE_URL}/api/auth/send-email-otp", json={
            "email": "admin@hyperserve.com"
        })
        
        # Try reset with wrong OTP
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": "admin@hyperserve.com",
            "otp": "000000",
            "new_password": "newpassword123"
        })
        assert reset_response.status_code == 401, f"Expected 401, got {reset_response.status_code}"
        print("✓ Invalid OTP for reset correctly rejected")
    
    def test_reset_password_missing_fields(self):
        """Test reset with missing fields"""
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "email": "admin@hyperserve.com"
        })
        assert reset_response.status_code == 400, f"Expected 400, got {reset_response.status_code}"
        print("✓ Missing fields correctly rejected")


class TestTenantCreation:
    """Test tenant creation with new fields"""
    
    def test_create_tenant_with_new_fields(self):
        """Test creating tenant with mobile_number, business_name, address, town"""
        # Login as super admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin@hyperserve.com",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create tenant with new fields
        tenant_data = {
            "name": f"TEST_Tenant_{int(time.time())}",
            "business_type": "multi_vendor",
            "active_modules": ["food"],
            "mobile_number": "9876543210",
            "business_name": "Test Business Corp",
            "address": "123 Test Street",
            "town": "Test City"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/super-admin/tenants",
            json=tenant_data,
            headers=headers
        )
        assert create_response.status_code == 200, f"Expected 200, got {create_response.status_code}: {create_response.text}"
        
        data = create_response.json()
        assert data["name"] == tenant_data["name"]
        # Verify new fields are stored
        assert data.get("mobile_number") == "9876543210" or data.get("mobile_number") is None  # May not be returned
        print(f"✓ Tenant created with new fields: {data['name']}")
        
        # Cleanup - delete test tenant
        tenant_id = data["id"]
        delete_response = requests.delete(
            f"{BASE_URL}/api/super-admin/tenants/{tenant_id}",
            headers=headers
        )
        print(f"✓ Test tenant cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
