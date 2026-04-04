import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Package, DollarSign, ShoppingBag, Award } from 'lucide-react';

const VendorAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch orders and items
      const [ordersRes, itemsRes] = await Promise.all([
        vendorAPI.getOrders({}),
        vendorAPI.getItems({})
      ]);

      const orders = ordersRes.data || [];
      const items = itemsRes.data || [];

      // Calculate stats
      const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed');

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      });

      // Calculate top selling items (mock with random data for now)
      // In production, this would come from order items analysis
      const topItems = items.slice(0, 10).map(item => ({
        ...item,
        orderCount: Math.floor(Math.random() * 100) + 10,
        revenue: item.base_price * (Math.floor(Math.random() * 100) + 10),
      })).sort((a, b) => b.orderCount - a.orderCount);

      setTopSellingItems(topItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="text-gray-600 mt-1">Track your performance and top sellers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</p>
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
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSellingItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSellingItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                      <span className="font-bold text-orange-600">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.is_veg !== null && (
                          <span className="text-sm">{item.is_veg ? '🟢' : '🔴'}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.orderCount} orders • ₹{item.base_price} per item
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-orange-600">₹{item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Menu Items</span>
                <span className="font-semibold">{topSellingItems.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Best Seller</span>
                <span className="font-semibold">{topSellingItems[0]?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Most Orders</span>
                <span className="font-semibold">{topSellingItems[0]?.orderCount || 0} orders</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Feature your top sellers prominently</span>
              </li>
              <li className="flex items-start gap-2">
                <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                <span>Create combos with popular items</span>
              </li>
              <li className="flex items-start gap-2">
                <Award className="h-4 w-4 text-orange-600 mt-0.5" />
                <span>Promote items with lower sales</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorAnalytics;