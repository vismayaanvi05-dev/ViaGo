import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Settings, MenuSquare, ShoppingBag, BarChart3, LogOut } from 'lucide-react';

const VendorAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/vendor-admin', icon: Home, label: 'Dashboard' },
    { path: '/vendor-admin/menu', icon: MenuSquare, label: 'Menu Items' },
    { path: '/vendor-admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/vendor-admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/vendor-admin/settings', icon: Settings, label: 'Store Settings' },
  ];

  const isActive = (path) => {
    if (path === '/vendor-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-orange-600">HyperServe</h1>
          <p className="text-sm text-gray-600 mt-1">Vendor Admin</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-orange-50 text-orange-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-semibold">
                {user?.name?.charAt(0) || 'V'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Vendor'}</p>
              <p className="text-xs text-gray-500">Vendor Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
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

export default VendorAdminLayout;