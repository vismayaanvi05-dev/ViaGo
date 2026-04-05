import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Stores from './pages/Stores';
import MenuBuilder from './pages/MenuBuilder';
import Orders from './pages/Orders';
import DeliveryPartners from './pages/DeliveryPartners';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['tenant_admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="stores" element={<Stores />} />
            <Route path="menu" element={<MenuBuilder />} />
            <Route path="orders" element={<Orders />} />
            <Route path="delivery-partners" element={<DeliveryPartners />} />
            <Route 
              path="reports" 
              element={
                <div className="p-8">
                  <h1 className="text-3xl font-bold">Reports</h1>
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
