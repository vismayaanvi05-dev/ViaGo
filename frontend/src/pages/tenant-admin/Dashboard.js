import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, Store, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [salesReport, walletReport] = await Promise.all([
        tenantAdminAPI.getSalesReport(),
        tenantAdminAPI.getWalletReport()
      ]);
      
      setStats({
        sales: salesReport.data,
        wallet: walletReport.data.wallet
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.sales?.total_revenue?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sales?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.wallet?.balance?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Available balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Markup</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats?.sales?.total_admin_markup?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Your profit margin</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₹{stats?.sales?.total_subtotal?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Admin Markup</span>
                <span className="font-semibold text-green-600">₹{stats?.sales?.total_admin_markup?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charges</span>
                <span className="font-semibold">₹{stats?.sales?.total_delivery_charges?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax Collected</span>
                <span className="font-semibold">₹{stats?.sales?.total_tax?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="text-gray-600">Platform Commission</span>
                <span className="font-semibold text-red-600">-₹{stats?.sales?.total_commission?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="font-bold">Net Payout</span>
                <span className="font-bold text-lg">₹{stats?.sales?.total_vendor_payout?.toLocaleString() || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/tenant-admin/stores'}>
              <Store className="h-4 w-4 mr-2" />
              Manage Stores
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/tenant-admin/menu'}>
              <MenuSquare className="h-4 w-4 mr-2" />
              Update Menu
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/tenant-admin/orders'}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              View Orders
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => window.location.href = '/tenant-admin/settings'}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;