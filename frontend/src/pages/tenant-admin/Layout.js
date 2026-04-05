import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTenantModules } from '../../hooks/useTenantModules';
import { Button } from '@/components/ui/button';
import { 
  Store, 
  Settings, 
  ShoppingBag, 
  BarChart3, 
  LogOut,
  MenuSquare,
  Home,
  Users,
  FolderTree,
  Package,
  Warehouse,
  Sparkles,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight,
  Bike
} from 'lucide-react';

const TenantAdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasFood, hasGrocery, hasLaundry, loading } = useTenantModules();
  
  const [expandedSections, setExpandedSections] = useState({
    food: true,
    grocery: true,
    laundry: true
  });

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isActive = (path) => {
    if (path === '/tenant-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  // Global menu items (always visible)
  const globalItems = [
    { path: '/tenant-admin', icon: Home, label: 'Dashboard' },
    { path: '/tenant-admin/orders', icon: ShoppingBag, label: 'All Orders' },
    { path: '/tenant-admin/delivery-partners', icon: Bike, label: 'Delivery Partners' },
    { path: '/tenant-admin/settings', icon: Settings, label: 'Settings' },
  ];

  // Food module menu items
  const foodItems = [
    { path: '/tenant-admin/stores', icon: Store, label: 'Stores' },
    { path: '/tenant-admin/vendors', icon: Users, label: 'Vendor Admins' },
    { path: '/tenant-admin/menu', icon: MenuSquare, label: 'Menu' },
    { path: '/tenant-admin/categories', icon: FolderTree, label: 'Categories' },
    { path: '/tenant-admin/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/tenant-admin/reports', icon: BarChart3, label: 'Reports' },
  ];

  // Grocery module menu items
  const groceryItems = [
    { path: '/tenant-admin/grocery/products', icon: Package, label: 'Products' },
    { path: '/tenant-admin/grocery/categories', icon: FolderTree, label: 'Categories' },
    { path: '/tenant-admin/grocery/inventory', icon: Warehouse, label: 'Inventory' },
  ];

  // Laundry module menu items
  const laundryItems = [
    { path: '/tenant-admin/laundry/services', icon: Sparkles, label: 'Services' },
    { path: '/tenant-admin/laundry/items', icon: Package, label: 'Items' },
    { path: '/tenant-admin/laundry/pricing', icon: DollarSign, label: 'Pricing' },
    { path: '/tenant-admin/laundry/time-slots', icon: Clock, label: 'Time Slots' },
  ];

  const renderMenuItem = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
          isActive(item.path)
            ? 'bg-orange-50 text-orange-600 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="text-sm">{item.label}</span>
      </Link>
    );
  };

  const renderModuleSection = (title, icon, items, sectionKey, color) => {
    const Icon = icon;
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${
            isExpanded ? `bg-${color}-50` : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 text-${color}-600`} />
            <span className={`font-semibold text-sm text-${color}-600`}>{title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className={`h-4 w-4 text-${color}-600`} />
          ) : (
            <ChevronRight className={`h-4 w-4 text-gray-400`} />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-2 ml-2 space-y-1">
            {items.map(renderMenuItem)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-orange-600">HyperServe</h1>
          <p className="text-sm text-gray-600 mt-1">Tenant Admin</p>
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Global Items */}
          <div className="space-y-1 mb-6">
            {globalItems.map(renderMenuItem)}
          </div>

          {/* Food Module */}
          {hasFood && renderModuleSection('🍕 Food Management', Store, foodItems, 'food', 'orange')}

          {/* Grocery Module */}
          {hasGrocery && renderModuleSection('🛒 Grocery Management', Package, groceryItems, 'grocery', 'green')}

          {/* Laundry Module */}
          {hasLaundry && renderModuleSection('🧺 Laundry Management', Sparkles, laundryItems, 'laundry', 'blue')}
        </nav>

        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-semibold">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
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

export default TenantAdminLayout;
