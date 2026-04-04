import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle, Package, Clock } from 'lucide-react';

const VendorDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    totalItems: 0,
    avgOrderValue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch orders for the vendor's store
      const ordersResponse = await vendorAPI.getOrders({});
      const orders = ordersResponse.data || [];

      // Calculate stats
      const today = new Date().toDateString();
      const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const pendingOrders = orders.filter(o => ['pending', 'confirmed'].includes(o.status));

      // Fetch items count
      const itemsResponse = await vendorAPI.getItems({});
      const items = itemsResponse.data || [];

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders: pendingOrders.length,
        totalItems: items.length,
        avgOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
      });

      // Get recent orders
      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your store overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
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
                <p className="text-sm text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.todayRevenue.toFixed(2)}</p>
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
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Menu Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Order #{order.order_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.total_amount}</p>
                    <Badge
                      variant={order.status === 'delivered' ? 'success' : 'default'}
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDashboard;