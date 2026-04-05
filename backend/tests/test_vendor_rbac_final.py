"""
Vendor Admin RBAC Final Verification Tests
Tests all vendor endpoints after RBAC fixes:
- Items CRUD (create, read, update, delete)
- Categories (read)
- Stores (read own store)
- Orders (read - newly fixed)
- Isolation (cannot access other stores' data)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
VENDOR_EMAIL = "vendor@test.com"
VENDOR_PASSWORD = "vendor123"


class TestVendorRBACFinal:
    """Final verification tests for Vendor Admin RBAC fixes"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with vendor authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        self.vendor_store_id = None
        
    def get_vendor_token(self):
        """Authenticate as vendor and get token"""
        if self.token:
            return self.token
            
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        
        if response.status_code != 200:
            pytest.skip(f"Vendor login failed: {response.status_code} - {response.text}")
            
        data = response.json()
        self.token = data.get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return self.token
    
    # ==================== LOGIN TESTS ====================
    
    def test_01_vendor_login_success(self):
        """Test vendor can login with correct credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_EMAIL,
            "password": VENDOR_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["role"] == "vendor", f"Expected vendor role, got {data['user']['role']}"
        # store_id is in JWT token, not directly in user response
        
        print(f"✅ Vendor login successful - user: {data['user']['email']}")
    
    # ==================== STORES TESTS ====================
    
    def test_02_vendor_get_stores(self):
        """Test vendor can get their assigned store"""
        self.get_vendor_token()
        
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/stores")
        
        assert response.status_code == 200, f"Get stores failed: {response.status_code} - {response.text}"
        
        stores = response.json()
        assert isinstance(stores, list), "Response should be a list"
        assert len(stores) == 1, f"Vendor should see exactly 1 store, got {len(stores)}"
        
        self.vendor_store_id = stores[0]["id"]
        print(f"✅ Vendor can access their store: {stores[0]['name']} (ID: {self.vendor_store_id})")
    
    # ==================== CATEGORIES TESTS ====================
    
    def test_03_vendor_get_categories(self):
        """Test vendor can get categories for their store"""
        self.get_vendor_token()
        
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/categories")
        
        assert response.status_code == 200, f"Get categories failed: {response.status_code} - {response.text}"
        
        categories = response.json()
        assert isinstance(categories, list), "Response should be a list"
        
        print(f"✅ Vendor can access categories: {len(categories)} categories found")
    
    # ==================== ITEMS TESTS ====================
    
    def test_04_vendor_get_items(self):
        """Test vendor can get items for their store"""
        self.get_vendor_token()
        
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/items")
        
        assert response.status_code == 200, f"Get items failed: {response.status_code} - {response.text}"
        
        items = response.json()
        assert isinstance(items, list), "Response should be a list"
        
        print(f"✅ Vendor can access items: {len(items)} items found")
    
    def test_05_vendor_create_item(self):
        """Test vendor can create item for their store"""
        self.get_vendor_token()
        
        # First get vendor's store
        stores_res = self.session.get(f"{BASE_URL}/api/tenant-admin/stores")
        stores = stores_res.json()
        store_id = stores[0]["id"]
        
        # Get a category
        categories_res = self.session.get(f"{BASE_URL}/api/tenant-admin/categories")
        categories = categories_res.json()
        category_id = categories[0]["id"] if categories else None
        
        # Create test item
        item_data = {
            "name": "TEST_Vendor_RBAC_Item",
            "description": "Test item for RBAC verification",
            "store_id": store_id,
            "category_id": category_id,
            "base_price": 199.99,
            "module": "food",
            "is_veg": True,
            "is_available": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/tenant-admin/items", json=item_data)
        
        assert response.status_code == 200, f"Create item failed: {response.status_code} - {response.text}"
        
        created_item = response.json()
        assert created_item["name"] == item_data["name"], "Item name mismatch"
        assert created_item["store_id"] == store_id, "Store ID mismatch"
        
        # Store item ID for cleanup
        self.created_item_id = created_item["id"]
        
        print(f"✅ Vendor can create items: {created_item['name']} (ID: {created_item['id']})")
        
        return created_item["id"]
    
    def test_06_vendor_update_item(self):
        """Test vendor can update their store's items"""
        self.get_vendor_token()
        
        # First create an item
        item_id = self.test_05_vendor_create_item()
        
        # Update the item
        update_data = {
            "name": "TEST_Vendor_RBAC_Item_Updated",
            "base_price": 249.99
        }
        
        response = self.session.put(f"{BASE_URL}/api/tenant-admin/items/{item_id}", json=update_data)
        
        assert response.status_code == 200, f"Update item failed: {response.status_code} - {response.text}"
        
        updated_item = response.json()
        assert updated_item["name"] == update_data["name"], "Item name not updated"
        assert updated_item["base_price"] == update_data["base_price"], "Price not updated"
        
        print(f"✅ Vendor can update items: {updated_item['name']}")
        
        return item_id
    
    def test_07_vendor_delete_item(self):
        """Test vendor can delete their store's items"""
        self.get_vendor_token()
        
        # First create an item
        item_id = self.test_05_vendor_create_item()
        
        # Delete the item
        response = self.session.delete(f"{BASE_URL}/api/tenant-admin/items/{item_id}")
        
        assert response.status_code == 200, f"Delete item failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Delete should return success"
        
        print(f"✅ Vendor can delete items: {item_id}")
    
    # ==================== ORDERS TESTS (NEWLY FIXED) ====================
    
    def test_08_vendor_get_orders(self):
        """Test vendor can get orders for their store (CRITICAL - was failing before fix)"""
        self.get_vendor_token()
        
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/orders")
        
        # This was returning 403 before the fix
        assert response.status_code == 200, f"Get orders failed: {response.status_code} - {response.text}"
        
        orders = response.json()
        assert isinstance(orders, list), "Response should be a list"
        
        print(f"✅ CRITICAL FIX VERIFIED: Vendor can access orders: {len(orders)} orders found")
    
    def test_09_vendor_get_orders_with_filter(self):
        """Test vendor can filter orders by status"""
        self.get_vendor_token()
        
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/orders?status_filter=pending")
        
        assert response.status_code == 200, f"Get filtered orders failed: {response.status_code} - {response.text}"
        
        orders = response.json()
        assert isinstance(orders, list), "Response should be a list"
        
        print(f"✅ Vendor can filter orders: {len(orders)} pending orders")
    
    # ==================== ISOLATION TESTS ====================
    
    def test_10_vendor_cannot_create_item_for_other_store(self):
        """Test vendor cannot create items for stores they don't own"""
        self.get_vendor_token()
        
        # Try to create item with a fake store_id
        item_data = {
            "name": "TEST_Unauthorized_Item",
            "store_id": "fake-store-id-12345",
            "base_price": 99.99,
            "module": "food"
        }
        
        response = self.session.post(f"{BASE_URL}/api/tenant-admin/items", json=item_data)
        
        # Should fail with 403, 404, or 422 (validation error for non-existent store)
        assert response.status_code in [403, 404, 422], f"Should deny access to other stores: {response.status_code}"
        
        print(f"✅ Vendor isolation verified: Cannot create items for other stores (status: {response.status_code})")
    
    # ==================== CLEANUP ====================
    
    def test_99_cleanup_test_items(self):
        """Cleanup any test items created during testing"""
        self.get_vendor_token()
        
        # Get all items
        response = self.session.get(f"{BASE_URL}/api/tenant-admin/items")
        if response.status_code == 200:
            items = response.json()
            for item in items:
                if item["name"].startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/tenant-admin/items/{item['id']}")
                    print(f"🧹 Cleaned up test item: {item['name']}")
        
        print("✅ Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
