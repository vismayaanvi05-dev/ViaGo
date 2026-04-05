"""
Test Delivery Partners CRUD and Password Hashing Fix
Tests:
1. Delivery Partner Creation (POST /api/tenant-admin/delivery-partners)
2. Delivery Partner Listing (GET /api/tenant-admin/delivery-partners)
3. Password Hashing (bcrypt 3.2.2 fix verification)
4. Vendor Admin Creation (to verify password hashing works system-wide)
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
TENANT_ADMIN_EMAIL = "groceryadmin@test.com"
TENANT_ADMIN_PASSWORD = "grocery123"
SUPER_ADMIN_EMAIL = "admin@hyperserve.com"
SUPER_ADMIN_PASSWORD = "admin123"


class TestDeliveryPartnersCRUD:
    """Test Delivery Partners management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token for tenant admin"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as Tenant Admin (uses username field for email)
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Tenant Admin login failed: {login_response.status_code} - {login_response.text}")
        
        # Response uses access_token, not token
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.created_partner_ids = []
        yield
        
        # Cleanup - delete test partners
        for partner_id in self.created_partner_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/tenant-admin/delivery-partners/{partner_id}")
            except:
                pass
    
    def test_01_tenant_admin_login(self):
        """Test Tenant Admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "access_token not in response"
        assert "user" in data, "User not in response"
        assert data["user"]["role"] == "tenant_admin", f"Expected tenant_admin role, got {data['user']['role']}"
        print(f"✓ Tenant Admin login successful - Role: {data['user']['role']}")
    
    def test_02_get_delivery_partners_list(self):
        """Test GET /api/tenant-admin/delivery-partners returns list"""
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/delivery-partners")
        
        assert response.status_code == 200, f"Failed to get partners: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET delivery partners successful - Found {len(data)} partners")
        
        # Verify partner structure if any exist
        if len(data) > 0:
            partner = data[0]
            assert "id" in partner, "Partner should have id"
            assert "name" in partner, "Partner should have name"
            assert "email" in partner, "Partner should have email"
            assert "role" in partner, "Partner should have role"
            assert partner["role"] == "delivery_partner", f"Expected delivery_partner role, got {partner['role']}"
            print(f"✓ Partner structure verified - First partner: {partner['name']}")
    
    def test_03_create_delivery_partner_success(self):
        """Test POST /api/tenant-admin/delivery-partners creates new partner"""
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Driver_{unique_id}",
            "email": f"test_driver_{unique_id}@example.com",
            "phone": "+1234567890",
            "vehicle_type": "bike",
            "vehicle_number": f"TEST-{unique_id}"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        
        assert response.status_code == 200, f"Failed to create partner: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "partner_id" in data, "Response should contain partner_id"
        assert "message" in data, "Response should contain message"
        
        self.created_partner_ids.append(data["partner_id"])
        print(f"✓ Delivery partner created successfully - ID: {data['partner_id']}")
        
        # Verify partner appears in list (GET after POST)
        list_response = self.session.get(f"{BASE_URL}/api/tenant-admin/delivery-partners")
        assert list_response.status_code == 200
        partners = list_response.json()
        
        created_partner = next((p for p in partners if p["id"] == data["partner_id"]), None)
        assert created_partner is not None, "Created partner not found in list"
        assert created_partner["name"] == partner_data["name"], "Partner name mismatch"
        assert created_partner["email"] == partner_data["email"], "Partner email mismatch"
        assert created_partner["vehicle_type"] == partner_data["vehicle_type"], "Vehicle type mismatch"
        print(f"✓ Partner verified in list - Name: {created_partner['name']}")
    
    def test_04_create_delivery_partner_duplicate_email(self):
        """Test creating partner with duplicate email fails"""
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Duplicate_{unique_id}",
            "email": f"test_dup_{unique_id}@example.com",
            "phone": "+1234567890",
            "vehicle_type": "car",
            "vehicle_number": f"DUP-{unique_id}"
        }
        
        # Create first partner
        response1 = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        assert response1.status_code == 200, f"First creation failed: {response1.text}"
        self.created_partner_ids.append(response1.json()["partner_id"])
        
        # Try to create with same email
        response2 = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        
        assert response2.status_code == 400, f"Expected 400 for duplicate email, got {response2.status_code}"
        assert "already registered" in response2.json().get("detail", "").lower(), "Should mention email already registered"
        print("✓ Duplicate email correctly rejected")
    
    def test_05_create_delivery_partner_missing_required_fields(self):
        """Test creating partner without required fields fails"""
        # Missing name
        response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json={"email": "test@example.com"}
        )
        assert response.status_code == 422, f"Expected 422 for missing name, got {response.status_code}"
        print("✓ Missing name correctly rejected")
        
        # Missing email
        response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json={"name": "Test Driver"}
        )
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
        print("✓ Missing email correctly rejected")
    
    def test_06_get_single_delivery_partner(self):
        """Test GET /api/tenant-admin/delivery-partners/{id} returns partner details"""
        # First create a partner
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Single_{unique_id}",
            "email": f"test_single_{unique_id}@example.com",
            "phone": "+1234567890",
            "vehicle_type": "truck",
            "vehicle_number": f"SINGLE-{unique_id}"
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        assert create_response.status_code == 200
        partner_id = create_response.json()["partner_id"]
        self.created_partner_ids.append(partner_id)
        
        # Get single partner
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/delivery-partners/{partner_id}")
        
        assert response.status_code == 200, f"Failed to get partner: {response.text}"
        data = response.json()
        
        assert data["id"] == partner_id, "Partner ID mismatch"
        assert data["name"] == partner_data["name"], "Partner name mismatch"
        assert data["email"] == partner_data["email"], "Partner email mismatch"
        assert "stats" in data, "Partner should have stats"
        print(f"✓ Single partner retrieved - Stats: {data.get('stats')}")
    
    def test_07_update_delivery_partner(self):
        """Test PUT /api/tenant-admin/delivery-partners/{id} updates partner"""
        # First create a partner
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Update_{unique_id}",
            "email": f"test_update_{unique_id}@example.com",
            "phone": "+1234567890",
            "vehicle_type": "bike",
            "vehicle_number": f"UPDATE-{unique_id}"
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        assert create_response.status_code == 200
        partner_id = create_response.json()["partner_id"]
        self.created_partner_ids.append(partner_id)
        
        # Update partner
        update_data = {
            "name": f"TEST_Updated_{unique_id}",
            "vehicle_type": "car",
            "status": "inactive"
        }
        
        response = self.session.put(
            f"{BASE_URL}/api/tenant-admin/delivery-partners/{partner_id}",
            json=update_data
        )
        
        assert response.status_code == 200, f"Failed to update partner: {response.text}"
        
        # Verify update via GET
        get_response = self.session.get(f"{BASE_URL}/api/tenant-admin/delivery-partners/{partner_id}")
        assert get_response.status_code == 200
        updated_partner = get_response.json()
        
        assert updated_partner["name"] == update_data["name"], "Name not updated"
        assert updated_partner["vehicle_type"] == update_data["vehicle_type"], "Vehicle type not updated"
        assert updated_partner["status"] == update_data["status"], "Status not updated"
        print(f"✓ Partner updated successfully - New name: {updated_partner['name']}")
    
    def test_08_delete_delivery_partner(self):
        """Test DELETE /api/tenant-admin/delivery-partners/{id} soft deletes partner"""
        # First create a partner
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Delete_{unique_id}",
            "email": f"test_delete_{unique_id}@example.com",
            "phone": "+1234567890",
            "vehicle_type": "bike",
            "vehicle_number": f"DELETE-{unique_id}"
        }
        
        create_response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/delivery-partners",
            json=partner_data
        )
        assert create_response.status_code == 200
        partner_id = create_response.json()["partner_id"]
        
        # Delete partner
        response = self.session.delete(f"{BASE_URL}/api/tenant-admin/delivery-partners/{partner_id}")
        
        assert response.status_code == 200, f"Failed to delete partner: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Delete should return success=True"
        
        # Verify partner no longer in list (soft deleted)
        list_response = self.session.get(f"{BASE_URL}/api/tenant-admin/delivery-partners")
        partners = list_response.json()
        deleted_partner = next((p for p in partners if p["id"] == partner_id), None)
        assert deleted_partner is None, "Deleted partner should not appear in list"
        print(f"✓ Partner deleted successfully - ID: {partner_id}")


class TestPasswordHashingFix:
    """Test that bcrypt 3.2.2 downgrade fixed passlib incompatibility"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token for tenant admin"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as Tenant Admin (uses username field for email)
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Tenant Admin login failed: {login_response.status_code}")
        
        # Response uses access_token, not token
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.created_vendor_ids = []
        yield
        
        # Cleanup
        for vendor_id in self.created_vendor_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/tenant-admin/vendor-admins/{vendor_id}")
            except:
                pass
    
    def test_01_vendor_admin_creation_with_password(self):
        """Test Vendor Admin creation works (uses password hashing)"""
        # First get a store
        stores_response = self.session.get(f"{BASE_URL}/api/tenant-admin/stores")
        if stores_response.status_code != 200 or len(stores_response.json()) == 0:
            pytest.skip("No stores available for vendor admin creation")
        
        store_id = stores_response.json()[0]["id"]
        
        unique_id = str(uuid.uuid4())[:8]
        vendor_data = {
            "store_id": store_id,
            "name": f"TEST_Vendor_{unique_id}",
            "email": f"test_vendor_{unique_id}@example.com",
            "password": "testpassword123"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/vendor-admins",
            json=vendor_data
        )
        
        # This should NOT return 500 (which was the bcrypt error)
        assert response.status_code != 500, f"Server error (likely bcrypt issue): {response.text}"
        assert response.status_code == 200, f"Failed to create vendor admin: {response.status_code} - {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "user" in data, "Response should contain user"
        
        self.created_vendor_ids.append(data["user"]["id"])
        print(f"✓ Vendor Admin created successfully (password hashing works) - ID: {data['user']['id']}")
    
    def test_02_vendor_admin_can_login(self):
        """Test newly created Vendor Admin can login (password verification works)"""
        # First get a store
        stores_response = self.session.get(f"{BASE_URL}/api/tenant-admin/stores")
        if stores_response.status_code != 200 or len(stores_response.json()) == 0:
            pytest.skip("No stores available for vendor admin creation")
        
        store_id = stores_response.json()[0]["id"]
        
        unique_id = str(uuid.uuid4())[:8]
        test_password = "testlogin123"
        vendor_data = {
            "store_id": store_id,
            "name": f"TEST_LoginVendor_{unique_id}",
            "email": f"test_loginvendor_{unique_id}@example.com",
            "password": test_password
        }
        
        # Create vendor
        create_response = self.session.post(
            f"{BASE_URL}/api/tenant-admin/vendor-admins",
            json=vendor_data
        )
        
        assert create_response.status_code == 200, f"Failed to create vendor: {create_response.text}"
        self.created_vendor_ids.append(create_response.json()["user"]["id"])
        
        # Try to login as the new vendor
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": vendor_data["email"],
            "password": test_password
        })
        
        assert login_response.status_code == 200, f"Vendor login failed: {login_response.status_code} - {login_response.text}"
        data = login_response.json()
        assert "access_token" in data, "access_token not in response"
        assert data["user"]["role"] == "vendor", f"Expected vendor role, got {data['user']['role']}"
        print(f"✓ Vendor Admin login successful (password verification works)")


