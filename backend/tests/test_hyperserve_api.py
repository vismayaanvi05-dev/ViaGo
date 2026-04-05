"""
HyperServe API Tests - Multi-tenant SaaS Platform
Tests for: Auth, Customer, Tenant Admin, Super Admin APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
CUSTOMER_PHONE = "9111111111"  # John Doe
TENANT_ADMIN_PHONE = "8888888888"  # Tenant Admin
SUPER_ADMIN_PHONE = "9999999999"  # Super Admin


class TestHealthCheck:
    """Health check tests - run first"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API Health: {data}")
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "HyperServe" in data["message"]
        print(f"✓ API Root: {data}")


class TestAuthFlow:
    """Authentication flow tests - OTP based login"""
    
    def test_send_otp_customer(self):
        """Test sending OTP to customer"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "otp" in data  # OTP returned for testing
        print(f"✓ Send OTP Customer: OTP={data['otp']}")
        return data["otp"]
    
    def test_verify_otp_customer(self):
        """Test verifying OTP and login as customer"""
        # First send OTP
        send_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        otp = send_response.json()["otp"]
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": otp,
            "role": "customer"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["phone"] == CUSTOMER_PHONE
        assert data["user"]["role"] == "customer"
        print(f"✓ Verify OTP Customer: User={data['user']['name']}")
        return data["access_token"]
    
    def test_send_otp_tenant_admin(self):
        """Test sending OTP to tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": TENANT_ADMIN_PHONE,
            "role": "tenant_admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Send OTP Tenant Admin: OTP={data['otp']}")
    
    def test_verify_otp_tenant_admin(self):
        """Test verifying OTP and login as tenant admin"""
        # First send OTP
        send_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": TENANT_ADMIN_PHONE,
            "role": "tenant_admin"
        })
        otp = send_response.json()["otp"]
        
        # Verify OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": TENANT_ADMIN_PHONE,
            "otp": otp,
            "role": "tenant_admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "tenant_admin"
        print(f"✓ Verify OTP Tenant Admin: User={data['user']['name']}")
        return data["access_token"]
    
    def test_send_otp_super_admin(self):
        """Test sending OTP to super admin"""
        response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": SUPER_ADMIN_PHONE,
            "role": "super_admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Send OTP Super Admin: OTP={data['otp']}")
    
    def test_invalid_otp(self):
        """Test invalid OTP rejection"""
        # First send OTP
        requests.post(f"{BASE_URL}/api/auth/send-otp", json={
            "phone": CUSTOMER_PHONE,
            "role": "customer"
        })
        
        # Try invalid OTP
        response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "phone": CUSTOMER_PHONE,
            "otp": "000000",
            "role": "customer"
        })
        assert response.status_code == 400
        print("✓ Invalid OTP rejected correctly")


# Helper function to get auth token
def get_auth_token(phone, role):
    """Helper to get auth token for a user"""
    send_response = requests.post(f"{BASE_URL}/api/auth/send-otp", json={
        "phone": phone,
        "role": role
    })
    otp = send_response.json()["otp"]
    
    verify_response = requests.post(f"{BASE_URL}/api/auth/verify-otp", json={
        "phone": phone,
        "otp": otp,
        "role": role
    })
    return verify_response.json()["access_token"]


