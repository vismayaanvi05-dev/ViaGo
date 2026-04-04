import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Users,
  Store,
  Package,
  Calendar,
  Download,
  BarChart3
} from 'lucide-react';

const Reports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today'); // today, week, month, all
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    activeStores: 0,
    totalItems: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({
    subtotal: 0,
    adminMarkup: 0,
    deliveryCharges: 0,
    taxCollected: 0,
    platformCommission: 0,
    netPayout: 0,
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch stores
      const storesResponse = await tenantAdminAPI.getStores({});
      const stores = storesResponse.data || [];
      
      // Fetch items
      const itemsResponse = await tenantAdminAPI.getItems({});
      const items = itemsResponse.data || [];
      
      // Fetch orders (if available)
      let orders = [];
      try {
        const ordersResponse = await tenantAdminAPI.getOrders({});
        orders = ordersResponse.data || [];
      } catch (err) {
        console.log('Orders endpoint not available yet');
      }

      // Calculate stats
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');
      const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status));
      const cancelledOrders = orders.filter(o => o.status === 'cancelled');

      // Calculate revenue breakdown
      const subtotal = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
      const adminMarkup = orders.reduce((sum, order) => sum + (order.admin_markup || 0), 0);
      const deliveryCharges = orders.reduce((sum, order) => sum + (order.delivery_charge || 0), 0);
      const taxCollected = orders.reduce((sum, order) => sum + (order.tax_amount || 0), 0);
      const platformCommission = orders.reduce((sum, order) => sum + (order.commission || 0), 0);
      const netPayout = totalRevenue - platformCommission;

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        activeStores: stores.filter(s => s.is_active).length,
        totalItems: items.length,
        pendingOrders: pendingOrders.length,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
      });

      setRevenueBreakdown({
        subtotal,
        adminMarkup,
        deliveryCharges,
        taxCollected,
        platformCommission,
        netPayout,
      });

      // Top items (mock data for now)
      setTopItems(items.slice(0, 5).map(item => ({
        ...item,
        orderCount: Math.floor(Math.random() * 50) + 1
      })));

      // Recent orders
      setRecentOrders(orders.slice(0, 10));

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast({
      title: "Export Feature",
      description: "Report export will be available soon",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your business performance</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">All time earnings</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Completed orders</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.avgOrderValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Per order</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Stores</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeStores}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.totalItems} menu items</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Store className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{stats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-xl font-bold">{stats.cancelledOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">₹{revenueBreakdown.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Admin Markup (Your Profit)</span>
              <span className="font-semibold text-green-600">₹{revenueBreakdown.adminMarkup.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Delivery Charges</span>
              <span className="font-semibold">₹{revenueBreakdown.deliveryCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tax Collected</span>
              <span className="font-semibold">₹{revenueBreakdown.taxCollected.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-gray-600">Platform Commission</span>
              <span className="font-semibold text-red-600">-₹{revenueBreakdown.platformCommission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="font-bold">Net Payout</span>
              <span className="font-bold text-green-600 text-xl">₹{revenueBreakdown.netPayout.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Items */}
      {topItems.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Performing Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
                      <span className="font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.orderCount || 0} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.base_price}</p>
                    <Badge variant={item.is_available ? "success" : "secondary"}>
                      {item.is_available ? "Available" : "Out of Stock"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.total_amount}</p>
                    <Badge>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600">Orders will appear here once customers start placing them</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports;
