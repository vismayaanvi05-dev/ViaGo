"""
Test suite for Grocery Admin and Laundry Admin APIs
Tests CRUD operations, RBAC, and data persistence
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TENANT_ADMIN_EMAIL = "groceryadmin@test.com"
TENANT_ADMIN_PASSWORD = "grocery123"
SUPER_ADMIN_EMAIL = "admin@hyperserve.com"
SUPER_ADMIN_PASSWORD = "admin123"


class TestAuthAndRBAC:
    """Test authentication and role-based access control"""
    
    @pytest.fixture(scope="class")
    def tenant_admin_token(self):
        """Get tenant admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Tenant admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def super_admin_token(self):
        """Get super admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    def test_01_tenant_admin_login(self, tenant_admin_token):
        """Test tenant admin can login"""
        assert tenant_admin_token is not None
        print(f"✓ Tenant admin login successful")
    
    def test_02_super_admin_cannot_access_grocery_admin(self, super_admin_token):
        """Super admin should NOT have access to grocery admin (tenant_admin only)"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/grocery-admin/categories", headers=headers)
        # Super admin should get 403 or 400 (no tenant_id)
        assert response.status_code in [400, 403], f"Expected 400/403, got {response.status_code}"
        print(f"✓ Super admin correctly denied access to grocery admin")
    
    def test_03_super_admin_cannot_access_laundry_admin(self, super_admin_token):
        """Super admin should NOT have access to laundry admin (tenant_admin only)"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/laundry-admin/services", headers=headers)
        # Super admin should get 403 or 400 (no tenant_id)
        assert response.status_code in [400, 403], f"Expected 400/403, got {response.status_code}"
        print(f"✓ Super admin correctly denied access to laundry admin")


class TestGroceryCategories:
    """Test Grocery Categories CRUD"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def created_category_id(self, auth_headers):
        """Create a test category and return its ID"""
        response = requests.post(f"{BASE_URL}/api/grocery-admin/categories", 
            headers=auth_headers,
            json={
                "name": "TEST_Fruits",
                "description": "Fresh fruits category",
                "sort_order": 1
            }
        )
        if response.status_code == 200:
            return response.json()["id"]
        return None
    
    def test_01_list_categories(self, auth_headers):
        """Test listing grocery categories"""
        response = requests.get(f"{BASE_URL}/api/grocery-admin/categories", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list categories: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} grocery categories")
    
    def test_02_create_category(self, auth_headers):
        """Test creating a grocery category"""
        response = requests.post(f"{BASE_URL}/api/grocery-admin/categories", 
            headers=auth_headers,
            json={
                "name": "TEST_Vegetables",
                "description": "Fresh vegetables",
                "sort_order": 2
            }
        )
        assert response.status_code == 200, f"Failed to create category: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Vegetables"
        assert "id" in data
        print(f"✓ Created category: {data['name']} (ID: {data['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/grocery-admin/categories/{data['id']}", headers=auth_headers)
    
    def test_03_create_subcategory(self, auth_headers, created_category_id):
        """Test creating a subcategory with parent_id"""
        if not created_category_id:
            pytest.skip("Parent category not created")
        
        response = requests.post(f"{BASE_URL}/api/grocery-admin/categories", 
            headers=auth_headers,
            json={
                "name": "TEST_Apples",
                "description": "Apple varieties",
                "parent_id": created_category_id,
                "sort_order": 1
            }
        )
        assert response.status_code == 200, f"Failed to create subcategory: {response.text}"
        data = response.json()
        assert data["parent_id"] == created_category_id
        print(f"✓ Created subcategory: {data['name']} under parent {created_category_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/grocery-admin/categories/{data['id']}", headers=auth_headers)
    
    def test_04_update_category(self, auth_headers, created_category_id):
        """Test updating a category"""
        if not created_category_id:
            pytest.skip("Category not created")
        
        response = requests.put(f"{BASE_URL}/api/grocery-admin/categories/{created_category_id}", 
            headers=auth_headers,
            json={"name": "TEST_Fruits_Updated", "description": "Updated description"}
        )
        assert response.status_code == 200, f"Failed to update category: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Fruits_Updated"
        print(f"✓ Updated category name to: {data['name']}")
    
    def test_05_delete_category(self, auth_headers, created_category_id):
        """Test deleting a category (soft delete)"""
        if not created_category_id:
            pytest.skip("Category not created")
        
        response = requests.delete(f"{BASE_URL}/api/grocery-admin/categories/{created_category_id}", 
            headers=auth_headers
        )
        assert response.status_code == 200, f"Failed to delete category: {response.text}"
        print(f"✓ Deleted category {created_category_id}")


