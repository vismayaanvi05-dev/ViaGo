"""
Test Vendor Admin RBAC - Verify vendor can access Menu Items and Analytics pages
Tests the RBAC fix for vendor role accessing tenant-admin endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
VENDOR_EMAIL = "vendor@test.com"
VENDOR_PASSWORD = "vendor123"
TENANT_ADMIN_EMAIL = "testadmin@test.com"
TENANT_ADMIN_PASSWORD = "test123"

class TestVendorLogin:
    """Test vendor admin login"""
    
    def test_vendor_login_success(self):
        """Vendor should be able to login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        print(f"Vendor login response: {response.status_code}")
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access token in response"
        assert data["user"]["role"] == "vendor", f"Expected vendor role, got {data['user']['role']}"
        assert data["user"]["email"] == VENDOR_EMAIL
        print(f"Vendor user data: {data['user']}")
        return data["access_token"]


class TestVendorMenuItems:
    """Test vendor access to menu items (RBAC fix verification)"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture
    def vendor_headers(self, vendor_token):
        """Get headers with vendor auth"""
        return {"Authorization": f"Bearer {vendor_token}"}
    
    def test_vendor_can_get_stores(self, vendor_headers):
        """Vendor should be able to get their store (filtered by store_id)"""
        response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        print(f"GET /stores response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        stores = response.json()
        assert isinstance(stores, list), "Expected list of stores"
        print(f"Vendor sees {len(stores)} store(s)")
        
        # Vendor should only see their assigned store
        if len(stores) > 0:
            print(f"Store: {stores[0].get('name')} (ID: {stores[0].get('id')})")
        return stores
    
    def test_vendor_can_get_categories(self, vendor_headers):
        """Vendor should be able to get categories for their store"""
        # First get vendor's store
        stores_response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        if stores_response.status_code != 200:
            pytest.skip("Could not get vendor store")
        
        stores = stores_response.json()
        if not stores:
            pytest.skip("No store found for vendor")
        
        store_id = stores[0]["id"]
        
        # Get categories for the store
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/categories",
            params={"store_id": store_id, "module": "food"},
            headers=vendor_headers
        )
        print(f"GET /categories response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        categories = response.json()
        print(f"Vendor sees {len(categories)} categories")
        return categories
    
    def test_vendor_can_get_items(self, vendor_headers):
        """Vendor should be able to get menu items for their store"""
        # First get vendor's store
        stores_response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        if stores_response.status_code != 200:
            pytest.skip("Could not get vendor store")
        
        stores = stores_response.json()
        if not stores:
            pytest.skip("No store found for vendor")
        
        store_id = stores[0]["id"]
        
        # Get items for the store
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/items",
            params={"store_id": store_id, "module": "food"},
            headers=vendor_headers
        )
        print(f"GET /items response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        items = response.json()
        print(f"Vendor sees {len(items)} items")
        for item in items:
            print(f"  - {item.get('name')} (₹{item.get('base_price')})")
        return items
    
    def test_vendor_can_create_item(self, vendor_headers):
        """Vendor should be able to create a menu item for their store"""
        # First get vendor's store
        stores_response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        if stores_response.status_code != 200:
            pytest.skip("Could not get vendor store")
        
        stores = stores_response.json()
        if not stores:
            pytest.skip("No store found for vendor")
        
        store_id = stores[0]["id"]
        
        # Get a category for the item
        categories_response = requests.get(
            f"{BASE_URL}/api/tenant-admin/categories",
            params={"store_id": store_id, "module": "food"},
            headers=vendor_headers
        )
        categories = categories_response.json() if categories_response.status_code == 200 else []
        
        category_id = categories[0]["id"] if categories else None
        
        # Create a test item
        item_data = {
            "name": "TEST_Vendor_Item_12345",
            "description": "Test item created by vendor",
            "store_id": store_id,
            "category_id": category_id,
            "module": "food",
            "base_price": 199.00,
            "is_veg": True,
            "is_available": True,
            "is_featured": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tenant-admin/items",
            json=item_data,
            headers=vendor_headers
        )
        print(f"POST /items response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        created_item = response.json()
        print(f"Created item: {created_item.get('name')} (ID: {created_item.get('id')})")
        
        # Cleanup - delete the test item
        if created_item.get("id"):
            delete_response = requests.delete(
                f"{BASE_URL}/api/tenant-admin/items/{created_item['id']}",
                headers=vendor_headers
            )
            print(f"Cleanup delete response: {delete_response.status_code}")
        
        return created_item
    
    def test_vendor_can_update_item(self, vendor_headers):
        """Vendor should be able to update their store's items"""
        # Get vendor's items
        stores_response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        if stores_response.status_code != 200:
            pytest.skip("Could not get vendor store")
        
        stores = stores_response.json()
        if not stores:
            pytest.skip("No store found for vendor")
        
        store_id = stores[0]["id"]
        
        items_response = requests.get(
            f"{BASE_URL}/api/tenant-admin/items",
            params={"store_id": store_id, "module": "food"},
            headers=vendor_headers
        )
        
        if items_response.status_code != 200:
            pytest.skip("Could not get items")
        
        items = items_response.json()
        if not items:
            pytest.skip("No items to update")
        
        item = items[0]
        original_available = item.get("is_available", True)
        
        # Toggle availability
        response = requests.put(
            f"{BASE_URL}/api/tenant-admin/items/{item['id']}",
            json={"is_available": not original_available},
            headers=vendor_headers
        )
        print(f"PUT /items/{item['id']} response: {response.status_code} - {response.text[:500]}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Restore original state
        requests.put(
            f"{BASE_URL}/api/tenant-admin/items/{item['id']}",
            json={"is_available": original_available},
            headers=vendor_headers
        )
        
        return response.json()


class TestVendorAnalytics:
    """Test vendor access to analytics data (orders endpoint)"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture
    def vendor_headers(self, vendor_token):
        """Get headers with vendor auth"""
        return {"Authorization": f"Bearer {vendor_token}"}
    
    def test_vendor_can_get_orders(self, vendor_headers):
        """Vendor should be able to get orders for their store (for analytics)"""
        # First get vendor's store
        stores_response = requests.get(f"{BASE_URL}/api/tenant-admin/stores", headers=vendor_headers)
        if stores_response.status_code != 200:
            pytest.skip("Could not get vendor store")
        
        stores = stores_response.json()
        if not stores:
            pytest.skip("No store found for vendor")
        
        store_id = stores[0]["id"]
        
        # Get orders for the store
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/orders",
            params={"store_id": store_id},
            headers=vendor_headers
        )
        print(f"GET /orders response: {response.status_code} - {response.text[:500]}")
        
        # This test documents the current behavior - may fail if RBAC not updated for orders
        if response.status_code == 403:
            pytest.fail("RBAC NOT FIXED: Vendor cannot access orders endpoint - Analytics page will fail")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        orders = response.json()
        print(f"Vendor sees {len(orders)} orders")
        return orders


class TestVendorIsolation:
    """Test that vendor cannot see other stores' data"""
    
    @pytest.fixture
    def vendor_token(self):
        """Get vendor auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.text}")
        return response.json()["access_token"]
    
    @pytest.fixture
    def vendor_headers(self, vendor_token):
        """Get headers with vendor auth"""
        return {"Authorization": f"Bearer {vendor_token}"}
    
    @pytest.fixture
    def tenant_admin_headers(self):
        """Get tenant admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Tenant admin login failed: {response.text}")
        return {"Authorization": f"Bearer {response.json()['access_token']}"}
    
    def test_vendor_only_sees_own_store(self, vendor_headers, tenant_admin_headers):
        """Vendor should only see their assigned store, not all tenant stores"""
        # Get all stores as tenant admin
        tenant_stores_response = requests.get(
            f"{BASE_URL}/api/tenant-admin/stores",
            headers=tenant_admin_headers
        )
        
        if tenant_stores_response.status_code != 200:
            pytest.skip("Could not get tenant stores")
        
        tenant_stores = tenant_stores_response.json()
        print(f"Tenant admin sees {len(tenant_stores)} stores")
        
        # Get stores as vendor
        vendor_stores_response = requests.get(
            f"{BASE_URL}/api/tenant-admin/stores",
            headers=vendor_headers
        )
        
        assert vendor_stores_response.status_code == 200
        vendor_stores = vendor_stores_response.json()
        print(f"Vendor sees {len(vendor_stores)} stores")
        
        # Vendor should see fewer or equal stores (ideally just 1)
        assert len(vendor_stores) <= len(tenant_stores), "Vendor sees more stores than tenant admin"
        
        # If tenant has multiple stores, vendor should only see 1
        if len(tenant_stores) > 1:
            assert len(vendor_stores) == 1, f"Vendor should see only 1 store, but sees {len(vendor_stores)}"
            print(f"PASS: Vendor correctly sees only their store: {vendor_stores[0].get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