class TestCustomerAPIs:
    """Customer API tests - Browse, Cart, Order"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup customer auth token"""
        self.token = get_auth_token(CUSTOMER_PHONE, "customer")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_restaurants(self):
        """Test browsing restaurants"""
        response = requests.get(
            f"{BASE_URL}/api/customer/restaurants",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Restaurants: Found {len(data)} restaurants")
        if data:
            print(f"  First restaurant: {data[0]['name']}")
        return data
    
    def test_get_restaurant_details(self):
        """Test getting restaurant details with menu"""
        # First get restaurants
        restaurants = requests.get(
            f"{BASE_URL}/api/customer/restaurants",
            headers=self.headers
        ).json()
        
        if not restaurants:
            pytest.skip("No restaurants found")
        
        store_id = restaurants[0]["id"]
        response = requests.get(
            f"{BASE_URL}/api/customer/restaurants/{store_id}",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        print(f"✓ Get Restaurant Details: {data['name']}")
        print(f"  Categories: {len(data.get('categories', []))}")
        return data
    
    def test_get_addresses(self):
        """Test getting customer addresses"""
        response = requests.get(
            f"{BASE_URL}/api/customer/addresses",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Addresses: Found {len(data)} addresses")
        return data
    
    def test_place_order(self):
        """Test placing an order - E2E flow"""
        # Get restaurants
        restaurants = requests.get(
            f"{BASE_URL}/api/customer/restaurants",
            headers=self.headers
        ).json()
        
        if not restaurants:
            pytest.skip("No restaurants found")
        
        store_id = restaurants[0]["id"]
        
        # Get restaurant menu
        restaurant = requests.get(
            f"{BASE_URL}/api/customer/restaurants/{store_id}",
            headers=self.headers
        ).json()
        
        # Find an item to order
        item_id = None
        for category in restaurant.get("categories", []):
            for item in category.get("items", []):
                item_id = item["id"]
                break
            if item_id:
                break
        
        if not item_id:
            pytest.skip("No items found in menu")
        
        # Get addresses
        addresses = requests.get(
            f"{BASE_URL}/api/customer/addresses",
            headers=self.headers
        ).json()
        
        if not addresses:
            pytest.skip("No addresses found")
        
        address_id = addresses[0]["id"]
        
        # Place order
        order_data = {
            "store_id": store_id,
            "delivery_address_id": address_id,
            "items": [
                {
                    "item_id": item_id,
                    "quantity": 2,
                    "add_ons": []
                }
            ],
            "payment_method": "cod",
            "delivery_type": "instant",
            "allow_substitution": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/customer/orders",
            headers=self.headers,
            json=order_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "order_id" in data
        assert "order_number" in data
        print(f"✓ Place Order: Order #{data['order_number']}")
        print(f"  Total: ₹{data['total_amount']}")
        return data
    
    def test_get_orders(self):
        """Test getting customer orders"""
        response = requests.get(
            f"{BASE_URL}/api/customer/orders",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Orders: Found {len(data)} orders")
        return data


class TestTenantAdminAPIs:
    """Tenant Admin API tests - Settings, Menu, Orders"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup tenant admin auth token"""
        self.token = get_auth_token(TENANT_ADMIN_PHONE, "tenant_admin")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_settings(self):
        """Test getting tenant settings"""
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/settings",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "delivery_charge_type" in data
        assert "tax_percentage" in data
        assert "default_admin_markup_percentage" in data
        print(f"✓ Get Settings:")
        print(f"  Delivery: {data['delivery_charge_type']}")
        print(f"  Tax: {data['tax_percentage']}%")
        print(f"  Default Markup: {data['default_admin_markup_percentage']}%")
        return data
    
    def test_update_settings(self):
        """Test updating tenant settings - Critical requirement"""
        # Get current settings
        current = requests.get(
            f"{BASE_URL}/api/tenant-admin/settings",
            headers=self.headers
        ).json()
        
        # Update settings
        update_data = {
            "tax_percentage": 6.0,
            "delivery_charge_per_km": 12.0,
            "default_admin_markup_percentage": 15.0
        }
        
        response = requests.put(
            f"{BASE_URL}/api/tenant-admin/settings",
            headers=self.headers,
            json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["tax_percentage"] == 6.0
        assert data["delivery_charge_per_km"] == 12.0
        assert data["default_admin_markup_percentage"] == 15.0
        print(f"✓ Update Settings: Tax={data['tax_percentage']}%, Markup={data['default_admin_markup_percentage']}%")
        
        # Restore original settings
        restore_data = {
            "tax_percentage": current.get("tax_percentage", 5.0),
            "delivery_charge_per_km": current.get("delivery_charge_per_km", 10.0),
            "default_admin_markup_percentage": current.get("default_admin_markup_percentage", 10.0)
        }
        requests.put(
            f"{BASE_URL}/api/tenant-admin/settings",
            headers=self.headers,
            json=restore_data
        )
        print("  (Settings restored)")
        return data
    
    def test_get_stores(self):
        """Test getting tenant stores"""
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/stores",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Stores: Found {len(data)} stores")
        return data
    
    def test_get_items(self):
        """Test getting menu items"""
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/items",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Items: Found {len(data)} items")
        if data:
            item = data[0]
            print(f"  Sample: {item['name']} - ₹{item['base_price']} + ₹{item.get('admin_markup_amount', 0)} markup")
        return data
    
    def test_get_orders(self):
        """Test getting tenant orders"""
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/orders",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Tenant Orders: Found {len(data)} orders")
        return data


class TestSuperAdminAPIs:
    """Super Admin API tests - Analytics, Tenants"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup super admin auth token"""
        self.token = get_auth_token(SUPER_ADMIN_PHONE, "super_admin")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_dashboard(self):
        """Test getting analytics dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/analytics/dashboard",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_tenants" in data
        assert "total_orders" in data
        assert "total_platform_revenue" in data
        print(f"✓ Get Dashboard:")
        print(f"  Tenants: {data['total_tenants']}")
        print(f"  Orders: {data['total_orders']}")
        print(f"  Revenue: ₹{data['total_platform_revenue']}")
        return data
    
    def test_get_tenants(self):
        """Test getting tenants list"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/tenants",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Tenants: Found {len(data)} tenants")
        if data:
            print(f"  First tenant: {data[0]['name']}")
        return data
    
    def test_get_subscription_plans(self):
        """Test getting subscription plans"""
        response = requests.get(
            f"{BASE_URL}/api/super-admin/subscription-plans",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get Subscription Plans: Found {len(data)} plans")
        return data


class TestPriceCalculation:
    """Test price calculation with admin markup, tax, delivery"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup customer auth token"""
        self.token = get_auth_token(CUSTOMER_PHONE, "customer")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_order_price_breakdown(self):
        """Test that order total = subtotal + tax + delivery"""
        # Get customer orders
        response = requests.get(
            f"{BASE_URL}/api/customer/orders",
            headers=self.headers
        )
        orders = response.json()
        
        if not orders:
            pytest.skip("No orders found for price verification")
        
        order = orders[0]
        
        # Verify price calculation
        subtotal = order.get("subtotal", 0)
        admin_markup = order.get("admin_markup_total", 0)
        tax = order.get("tax_amount", 0)
        delivery = order.get("delivery_charge", 0)
        discount = order.get("discount_amount", 0)
        total = order.get("total_amount", 0)
        
        # Note: subtotal already includes admin markup in this implementation
        calculated_total = subtotal + tax + delivery - discount
        
        print(f"✓ Price Breakdown for Order #{order.get('order_number', 'N/A')}:")
        print(f"  Subtotal (with markup): ₹{subtotal}")
        print(f"  Admin Markup Total: ₹{admin_markup}")
        print(f"  Tax: ₹{tax}")
        print(f"  Delivery: ₹{delivery}")
        print(f"  Discount: ₹{discount}")
        print(f"  Total: ₹{total}")
        print(f"  Calculated: ₹{calculated_total}")
        
        # Allow small floating point difference
        assert abs(total - calculated_total) < 0.01, f"Price mismatch: {total} != {calculated_total}"
        print("  ✓ Price calculation verified!")


class TestRoleBasedAccess:
    """Test role-based access control"""
    
    def test_customer_cannot_access_tenant_admin(self):
        """Customer should not access tenant admin APIs"""
        token = get_auth_token(CUSTOMER_PHONE, "customer")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/tenant-admin/settings",
            headers=headers
        )
        assert response.status_code == 403
        print("✓ Customer blocked from tenant admin APIs")
    
    def test_customer_cannot_access_super_admin(self):
        """Customer should not access super admin APIs"""
        token = get_auth_token(CUSTOMER_PHONE, "customer")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/super-admin/tenants",
            headers=headers
        )
        assert response.status_code == 403
        print("✓ Customer blocked from super admin APIs")
    
    def test_tenant_admin_cannot_access_super_admin(self):
        """Tenant admin should not access super admin APIs"""
        token = get_auth_token(TENANT_ADMIN_PHONE, "tenant_admin")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/super-admin/tenants",
            headers=headers
        )
        assert response.status_code == 403
        print("✓ Tenant admin blocked from super admin APIs")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