class TestGroceryProducts:
    """Test Grocery Products CRUD"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_category(self, auth_headers):
        """Create a test category for products"""
        response = requests.post(f"{BASE_URL}/api/grocery-admin/categories", 
            headers=auth_headers,
            json={"name": "TEST_ProductCategory", "sort_order": 99}
        )
        if response.status_code == 200:
            cat = response.json()
            yield cat
            # Cleanup
            requests.delete(f"{BASE_URL}/api/grocery-admin/categories/{cat['id']}", headers=auth_headers)
        else:
            yield None
    
    def test_01_list_products(self, auth_headers):
        """Test listing grocery products"""
        response = requests.get(f"{BASE_URL}/api/grocery-admin/products", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list products: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} grocery products")
    
    def test_02_create_product(self, auth_headers, test_category):
        """Test creating a grocery product"""
        if not test_category:
            pytest.skip("Test category not created")
        
        response = requests.post(f"{BASE_URL}/api/grocery-admin/products", 
            headers=auth_headers,
            json={
                "name": "TEST_Organic Apples",
                "description": "Fresh organic apples",
                "brand": "FarmFresh",
                "category_id": test_category["id"],
                "mrp": 150.00,
                "selling_price": 120.00,
                "unit_type": "kg",
                "unit_value": 1,
                "current_stock": 50,
                "low_stock_threshold": 10,
                "is_organic": True,
                "is_fresh": True,
                "images": [],
                "tags": ["organic", "fresh"]
            }
        )
        assert response.status_code == 200, f"Failed to create product: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Organic Apples"
        assert data["mrp"] == 150.00
        assert data["selling_price"] == 120.00
        assert data["discount_percentage"] == 20.0  # (150-120)/150 * 100
        assert data["is_organic"] == True
        print(f"✓ Created product: {data['name']} (ID: {data['id']})")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/grocery-admin/products", headers=auth_headers)
        products = get_response.json()
        created_product = next((p for p in products if p["id"] == data["id"]), None)
        assert created_product is not None, "Product not found after creation"
        print(f"✓ Verified product persistence")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/grocery-admin/products/{data['id']}", headers=auth_headers)
    
    def test_03_update_product(self, auth_headers, test_category):
        """Test updating a product"""
        if not test_category:
            pytest.skip("Test category not created")
        
        # Create product first
        create_response = requests.post(f"{BASE_URL}/api/grocery-admin/products", 
            headers=auth_headers,
            json={
                "name": "TEST_Update Product",
                "category_id": test_category["id"],
                "mrp": 100.00,
                "selling_price": 90.00,
                "unit_type": "piece",
                "unit_value": 1,
                "current_stock": 20,
                "low_stock_threshold": 5
            }
        )
        product = create_response.json()
        
        # Update product
        update_response = requests.put(f"{BASE_URL}/api/grocery-admin/products/{product['id']}", 
            headers=auth_headers,
            json={"name": "TEST_Updated Product", "selling_price": 80.00}
        )
        assert update_response.status_code == 200, f"Failed to update product: {update_response.text}"
        updated = update_response.json()
        assert updated["name"] == "TEST_Updated Product"
        assert updated["selling_price"] == 80.00
        print(f"✓ Updated product: {updated['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/grocery-admin/products/{product['id']}", headers=auth_headers)
    
    def test_04_delete_product(self, auth_headers, test_category):
        """Test deleting a product"""
        if not test_category:
            pytest.skip("Test category not created")
        
        # Create product first
        create_response = requests.post(f"{BASE_URL}/api/grocery-admin/products", 
            headers=auth_headers,
            json={
                "name": "TEST_Delete Product",
                "category_id": test_category["id"],
                "mrp": 50.00,
                "selling_price": 45.00,
                "unit_type": "piece",
                "unit_value": 1,
                "current_stock": 10,
                "low_stock_threshold": 2
            }
        )
        product = create_response.json()
        
        # Delete product
        delete_response = requests.delete(f"{BASE_URL}/api/grocery-admin/products/{product['id']}", 
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Failed to delete product: {delete_response.text}"
        print(f"✓ Deleted product {product['id']}")


class TestGroceryInventory:
    """Test Grocery Inventory operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_product(self, auth_headers):
        """Create a test product for inventory operations"""
        # First create a category
        cat_response = requests.post(f"{BASE_URL}/api/grocery-admin/categories", 
            headers=auth_headers,
            json={"name": "TEST_InventoryCategory", "sort_order": 98}
        )
        category = cat_response.json() if cat_response.status_code == 200 else None
        
        if not category:
            yield None
            return
        
        # Create product
        prod_response = requests.post(f"{BASE_URL}/api/grocery-admin/products", 
            headers=auth_headers,
            json={
                "name": "TEST_Inventory Product",
                "category_id": category["id"],
                "mrp": 100.00,
                "selling_price": 90.00,
                "unit_type": "piece",
                "unit_value": 1,
                "current_stock": 100,
                "low_stock_threshold": 10
            }
        )
        product = prod_response.json() if prod_response.status_code == 200 else None
        
        yield {"product": product, "category": category}
        
        # Cleanup
        if product:
            requests.delete(f"{BASE_URL}/api/grocery-admin/products/{product['id']}", headers=auth_headers)
        if category:
            requests.delete(f"{BASE_URL}/api/grocery-admin/categories/{category['id']}", headers=auth_headers)
    
    def test_01_add_stock(self, auth_headers, test_product):
        """Test adding stock to a product"""
        if not test_product or not test_product.get("product"):
            pytest.skip("Test product not created")
        
        product = test_product["product"]
        initial_stock = product["current_stock"]
        
        response = requests.post(f"{BASE_URL}/api/grocery-admin/inventory/update-stock", 
            headers=auth_headers,
            json={
                "product_id": product["id"],
                "store_id": product.get("store_id"),
                "operation": "add",
                "quantity": 50,
                "notes": "Test stock addition"
            }
        )
        assert response.status_code == 200, f"Failed to add stock: {response.text}"
        data = response.json()
        assert data["previous_stock"] == initial_stock
        assert data["new_stock"] == initial_stock + 50
        print(f"✓ Added 50 units: {initial_stock} → {data['new_stock']}")
    
    def test_02_subtract_stock(self, auth_headers, test_product):
        """Test subtracting stock from a product"""
        if not test_product or not test_product.get("product"):
            pytest.skip("Test product not created")
        
        product = test_product["product"]
        
        # Get current stock first
        products_response = requests.get(f"{BASE_URL}/api/grocery-admin/products", headers=auth_headers)
        products = products_response.json()
        current_product = next((p for p in products if p["id"] == product["id"]), None)
        current_stock = current_product["current_stock"] if current_product else 150
        
        response = requests.post(f"{BASE_URL}/api/grocery-admin/inventory/update-stock", 
            headers=auth_headers,
            json={
                "product_id": product["id"],
                "store_id": product.get("store_id"),
                "operation": "subtract",
                "quantity": 30,
                "notes": "Test stock subtraction"
            }
        )
        assert response.status_code == 200, f"Failed to subtract stock: {response.text}"
        data = response.json()
        assert data["new_stock"] == current_stock - 30
        print(f"✓ Subtracted 30 units: {current_stock} → {data['new_stock']}")
    
    def test_03_set_stock(self, auth_headers, test_product):
        """Test setting stock to a specific value"""
        if not test_product or not test_product.get("product"):
            pytest.skip("Test product not created")
        
        product = test_product["product"]
        
        response = requests.post(f"{BASE_URL}/api/grocery-admin/inventory/update-stock", 
            headers=auth_headers,
            json={
                "product_id": product["id"],
                "store_id": product.get("store_id"),
                "operation": "set",
                "quantity": 75,
                "notes": "Test stock adjustment"
            }
        )
        assert response.status_code == 200, f"Failed to set stock: {response.text}"
        data = response.json()
        assert data["new_stock"] == 75
        print(f"✓ Set stock to 75 units")
    
    def test_04_get_transactions(self, auth_headers):
        """Test getting inventory transactions"""
        response = requests.get(f"{BASE_URL}/api/grocery-admin/inventory/transactions", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get transactions: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Retrieved {len(data)} inventory transactions")
    
    def test_05_get_low_stock(self, auth_headers):
        """Test getting low stock products"""
        response = requests.get(f"{BASE_URL}/api/grocery-admin/inventory/low-stock", headers=auth_headers)
        assert response.status_code == 200, f"Failed to get low stock: {response.text}"
        data = response.json()
        assert "count" in data
        assert "products" in data
        print(f"✓ Found {data['count']} low stock products")


class TestLaundryServices:
    """Test Laundry Services CRUD"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_01_list_services(self, auth_headers):
        """Test listing laundry services"""
        response = requests.get(f"{BASE_URL}/api/laundry-admin/services", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list services: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} laundry services")
    
    def test_02_create_service(self, auth_headers):
        """Test creating a laundry service"""
        response = requests.post(f"{BASE_URL}/api/laundry-admin/services", 
            headers=auth_headers,
            json={
                "name": "TEST_Wash",
                "description": "Regular washing service",
                "icon": "🧺",
                "turnaround_time_hours": 24,
                "sort_order": 1
            }
        )
        assert response.status_code == 200, f"Failed to create service: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Wash"
        assert data["turnaround_time_hours"] == 24
        print(f"✓ Created service: {data['name']} (ID: {data['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/laundry-admin/services/{data['id']}", headers=auth_headers)
    
    def test_03_update_service(self, auth_headers):
        """Test updating a laundry service"""
        # Create service first
        create_response = requests.post(f"{BASE_URL}/api/laundry-admin/services", 
            headers=auth_headers,
            json={"name": "TEST_Iron", "description": "Ironing service", "sort_order": 2}
        )
        service = create_response.json()
        
        # Update service
        update_response = requests.put(f"{BASE_URL}/api/laundry-admin/services/{service['id']}", 
            headers=auth_headers,
            json={"name": "TEST_Iron_Updated", "description": "Premium ironing service"}
        )
        assert update_response.status_code == 200, f"Failed to update service: {update_response.text}"
        updated = update_response.json()
        assert updated["name"] == "TEST_Iron_Updated"
        print(f"✓ Updated service: {updated['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/laundry-admin/services/{service['id']}", headers=auth_headers)
    
    def test_04_delete_service(self, auth_headers):
        """Test deleting a laundry service"""
        # Create service first
        create_response = requests.post(f"{BASE_URL}/api/laundry-admin/services", 
            headers=auth_headers,
            json={"name": "TEST_DryClean", "description": "Dry cleaning", "sort_order": 3}
        )
        service = create_response.json()
        
        # Delete service
        delete_response = requests.delete(f"{BASE_URL}/api/laundry-admin/services/{service['id']}", 
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Failed to delete service: {delete_response.text}"
        print(f"✓ Deleted service {service['id']}")


class TestLaundryItems:
    """Test Laundry Items CRUD"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_01_list_items(self, auth_headers):
        """Test listing laundry items"""
        response = requests.get(f"{BASE_URL}/api/laundry-admin/items", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list items: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} laundry items")
    
    def test_02_create_item(self, auth_headers):
        """Test creating a laundry item"""
        response = requests.post(f"{BASE_URL}/api/laundry-admin/items", 
            headers=auth_headers,
            json={
                "name": "TEST_Shirt",
                "category": "Clothing",
                "image_url": "",
                "sort_order": 1
            }
        )
        assert response.status_code == 200, f"Failed to create item: {response.text}"
        data = response.json()
        assert data["name"] == "TEST_Shirt"
        assert data["category"] == "Clothing"
        print(f"✓ Created item: {data['name']} (ID: {data['id']})")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/laundry-admin/items/{data['id']}", headers=auth_headers)
    
    def test_03_update_item(self, auth_headers):
        """Test updating a laundry item"""
        # Create item first
        create_response = requests.post(f"{BASE_URL}/api/laundry-admin/items", 
            headers=auth_headers,
            json={"name": "TEST_Pants", "category": "Clothing", "sort_order": 2}
        )
        item = create_response.json()
        
        # Update item
        update_response = requests.put(f"{BASE_URL}/api/laundry-admin/items/{item['id']}", 
            headers=auth_headers,
            json={"name": "TEST_Trousers", "category": "Formal Wear"}
        )
        assert update_response.status_code == 200, f"Failed to update item: {update_response.text}"
        updated = update_response.json()
        assert updated["name"] == "TEST_Trousers"
        print(f"✓ Updated item: {updated['name']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/laundry-admin/items/{item['id']}", headers=auth_headers)
    
    def test_04_delete_item(self, auth_headers):
        """Test deleting a laundry item"""
        # Create item first
        create_response = requests.post(f"{BASE_URL}/api/laundry-admin/items", 
            headers=auth_headers,
            json={"name": "TEST_Towel", "category": "Linens", "sort_order": 3}
        )
        item = create_response.json()
        
        # Delete item
        delete_response = requests.delete(f"{BASE_URL}/api/laundry-admin/items/{item['id']}", 
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Failed to delete item: {delete_response.text}"
        print(f"✓ Deleted item {item['id']}")


class TestLaundryPricing:
    """Test Laundry Pricing CRUD"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    @pytest.fixture(scope="class")
    def test_service_and_item(self, auth_headers):
        """Create test service and item for pricing"""
        # Create service
        service_response = requests.post(f"{BASE_URL}/api/laundry-admin/services", 
            headers=auth_headers,
            json={"name": "TEST_PricingService", "sort_order": 99}
        )
        service = service_response.json() if service_response.status_code == 200 else None
        
        # Create item
        item_response = requests.post(f"{BASE_URL}/api/laundry-admin/items", 
            headers=auth_headers,
            json={"name": "TEST_PricingItem", "category": "Test", "sort_order": 99}
        )
        item = item_response.json() if item_response.status_code == 200 else None
        
        yield {"service": service, "item": item}
        
        # Cleanup
        if service:
            requests.delete(f"{BASE_URL}/api/laundry-admin/services/{service['id']}", headers=auth_headers)
        if item:
            requests.delete(f"{BASE_URL}/api/laundry-admin/items/{item['id']}", headers=auth_headers)
    
    def test_01_list_pricing(self, auth_headers):
        """Test listing laundry pricing"""
        response = requests.get(f"{BASE_URL}/api/laundry-admin/pricing", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list pricing: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} pricing rules")
    
    def test_02_create_pricing_per_item(self, auth_headers, test_service_and_item):
        """Test creating per-item pricing"""
        if not test_service_and_item.get("service") or not test_service_and_item.get("item"):
            pytest.skip("Test service/item not created")
        
        response = requests.post(f"{BASE_URL}/api/laundry-admin/pricing", 
            headers=auth_headers,
            json={
                "service_id": test_service_and_item["service"]["id"],
                "item_id": test_service_and_item["item"]["id"],
                "pricing_type": "per_item",
                "price": 50.00
            }
        )
        assert response.status_code == 200, f"Failed to create pricing: {response.text}"
        data = response.json()
        assert data["pricing_type"] == "per_item"
        assert data["price"] == 50.00
        print(f"✓ Created per-item pricing: ₹{data['price']}")
    
    def test_03_update_pricing(self, auth_headers, test_service_and_item):
        """Test updating pricing"""
        if not test_service_and_item.get("service") or not test_service_and_item.get("item"):
            pytest.skip("Test service/item not created")
        
        # Get existing pricing
        list_response = requests.get(f"{BASE_URL}/api/laundry-admin/pricing", headers=auth_headers)
        pricing_list = list_response.json()
        
        # Find our test pricing
        test_pricing = next((p for p in pricing_list 
            if p["service_id"] == test_service_and_item["service"]["id"] 
            and p["item_id"] == test_service_and_item["item"]["id"]), None)
        
        if not test_pricing:
            pytest.skip("Test pricing not found")
        
        # Update pricing
        update_response = requests.put(f"{BASE_URL}/api/laundry-admin/pricing/{test_pricing['id']}", 
            headers=auth_headers,
            json={"price": 75.00}
        )
        assert update_response.status_code == 200, f"Failed to update pricing: {update_response.text}"
        updated = update_response.json()
        assert updated["price"] == 75.00
        print(f"✓ Updated pricing to: ₹{updated['price']}")


class TestLaundryTimeSlots:
    """Test Laundry Time Slots"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_01_list_time_slots(self, auth_headers):
        """Test listing time slots"""
        response = requests.get(f"{BASE_URL}/api/laundry-admin/time-slots", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list time slots: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} time slots")
    
    def test_02_create_time_slot(self, auth_headers):
        """Test creating a time slot"""
        response = requests.post(f"{BASE_URL}/api/laundry-admin/time-slots", 
            headers=auth_headers,
            json={
                "slot_type": "pickup",
                "start_time": "09:00",
                "end_time": "12:00",
                "max_capacity": 10,
                "days_of_week": ["monday", "tuesday", "wednesday", "thursday", "friday"]
            }
        )
        assert response.status_code == 200, f"Failed to create time slot: {response.text}"
        data = response.json()
        assert data["slot_type"] == "pickup"
        assert data["start_time"] == "09:00"
        assert data["end_time"] == "12:00"
        print(f"✓ Created time slot: {data['start_time']} - {data['end_time']} ({data['slot_type']})")


class TestLaundryOrders:
    """Test Laundry Orders"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth headers for tenant admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TENANT_ADMIN_EMAIL,
            "password": TENANT_ADMIN_PASSWORD
        })
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_01_list_orders(self, auth_headers):
        """Test listing laundry orders"""
        response = requests.get(f"{BASE_URL}/api/laundry-admin/orders", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list orders: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} laundry orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
