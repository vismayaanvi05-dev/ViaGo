"""
Comprehensive API Tests for HyperServe Mobile Apps
Tests both Customer App and Delivery Partner App APIs

Customer App Features:
- OTP Authentication
- Store Discovery (Food/Grocery/Laundry modules)
- Store Details & Menu
- Cart Management
- Address Management
- Order Placement & Tracking
- Profile Management

Delivery Partner App Features:
- OTP Authentication
- Available Deliveries (Location-based)
- Accept/Reject Delivery
- Status Updates
- Delivery History
- Earnings
- Profile Management
"""

import pytest
import requests
import os
import time
from datetime import datetime

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for testing
    BASE_URL = "https://hyperserve-food-mvp.preview.emergentagent.com"

# Test coordinates (Bangalore)
TEST_LAT = 12.9716
TEST_LNG = 77.5946

# Test phone numbers
CUSTOMER_PHONE = "+919876543210"
DELIVERY_PHONE = "+919876543211"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_01_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✅ API Health: {data}")


# ==================== CUSTOMER APP API TESTS ====================

class TestCustomerAuth:
    """Customer OTP Authentication Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_01_send_otp_customer(self):
        """Test sending OTP for customer"""
        response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "otp" in data  # OTP returned for testing (MOCKED)
        print(f"✅ Customer OTP sent: {data.get('otp')}")
    
    def test_02_verify_otp_customer_new_user(self):
        """Test OTP verification for new customer"""
        # First send OTP
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": "+919999888877",  # New phone number
            "role": "customer"
        })
        assert send_response.status_code == 200
        otp = send_response.json().get("otp")
        
        # Verify OTP with name (new user registration)
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": "+919999888877",
            "otp": otp,
            "role": "customer",
            "name": "TEST_New_Customer"
        })
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "customer"
        print(f"✅ New customer registered and logged in")
    
    def test_03_verify_otp_invalid(self):
        """Test OTP verification with invalid OTP"""
        # First send OTP
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        assert send_response.status_code == 200
        
        # Try with wrong OTP
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": "000000",  # Wrong OTP
            "role": "customer"
        })
        assert verify_response.status_code == 400
        print(f"✅ Invalid OTP correctly rejected")


class TestCustomerStoreDiscovery:
    """Customer Store Discovery Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.token = token
    
    def test_01_get_app_config(self):
        """Test getting app configuration"""
        response = self.session.get(f"{BASE_URL}/api/customer/config", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG
        })
        assert response.status_code == 200
        data = response.json()
        assert "app_name" in data
        assert "available_modules" in data
        assert isinstance(data["available_modules"], list)
        print(f"✅ App config: {data.get('app_name')}, modules: {data.get('available_modules')}")
    
    def test_02_discover_stores_all(self):
        """Test discovering all stores"""
        response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert "total" in data
        print(f"✅ Found {data.get('total')} stores")
    
    def test_03_discover_stores_food_module(self):
        """Test discovering food stores (restaurants)"""
        response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "module": "food",
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("module") == "food"
        # All returned stores should be restaurants
        for store in data.get("stores", []):
            assert store.get("store_type") == "restaurant"
        print(f"✅ Found {data.get('total')} food stores")
    
    def test_04_discover_stores_grocery_module(self):
        """Test discovering grocery stores"""
        response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "module": "grocery",
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("module") == "grocery"
        print(f"✅ Found {data.get('total')} grocery stores")
    
    def test_05_discover_stores_laundry_module(self):
        """Test discovering laundry stores"""
        response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "module": "laundry",
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("module") == "laundry"
        print(f"✅ Found {data.get('total')} laundry stores")
    
    def test_06_search_stores_and_items(self):
        """Test search functionality"""
        response = self.session.get(f"{BASE_URL}/api/customer/search", params={
            "q": "test",
            "lat": TEST_LAT,
            "lng": TEST_LNG
        })
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert "items" in data
        print(f"✅ Search results: {len(data.get('stores', []))} stores, {len(data.get('items', []))} items")


