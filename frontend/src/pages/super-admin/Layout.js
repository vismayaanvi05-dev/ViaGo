import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Wallet, 
  LogOut,
  Home,
  Crown
} from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/super-admin', icon: Home, label: 'Dashboard' },
    { path: '/super-admin/tenants', icon: Users, label: 'Tenants' },
    { path: '/super-admin/tenant-admins', icon: Users, label: 'Tenant Admins' },
    { path: '/super-admin/plans', icon: CreditCard, label: 'Subscription Plans' },
    { path: '/super-admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/super-admin/payouts', icon: Wallet, label: 'Payouts' },
  ];

  const isActive = (path) => {
    if (path === '/super-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-purple-900 to-purple-800 shadow-lg">
        <div className="p-6 border-b border-purple-700">
          <div className="flex items-center gap-2">
            <Crown className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">HyperServe</h1>
              <p className="text-sm text-purple-200">Super Admin</p>
            </div>
          </div>
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
                    ? 'bg-white text-purple-900 font-medium shadow-md'
                    : 'text-purple-100 hover:bg-purple-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-purple-700 bg-purple-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center">
              <Crown className="h-6 w-6 text-purple-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-purple-200 truncate">{user?.phone}</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-purple-600 text-white hover:bg-purple-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default SuperAdminLayout;