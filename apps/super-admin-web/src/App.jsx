import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import SubscriptionPlans from './pages/SubscriptionPlans';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tenants" element={<Tenants />} />
            <Route path="plans" element={<SubscriptionPlans />} />
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
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
