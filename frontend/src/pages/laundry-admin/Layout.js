import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Sparkles, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Clock, 
  Settings, 
  LogOut 
} from 'lucide-react';

const LaundryAdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const menuItems = [
    { path: '/laundry-admin', icon: Home, label: 'Dashboard' },
    { path: '/laundry-admin/services', icon: Sparkles, label: 'Services' },
    { path: '/laundry-admin/items', icon: Package, label: 'Items' },
    { path: '/laundry-admin/pricing', icon: DollarSign, label: 'Pricing' },
    { path: '/laundry-admin/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/laundry-admin/time-slots', icon: Clock, label: 'Time Slots' },
    { path: '/laundry-admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">🧺 Laundry Admin</h1>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6">
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-700 hover:text-red-600 w-full"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default LaundryAdminLayout;