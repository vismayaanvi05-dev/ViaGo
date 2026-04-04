import React, { useState, useEffect } from 'react';
import { laundryAPI } from '../../api/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import OrderStatusTimeline from '../../components/OrderStatusTimeline';
import { Eye, RefreshCw, Search } from 'lucide-react';

const LaundryOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });
  
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchOrders();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchOrders(true);
      }, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filters, autoRefresh]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = {};
      if (filters.status) params.status_filter = filters.status;
      
      const res = await laundryAPI.getOrders(params);
      let ordersData = res.data;
      
      if (filters.search) {
        ordersData = ordersData.filter(order => 
          order.order_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
          order.customer_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      setOrders(ordersData);
    } catch (error) {
      if (!silent) {
        toast({ title: 'Error', description: 'Failed to load orders', variant: 'destructive' });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleViewDetails = async (order) => {
    try {
      const res = await laundryAPI.getOrderDetails(order.id);
      setSelectedOrder(res.data);
      setDetailDialogOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load order details', variant: 'destructive' });
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await laundryAPI.updateOrderStatus(selectedOrder.id, statusForm);
      toast({ title: 'Success', description: 'Order status updated' });
      setStatusUpdateDialogOpen(false);
      setStatusForm({ status: '', notes: '' });
      fetchOrders();
      if (detailDialogOpen) {
        const updatedOrder = await laundryAPI.getOrderDetails(selectedOrder.id);
        setSelectedOrder(updatedOrder.data);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to update status', variant: 'destructive' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      pickup_assigned: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-purple-100 text-purple-800',
      at_facility: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-cyan-100 text-cyan-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-8">Loading orders...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Laundry Orders</h1>
          <p className="text-sm text-gray-600 mt-1">
            {autoRefresh && <span className="text-green-600">● Auto-refreshing every 30s</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchOrders()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by order number or customer name..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pickup_assigned">Pickup Assigned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="at_facility">At Facility</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Order #</th>
                  <th className="text-left p-4 font-medium">Customer</th>
                  <th className="text-left p-4 font-medium">Services</th>
                  <th className="text-left p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Pickup Time</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-mono text-sm">{order.order_number || order.id.slice(0, 8)}</span>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{order.customer_name || 'N/A'}</p>
                    </td>
                    <td className="p-4">{order.items?.length || 0}</td>
                    <td className="p-4 font-semibold">₹{order.total_amount || 0}</td>
                    <td className="p-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {order.pickup_time ? new Date(order.pickup_time).toLocaleString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(order)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laundry Order Details - #{selectedOrder?.order_number || selectedOrder?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold text-lg">₹{selectedOrder.total_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pickup Time</p>
                  <p className="font-medium">{selectedOrder.pickup_time ? new Date(selectedOrder.pickup_time).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Time</p>
                  <p className="font-medium">{selectedOrder.delivery_time ? new Date(selectedOrder.delivery_time).toLocaleString() : 'N/A'}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3">Service</th>
                        <th className="text-left p-3">Item</th>
                        <th className="text-left p-3">Qty</th>
                        <th className="text-left p-3">Price</th>
                        <th className="text-left p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-3">{item.service_name || 'N/A'}</td>
                          <td className="p-3">{item.item_name || 'N/A'}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">₹{item.price_per_item}</td>
                          <td className="p-3 font-medium">₹{item.total_price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Order Timeline</h3>
                <OrderStatusTimeline 
                  statusHistory={selectedOrder.status_history || []} 
                  currentStatus={selectedOrder.status}
                  module="laundry"
                />
              </div>

              {/* Actions */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => {
                    setStatusForm({ status: '', notes: '' });
                    setStatusUpdateDialogOpen(true);
                  }}>
                    Update Status
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select value={statusForm.status} onValueChange={(value) => setStatusForm({...statusForm, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup_assigned">Pickup Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="at_facility">At Facility</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input 
                value={statusForm.notes} 
                onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                placeholder="Add any notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateStatus} className="flex-1">Update</Button>
              <Button variant="outline" onClick={() => setStatusUpdateDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LaundryOrders;
