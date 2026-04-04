import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Restaurants from './pages/customer/Restaurants';
import RestaurantMenu from './pages/customer/RestaurantMenu';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';

// Landing page
const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">HyperServe</h1>
        <p className="text-xl text-gray-600 mb-8">Multi-tenant SaaS Platform for Food Delivery</p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Get Started
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Customer Routes */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Restaurants />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/restaurant/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <RestaurantMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Orders />
              </ProtectedRoute>
            }
          />
          
          {/* Placeholder routes for other roles */}
          <Route
            path="/tenant-admin"
            element={
              <ProtectedRoute allowedRoles={['tenant_admin']}>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Tenant Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          
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