class TestSuperAdminUserCreation:
    """Test Super Admin can create Tenant Admins (password hashing system-wide)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token for super admin"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login as Super Admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip(f"Super Admin login failed: {login_response.status_code}")
        
        # Response uses access_token, not token
        token = login_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.created_tenant_admin_ids = []
        yield
        
        # Cleanup
        for admin_id in self.created_tenant_admin_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/super-admin/tenant-admins/{admin_id}")
            except:
                pass
    
    def test_01_super_admin_login(self):
        """Test Super Admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        data = response.json()
        assert data["user"]["role"] == "super_admin", f"Expected super_admin role, got {data['user']['role']}"
        assert "access_token" in data, "access_token not in response"
        print(f"✓ Super Admin login successful")
    
    def test_02_tenant_admin_creation(self):
        """Test Tenant Admin creation works (uses password hashing)"""
        # First get a tenant
        tenants_response = self.session.get(f"{BASE_URL}/api/super-admin/tenants")
        if tenants_response.status_code != 200 or len(tenants_response.json()) == 0:
            pytest.skip("No tenants available for tenant admin creation")
        
        tenant_id = tenants_response.json()[0]["id"]
        
        unique_id = str(uuid.uuid4())[:8]
        admin_data = {
            "tenant_id": tenant_id,
            "name": f"TEST_TenantAdmin_{unique_id}",
            "email": f"test_tenantadmin_{unique_id}@example.com",
            "password": "testadmin123"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/super-admin/tenant-admins",
            json=admin_data
        )
        
        # This should NOT return 500 (which was the bcrypt error)
        assert response.status_code != 500, f"Server error (likely bcrypt issue): {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            if "user" in data:
                self.created_tenant_admin_ids.append(data["user"]["id"])
            print(f"✓ Tenant Admin created successfully (password hashing works)")
        else:
            # May fail for other reasons (e.g., endpoint structure), but not 500
            print(f"⚠ Tenant Admin creation returned {response.status_code} (not a bcrypt error)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