class TestCustomerStoreDetails:
    """Customer Store Details Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token and find a store"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get a store ID
        stores_response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "module": "food",
            "limit": 1
        })
        stores = stores_response.json().get("stores", [])
        self.store_id = stores[0].get("id") if stores else None
    
    def test_01_get_restaurant_details(self):
        """Test getting restaurant details with menu"""
        if not self.store_id:
            pytest.skip("No restaurant found for testing")
        
        response = self.session.get(f"{BASE_URL}/api/customer/restaurants/{self.store_id}")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        # Should have categories with items
        assert "categories" in data or data.get("store_type") == "restaurant"
        print(f"✅ Restaurant details: {data.get('name')}")
    
    def test_02_get_restaurant_not_found(self):
        """Test getting non-existent restaurant"""
        response = self.session.get(f"{BASE_URL}/api/customer/restaurants/non-existent-id")
        assert response.status_code == 404
        print(f"✅ Non-existent restaurant correctly returns 404")


class TestCustomerCart:
    """Customer Cart Management Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Clear cart first
        self.session.delete(f"{BASE_URL}/api/customer/cart/clear")
        
        # Get a store and item for testing
        stores_response = self.session.get(f"{BASE_URL}/api/customer/stores", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "module": "food",
            "limit": 1
        })
        stores = stores_response.json().get("stores", [])
        self.store_id = stores[0].get("id") if stores else None
        
        # Get items from the store
        if self.store_id:
            restaurant_response = self.session.get(f"{BASE_URL}/api/customer/restaurants/{self.store_id}")
            restaurant = restaurant_response.json()
            categories = restaurant.get("categories", [])
            for cat in categories:
                items = cat.get("items", [])
                if items:
                    self.item_id = items[0].get("id")
                    break
            else:
                self.item_id = None
        else:
            self.item_id = None
    
    def test_01_get_empty_cart(self):
        """Test getting empty cart"""
        response = self.session.get(f"{BASE_URL}/api/customer/cart")
        assert response.status_code == 200
        data = response.json()
        assert data.get("subtotal") == 0 or data.get("cart") is None
        print(f"✅ Empty cart retrieved")
    
    def test_02_add_to_cart(self):
        """Test adding item to cart"""
        if not self.store_id or not self.item_id:
            pytest.skip("No store/item found for testing")
        
        response = self.session.post(f"{BASE_URL}/api/customer/cart/add", json={
            "store_id": self.store_id,
            "item_id": self.item_id,
            "quantity": 2
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Item added to cart")
    
    def test_03_get_cart_with_items(self):
        """Test getting cart with items"""
        if not self.store_id or not self.item_id:
            pytest.skip("No store/item found for testing")
        
        # Add item first
        self.session.post(f"{BASE_URL}/api/customer/cart/add", json={
            "store_id": self.store_id,
            "item_id": self.item_id,
            "quantity": 1
        })
        
        response = self.session.get(f"{BASE_URL}/api/customer/cart")
        assert response.status_code == 200
        data = response.json()
        assert data.get("cart") is not None
        assert data.get("item_count") >= 1
        print(f"✅ Cart with {data.get('item_count')} items, subtotal: {data.get('subtotal')}")
    
    def test_04_update_cart_item(self):
        """Test updating cart item quantity"""
        if not self.store_id or not self.item_id:
            pytest.skip("No store/item found for testing")
        
        # Add item first
        self.session.post(f"{BASE_URL}/api/customer/cart/add", json={
            "store_id": self.store_id,
            "item_id": self.item_id,
            "quantity": 1
        })
        
        response = self.session.put(f"{BASE_URL}/api/customer/cart/update", json={
            "item_id": self.item_id,
            "quantity": 5
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Cart item quantity updated")
    
    def test_05_remove_from_cart(self):
        """Test removing item from cart"""
        if not self.store_id or not self.item_id:
            pytest.skip("No store/item found for testing")
        
        # Add item first
        self.session.post(f"{BASE_URL}/api/customer/cart/add", json={
            "store_id": self.store_id,
            "item_id": self.item_id,
            "quantity": 1
        })
        
        response = self.session.delete(f"{BASE_URL}/api/customer/cart/remove", params={
            "item_id": self.item_id
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Item removed from cart")
    
    def test_06_clear_cart(self):
        """Test clearing entire cart"""
        response = self.session.delete(f"{BASE_URL}/api/customer/cart/clear")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Cart cleared")


class TestCustomerAddresses:
    """Customer Address Management Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.created_address_id = None
    
    def test_01_list_addresses(self):
        """Test listing addresses"""
        response = self.session.get(f"{BASE_URL}/api/customer/addresses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Found {len(data)} addresses")
    
    def test_02_create_address(self):
        """Test creating new address"""
        response = self.session.post(f"{BASE_URL}/api/customer/addresses", json={
            "address_type": "home",
            "address_line": "TEST_123 Test Street",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560001",
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "is_default": False
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        self.created_address_id = data.get("id")
        print(f"✅ Address created: {data.get('id')}")
        return data.get("id")
    
    def test_03_update_address(self):
        """Test updating address"""
        # Create address first
        create_response = self.session.post(f"{BASE_URL}/api/customer/addresses", json={
            "address_type": "work",
            "address_line": "TEST_456 Work Street",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560002",
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "is_default": False
        })
        address_id = create_response.json().get("id")
        
        # Update it
        response = self.session.put(f"{BASE_URL}/api/customer/addresses/{address_id}", json={
            "address_line": "TEST_789 Updated Street"
        })
        assert response.status_code == 200
        data = response.json()
        assert "TEST_789" in data.get("address_line", "")
        print(f"✅ Address updated")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/customer/addresses/{address_id}")
    
    def test_04_delete_address(self):
        """Test deleting address"""
        # Create address first
        create_response = self.session.post(f"{BASE_URL}/api/customer/addresses", json={
            "address_type": "other",
            "address_line": "TEST_To_Delete Street",
            "city": "Bangalore",
            "state": "Karnataka",
            "pincode": "560003",
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "is_default": False
        })
        address_id = create_response.json().get("id")
        
        # Delete it
        response = self.session.delete(f"{BASE_URL}/api/customer/addresses/{address_id}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Address deleted")


class TestCustomerProfile:
    """Customer Profile Management Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_profile(self):
        """Test getting customer profile"""
        response = self.session.get(f"{BASE_URL}/api/customer/profile")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("role") == "customer"
        assert "total_orders" in data
        print(f"✅ Profile: {data.get('name')}, orders: {data.get('total_orders')}")
    
    def test_02_update_profile(self):
        """Test updating customer profile"""
        response = self.session.put(f"{BASE_URL}/api/customer/profile", json={
            "name": "TEST_Updated Customer Name"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Profile updated")


class TestCustomerOrders:
    """Customer Order Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_order_history(self):
        """Test getting order history"""
        response = self.session.get(f"{BASE_URL}/api/customer/orders", params={
            "skip": 0,
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Order history: {len(data)} orders")
    
    def test_02_get_order_details_not_found(self):
        """Test getting non-existent order"""
        response = self.session.get(f"{BASE_URL}/api/customer/orders/non-existent-order-id")
        assert response.status_code == 404
        print(f"✅ Non-existent order correctly returns 404")


class TestCustomerCoupons:
    """Customer Coupon Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get customer auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer",
            "name": "Test Customer"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_available_coupons(self):
        """Test getting available coupons"""
        response = self.session.get(f"{BASE_URL}/api/customer/coupons")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Available coupons: {len(data)}")


# ==================== DELIVERY PARTNER APP API TESTS ====================

class TestDeliveryPartnerAuth:
    """Delivery Partner OTP Authentication Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_01_send_otp_delivery_partner(self):
        """Test sending OTP for delivery partner"""
        response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "otp" in data  # OTP returned for testing (MOCKED)
        print(f"✅ Delivery Partner OTP sent: {data.get('otp')}")
    
    def test_02_verify_otp_delivery_partner(self):
        """Test OTP verification for delivery partner"""
        # First send OTP
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        assert send_response.status_code == 200
        otp = send_response.json().get("otp")
        
        # Verify OTP
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("role") == "delivery_partner"
        print(f"✅ Delivery partner logged in")


class TestDeliveryPartnerProfile:
    """Delivery Partner Profile Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_profile(self):
        """Test getting delivery partner profile"""
        response = self.session.get(f"{BASE_URL}/api/delivery/profile")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data.get("role") == "delivery_partner"
        assert "stats" in data
        print(f"✅ Profile: {data.get('name')}, deliveries: {data.get('stats', {}).get('total_deliveries')}")
    
    def test_02_update_profile(self):
        """Test updating delivery partner profile"""
        response = self.session.put(f"{BASE_URL}/api/delivery/profile", json={
            "vehicle_type": "Bike",
            "vehicle_number": "KA01TEST1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Profile updated with vehicle info")


class TestDeliveryPartnerLocation:
    """Delivery Partner Location Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_update_location(self):
        """Test updating delivery partner location"""
        response = self.session.put(f"{BASE_URL}/api/delivery/location", json={
            "lat": TEST_LAT,
            "lng": TEST_LNG
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Location updated to ({TEST_LAT}, {TEST_LNG})")


class TestDeliveryPartnerAvailableDeliveries:
    """Delivery Partner Available Deliveries Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_available_deliveries(self):
        """Test getting available deliveries"""
        response = self.session.get(f"{BASE_URL}/api/delivery/available", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "radius_km": 10
        })
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        assert "total" in data
        print(f"✅ Available deliveries: {data.get('total')}")
    
    def test_02_get_available_deliveries_food_module(self):
        """Test getting available food deliveries"""
        response = self.session.get(f"{BASE_URL}/api/delivery/available", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "radius_km": 10,
            "module": "food"
        })
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        print(f"✅ Available food deliveries: {data.get('total')}")
    
    def test_03_get_available_deliveries_grocery_module(self):
        """Test getting available grocery deliveries"""
        response = self.session.get(f"{BASE_URL}/api/delivery/available", params={
            "lat": TEST_LAT,
            "lng": TEST_LNG,
            "radius_km": 10,
            "module": "grocery"
        })
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        print(f"✅ Available grocery deliveries: {data.get('total')}")


class TestDeliveryPartnerAssignedDeliveries:
    """Delivery Partner Assigned Deliveries Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_assigned_deliveries(self):
        """Test getting assigned deliveries"""
        response = self.session.get(f"{BASE_URL}/api/delivery/assigned")
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        assert "total" in data
        print(f"✅ Assigned deliveries: {data.get('total')}")


class TestDeliveryPartnerHistory:
    """Delivery Partner History Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_delivery_history(self):
        """Test getting delivery history"""
        response = self.session.get(f"{BASE_URL}/api/delivery/history", params={
            "skip": 0,
            "limit": 20
        })
        assert response.status_code == 200
        data = response.json()
        assert "deliveries" in data
        assert "total" in data
        print(f"✅ Delivery history: {data.get('total')} completed deliveries")


class TestDeliveryPartnerEarnings:
    """Delivery Partner Earnings Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_get_earnings_today(self):
        """Test getting today's earnings"""
        response = self.session.get(f"{BASE_URL}/api/delivery/earnings", params={
            "period": "today"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "today"
        assert "total_earnings" in data
        assert "total_deliveries" in data
        print(f"✅ Today's earnings: ₹{data.get('total_earnings')}, deliveries: {data.get('total_deliveries')}")
    
    def test_02_get_earnings_week(self):
        """Test getting this week's earnings"""
        response = self.session.get(f"{BASE_URL}/api/delivery/earnings", params={
            "period": "week"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "week"
        assert "total_earnings" in data
        print(f"✅ Week's earnings: ₹{data.get('total_earnings')}")
    
    def test_03_get_earnings_month(self):
        """Test getting this month's earnings"""
        response = self.session.get(f"{BASE_URL}/api/delivery/earnings", params={
            "period": "month"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "month"
        assert "total_earnings" in data
        print(f"✅ Month's earnings: ₹{data.get('total_earnings')}")
    
    def test_04_get_earnings_all_time(self):
        """Test getting all-time earnings"""
        response = self.session.get(f"{BASE_URL}/api/delivery/earnings", params={
            "period": "all"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("period") == "all"
        assert "total_earnings" in data
        assert "average_per_delivery" in data
        print(f"✅ All-time earnings: ₹{data.get('total_earnings')}, avg: ₹{data.get('average_per_delivery')}")


class TestDeliveryPartnerAcceptReject:
    """Delivery Partner Accept/Reject Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_accept_non_existent_order(self):
        """Test accepting non-existent order"""
        response = self.session.post(f"{BASE_URL}/api/delivery/accept/non-existent-order-id")
        assert response.status_code == 404
        print(f"✅ Non-existent order correctly returns 404")
    
    def test_02_reject_delivery(self):
        """Test rejecting a delivery"""
        response = self.session.post(f"{BASE_URL}/api/delivery/reject/test-order-id", json={
            "reason": "Too far away"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Delivery rejection recorded")


class TestDeliveryPartnerStatusUpdate:
    """Delivery Partner Status Update Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get delivery partner auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Get auth token
        send_response = self.session.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": DELIVERY_PHONE,
            "role": "delivery_partner"
        })
        otp = send_response.json().get("otp")
        
        verify_response = self.session.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": DELIVERY_PHONE,
            "otp": otp,
            "role": "delivery_partner",
            "name": "TEST_Delivery_Partner"
        })
        token = verify_response.json().get("access_token")
        self.session.headers.update({"Authorization": f"Bearer {token}"})
    
    def test_01_update_status_invalid_order(self):
        """Test updating status for non-assigned order"""
        response = self.session.put(f"{BASE_URL}/api/delivery/status/non-existent-order-id", json={
            "status": "picked_up"
        })
        assert response.status_code == 404
        print(f"✅ Non-assigned order correctly returns 404")
    
    def test_02_update_status_invalid_status(self):
        """Test updating with invalid status"""
        response = self.session.put(f"{BASE_URL}/api/delivery/status/test-order-id", json={
            "status": "invalid_status"
        })
        assert response.status_code in [400, 404]  # 400 for invalid status, 404 if order not found
        print(f"✅ Invalid status correctly rejected")


# ==================== CLEANUP ====================

class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_users(self):
        """Note: Test users with TEST_ prefix should be cleaned up"""
        print("⚠️ Note: Test users created with TEST_ prefix should be cleaned up manually if needed")
        print("✅ Cleanup reminder logged")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
