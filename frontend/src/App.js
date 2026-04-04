import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';

// Pages
import AdminLogin from './pages/AdminLogin';
import EmailOTPLogin from './pages/EmailOTPLogin';
import ForgotPassword from './pages/ForgotPassword';

// Customer routes removed - Customer app is mobile-only

// Tenant Admin
import TenantAdminLayout from './pages/tenant-admin/Layout';
import TenantDashboard from './pages/tenant-admin/Dashboard';
import TenantSettings from './pages/tenant-admin/Settings';
import TenantStores from './pages/tenant-admin/Stores';
import TenantOrders from './pages/tenant-admin/Orders';
import MenuBuilder from './pages/tenant-admin/MenuBuilder';
import CreateVendorAdmin from './pages/tenant-admin/CreateVendorAdmin';
import TenantReports from './pages/tenant-admin/Reports';
import TenantCategories from './pages/tenant-admin/Categories';

// Vendor Admin
import VendorAdminLayout from './pages/vendor-admin/Layout';
import VendorDashboard from './pages/vendor-admin/Dashboard';
import VendorMenu from './pages/vendor-admin/Menu';
import VendorOrders from './pages/vendor-admin/Orders';
import VendorAnalytics from './pages/vendor-admin/Analytics';
import VendorSettings from './pages/vendor-admin/Settings';

// Grocery Pages (no separate layout - integrated in Tenant Admin)
import GroceryProducts from './pages/grocery-admin/Products';
import GroceryCategories from './pages/grocery-admin/Categories';
import GroceryInventory from './pages/grocery-admin/Inventory';

// Laundry Pages (no separate layout - integrated in Tenant Admin)
import LaundryServices from './pages/laundry-admin/Services';
import LaundryItems from './pages/laundry-admin/Items';
import LaundryPricing from './pages/laundry-admin/Pricing';
import LaundryOrders from './pages/laundry-admin/Orders';
import LaundryTimeSlots from './pages/laundry-admin/TimeSlots';



// Super Admin
import SuperAdminLayout from './pages/super-admin/Layout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminTenants from './pages/super-admin/Tenants';
import SuperAdminPlans from './pages/super-admin/SubscriptionPlans';
import CreateTenantAdmin from './pages/super-admin/CreateTenantAdmin';
import ManageTenantAdmins from './pages/super-admin/ManageTenantAdmins';
import EnhancedCreateTenant from './pages/super-admin/EnhancedCreateTenant';
import Analytics from './pages/super-admin/Analytics';
import Payouts from './pages/super-admin/Payouts';

// Landing page
const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">HyperServe</h1>
        <p className="text-xl text-gray-600 mb-8">Multi-tenant SaaS Platform for Hyperlocal Commerce</p>
        <div className="space-x-4">
          <a
            href="/admin-login"
            className="inline-block px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Admin Login
          </a>
          <a
            href="https://emergent.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin-login" element={
            <AdminLogin 
              title="Admin Login" 
              description="Super Admin, Tenant Admin, or Vendor Admin" 
              redirectPath="/"
              colorScheme="blue"
            />
          } />
          <Route path="/email-otp-login" element={<EmailOTPLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Customer & Delivery apps are mobile-only (React Native) */}
          
          {/* Tenant Admin Routes - Unified Panel with All Modules */}
          <Route
            path="/tenant-admin"
            element={
              <ProtectedRoute allowedRoles={['tenant_admin']}>
                <TenantAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TenantDashboard />} />
            <Route path="settings" element={<TenantSettings />} />
            
            {/* Food Module Routes */}
            <Route path="stores" element={<TenantStores />} />
            <Route path="menu" element={<MenuBuilder />} />
            <Route path="categories" element={<TenantCategories />} />
            <Route path="orders" element={<TenantOrders />} />
            <Route path="vendors" element={<CreateVendorAdmin />} />
            <Route path="reports" element={<TenantReports />} />
            
            {/* Grocery Module Routes */}
            <Route path="grocery/products" element={<GroceryProducts />} />
            <Route path="grocery/categories" element={<GroceryCategories />} />
            <Route path="grocery/inventory" element={<GroceryInventory />} />
            <Route 
              path="grocery/orders" 
              element={
                <div className="p-8">
                  <h1 className="text-3xl font-bold">Grocery Orders</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              } 
            />
            
            {/* Laundry Module Routes */}
            <Route path="laundry/services" element={<LaundryServices />} />
            <Route path="laundry/items" element={<LaundryItems />} />
            <Route path="laundry/pricing" element={<LaundryPricing />} />
            <Route path="laundry/orders" element={<LaundryOrders />} />
            <Route path="laundry/time-slots" element={<LaundryTimeSlots />} />
          </Route>
          
          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<SuperAdminTenants />} />
            <Route path="tenants/create" element={<EnhancedCreateTenant />} />
            <Route path="plans" element={<SuperAdminPlans />} />
            <Route path="tenant-admins" element={<ManageTenantAdmins />} />
            <Route path="tenant-admins/create" element={<CreateTenantAdmin />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="payouts" element={<Payouts />} />
            <Route 
              path="analytics" 
              element={
                <div className="p-8">
                  <h1 className="text-3xl font-bold">Analytics</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              } 
            />
            <Route 
              path="payouts" 
              element={
                <div className="p-8">
                  <h1 className="text-3xl font-bold">Payouts</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              } 
            />
          </Route>

          {/* ==================== VENDOR ADMIN ROUTES ==================== */}
          <Route path="/vendor-admin" element={<ProtectedRoute allowedRoles={['vendor']}><VendorAdminLayout /></ProtectedRoute>}>
            <Route index element={<VendorDashboard />} />
            <Route path="menu" element={<VendorMenu />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="analytics" element={<VendorAnalytics />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>
          
          {/* Delivery Partner Routes */}
          <Route
            path="/delivery"
            element={
              <ProtectedRoute allowedRoles={['delivery']}>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Delivery Partner Dashboard</h1>
                    <p className="text-gray-600 mt-2">Coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
