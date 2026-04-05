"""
End-to-End Order Lifecycle Tests for HyperServe
Tests the complete flow:
1. Customer places order
2. Order appears in Admin panel
3. Delivery Partner accepts order
4. Delivery Partner completes order
5. Verify all status updates work correctly
"""

import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://hyperserve-food-mvp.preview.emergentagent.com')

# Test credentials from test_credentials.md
SUPER_ADMIN_EMAIL = "admin@hyperserve.com"
SUPER_ADMIN_PASSWORD = "admin123"
TENANT_ADMIN_EMAIL = "groceryadmin@test.com"
TENANT_ADMIN_PASSWORD = "grocery123"
VENDOR_ADMIN_EMAIL = "vendor@test.com"
VENDOR_ADMIN_PASSWORD = "vendor123"

# Delivery partner credentials
DELIVERY_PARTNER_EMAIL = "passlogin@example.com"
DELIVERY_PARTNER_PASSWORD = "newpassword456"

# Test data prefix for cleanup
TEST_PREFIX = "TEST_ORDER_"


class TestOrderLifecycleE2E:
    """End-to-end order lifecycle tests - runs as a single flow"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def tenant_admin_token(self, api_client):
        """Get tenant admin token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Tenant admin login failed: {response.text}")
    
    @pytest.fixture(scope="class")
    def delivery_partner_token(self, api_client):
        """Get delivery partner token"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": DELIVERY_PARTNER_EMAIL,
            "password": DELIVERY_PARTNER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Delivery partner login failed: {response.text}")
    
    @pytest.fixture(scope="class")
    def test_data(self, api_client, tenant_admin_token):
        """Setup test data - store, item, customer, address"""
        # Get store
        stores_response = api_client.get(
            f"{BASE_URL}/api/tenant-admin/stores",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        stores = stores_response.json()
        if not stores:
            pytest.skip("No stores found")
        
        store = stores[0]
        
        # Ensure store has coordinates
        if not store.get("lat") or not store.get("lng"):
            api_client.put(
                f"{BASE_URL}/api/tenant-admin/stores/{store['id']}",
                json={"lat": 19.0760, "lng": 72.8777},
                headers={"Authorization": f"Bearer {tenant_admin_token}"}
            )
        
        # Get items
        items_response = api_client.get(
            f"{BASE_URL}/api/tenant-admin/items?store_id={store['id']}",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        items = items_response.json()
        if not items:
            pytest.skip("No items found")
        
        item = items[0]
        
        # Create customer via OTP
        test_email = f"order_e2e_test_{int(time.time())}@test.com"
        
        otp_response = api_client.post(f"{BASE_URL}/api/auth/send-otp", json={
            "email": test_email,
            "role": "customer"
        })
        
        if otp_response.status_code != 200:
            pytest.skip(f"Could not send OTP: {otp_response.text}")
        
        otp = otp_response.json().get("otp")
        if not otp:
            pytest.skip("OTP not returned")
        
        # Verify OTP
        verify_response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "email": test_email,
            "otp": otp,
            "role": "customer",
            "name": f"{TEST_PREFIX}E2E Customer"
        })
        
        if verify_response.status_code != 200:
            pytest.skip(f"Could not verify OTP: {verify_response.text}")
        
        customer_data = verify_response.json()
        customer_token = customer_data.get("access_token")
        
        # Create address
        address_response = api_client.post(
            f"{BASE_URL}/api/customer/addresses",
            json={
                "address_type": "home",
                "address_line": f"{TEST_PREFIX}123 E2E Test Street",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001",
                "lat": 19.0760,
                "lng": 72.8777,
                "is_default": True
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        if address_response.status_code != 200:
            pytest.skip(f"Could not create address: {address_response.text}")
        
        address = address_response.json()
        
        return {
            "store": store,
            "item": item,
            "customer_token": customer_token,
            "customer_email": test_email,
            "address": address
        }
    
    def test_01_complete_order_lifecycle(self, api_client, tenant_admin_token, delivery_partner_token, test_data):
        """Test complete order lifecycle from placement to delivery"""
        
        # ==================== STEP 1: Customer places order ====================
        print("\n=== STEP 1: Customer places order ===")
        
        order_response = api_client.post(
            f"{BASE_URL}/api/customer/orders",
            json={
                "store_id": test_data["store"]["id"],
                "delivery_address_id": test_data["address"]["id"],
                "items": [{"item_id": test_data["item"]["id"], "quantity": 1}],
                "payment_method": "cod",
                "delivery_type": "instant",
                "special_instructions": f"{TEST_PREFIX}E2E Test Order"
            },
            headers={"Authorization": f"Bearer {test_data['customer_token']}"}
        )
        
        assert order_response.status_code == 200, f"Place order failed: {order_response.text}"
        order_result = order_response.json()
        assert order_result.get("success") == True
        assert "order_id" in order_result
        
        order_id = order_result["order_id"]
        order_number = order_result.get("order_number")
        print(f"Order placed: {order_number} (ID: {order_id})")
        
        # ==================== STEP 2: Admin sees order ====================
        print("\n=== STEP 2: Admin sees order ===")
        
        orders_response = api_client.get(
            f"{BASE_URL}/api/tenant-admin/orders",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert orders_response.status_code == 200
        orders = orders_response.json()
        test_order = next((o for o in orders if o["id"] == order_id), None)
        assert test_order is not None, f"Order {order_id} not found in admin orders"
        assert test_order["status"] == "placed"
        print(f"Admin sees order with status: {test_order['status']}")
        
        # ==================== STEP 3: Admin confirms order ====================
        print("\n=== STEP 3: Admin confirms order ===")
        
        confirm_response = api_client.put(
            f"{BASE_URL}/api/tenant-admin/orders/{order_id}/status?status=confirmed",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert confirm_response.status_code == 200
        print("Order confirmed")
        
        # ==================== STEP 4: Admin marks preparing ====================
        print("\n=== STEP 4: Admin marks preparing ===")
        
        preparing_response = api_client.put(
            f"{BASE_URL}/api/tenant-admin/orders/{order_id}/status?status=preparing",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert preparing_response.status_code == 200
        print("Order marked as preparing")
        
        # ==================== STEP 5: Admin marks ready ====================
        print("\n=== STEP 5: Admin marks ready ===")
        
        ready_response = api_client.put(
            f"{BASE_URL}/api/tenant-admin/orders/{order_id}/status?status=ready",
            headers={"Authorization": f"Bearer {tenant_admin_token}"}
        )
        
        assert ready_response.status_code == 200
        print("Order marked as ready for pickup")
        
        # ==================== STEP 6: Delivery partner sees available order ====================
        print("\n=== STEP 6: Delivery partner sees available order ===")
        
        available_response = api_client.get(
            f"{BASE_URL}/api/delivery/available?lat=19.0760&lng=72.8777&radius_km=50",
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert available_response.status_code == 200
        available_data = available_response.json()
        available_order = next((d for d in available_data.get("deliveries", []) if d["id"] == order_id), None)
        assert available_order is not None, f"Order {order_id} not found in available deliveries"
        print(f"Delivery partner sees order: {available_order['order_number']}")
        
        # ==================== STEP 7: Delivery partner accepts order ====================
        print("\n=== STEP 7: Delivery partner accepts order ===")
        
        accept_response = api_client.post(
            f"{BASE_URL}/api/delivery/accept/{order_id}",
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert accept_response.status_code == 200
        print("Delivery partner accepted order")
        
        # ==================== STEP 8: Delivery partner picks up order ====================
        print("\n=== STEP 8: Delivery partner picks up order ===")
        
        pickup_response = api_client.put(
            f"{BASE_URL}/api/delivery/status/{order_id}",
            json={"status": "picked_up"},
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert pickup_response.status_code == 200
        print("Order picked up")
        
        # ==================== STEP 9: Delivery partner out for delivery ====================
        print("\n=== STEP 9: Delivery partner out for delivery ===")
        
        ofd_response = api_client.put(
            f"{BASE_URL}/api/delivery/status/{order_id}",
            json={"status": "out_for_delivery"},
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert ofd_response.status_code == 200
        print("Order out for delivery")
        
        # ==================== STEP 10: Delivery partner delivers order ====================
        print("\n=== STEP 10: Delivery partner delivers order ===")
        
        deliver_response = api_client.put(
            f"{BASE_URL}/api/delivery/status/{order_id}",
            json={"status": "delivered"},
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert deliver_response.status_code == 200
        print("Order delivered")
        
        # ==================== STEP 11: Customer sees completed order ====================
        print("\n=== STEP 11: Customer sees completed order ===")
        
        customer_orders_response = api_client.get(
            f"{BASE_URL}/api/customer/orders",
            headers={"Authorization": f"Bearer {test_data['customer_token']}"}
        )
        
        assert customer_orders_response.status_code == 200
        customer_orders = customer_orders_response.json()
        completed_order = next((o for o in customer_orders if o["id"] == order_id), None)
        assert completed_order is not None
        assert completed_order["status"] == "delivered"
        print(f"Customer sees completed order with status: {completed_order['status']}")
        
        # ==================== STEP 12: Verify delivery partner history ====================
        print("\n=== STEP 12: Verify delivery partner history ===")
        
        history_response = api_client.get(
            f"{BASE_URL}/api/delivery/history",
            headers={"Authorization": f"Bearer {delivery_partner_token}"}
        )
        
        assert history_response.status_code == 200
        history_data = history_response.json()
        delivered_order = next((d for d in history_data.get("deliveries", []) if d["id"] == order_id), None)
        assert delivered_order is not None
        print(f"Delivery partner history shows order: {delivered_order['order_number']}")
        
        print("\n=== ORDER LIFECYCLE TEST COMPLETE ===")
        print(f"Order {order_number} successfully went through all stages:")
        print("placed -> confirmed -> preparing -> ready -> accepted -> picked_up -> out_for_delivery -> delivered")


class TestOrderAPIs:
    """Standalone API tests for order-related endpoints"""
    
    @pytest.fixture(scope="class")
    def api_client(self):
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    def test_health_check(self, api_client):
        """Test API health"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("PASS: API health check")
    
    def test_super_admin_login(self, api_client):
        """Test super admin can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "super_admin"
        print("PASS: Super admin login")
    
    def test_tenant_admin_login(self, api_client):
        """Test tenant admin can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "tenant_admin"
        print("PASS: Tenant admin login")
    
    def test_vendor_admin_login(self, api_client):
        """Test vendor admin can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": VENDOR_ADMIN_EMAIL,
            "password": VENDOR_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "vendor"
        print("PASS: Vendor admin login")
    
    def test_delivery_partner_login(self, api_client):
        """Test delivery partner can login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": DELIVERY_PARTNER_EMAIL,
            "password": DELIVERY_PARTNER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "delivery_partner"
        print("PASS: Delivery partner login")
    
    def test_customer_config(self, api_client):
        """Test customer config endpoint"""
        response = api_client.get(f"{BASE_URL}/api/customer/config?lat=12.9716&lng=77.5946")
        assert response.status_code == 200
        data = response.json()
        assert "app_name" in data
        print(f"PASS: Customer config - modules: {data.get('available_modules')}")
    
    def test_customer_stores_public(self, api_client):
        """Test public store discovery"""
        response = api_client.get(f"{BASE_URL}/api/customer/stores?lat=12.9716&lng=77.5946")
        assert response.status_code == 200
        data = response.json()
        print(f"PASS: Public store discovery - found {data.get('total', 0)} stores")
    
    def test_tenant_admin_stores(self, api_client):
        """Test tenant admin can see stores"""
        # Login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = login_response.json().get("access_token")
        
        # Get stores
        response = api_client.get(
            f"{BASE_URL}/api/tenant-admin/stores",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        stores = response.json()
        assert len(stores) > 0
        print(f"PASS: Tenant admin sees {len(stores)} stores")
    
    def test_tenant_admin_orders(self, api_client):
        """Test tenant admin can see orders"""
        # Login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = login_response.json().get("access_token")
        
        # Get orders
        response = api_client.get(
            f"{BASE_URL}/api/tenant-admin/orders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        orders = response.json()
        print(f"PASS: Tenant admin sees {len(orders)} orders")
    
    def test_delivery_partner_profile(self, api_client):
        """Test delivery partner can see profile"""
        # Login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "username": DELIVERY_PARTNER_EMAIL,
            "password": DELIVERY_PARTNER_PASSWORD
        })
        token = login_response.json().get("access_token")
        
        # Get profile
        response = api_client.get(
            f"{BASE_URL}/api/delivery/profile",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        profile = response.json()
        assert profile["role"] == "delivery_partner"
        print(f"PASS: Delivery partner profile - {profile.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
