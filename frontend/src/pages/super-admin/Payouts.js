import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/api/client';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';

const Payouts = () => {
  const [payouts, setPayouts] = useState([
    {
      id: '1',
      tenant_name: 'FoodPlaza',
      vendor_name: 'Pizza Paradise',
      amount: 15000,
      status: 'pending',
      period: 'June 2026',
      orders_count: 45,
      created_at: '2026-06-25'
    },
    {
      id: '2',
      tenant_name: 'FoodPlaza',
      vendor_name: 'Burger Hub',
      amount: 12500,
      status: 'pending',
      period: 'June 2026',
      orders_count: 38,
      created_at: '2026-06-25'
    },
    {
      id: '3',
      tenant_name: 'Food Panda',
      vendor_name: 'Spice Garden',
      amount: 18200,
      status: 'completed',
      period: 'May 2026',
      orders_count: 52,
      created_at: '2026-05-28',
      processed_at: '2026-06-01'
    },
  ]);

  const processPayout = async (payoutId) => {
    try {
      // In real implementation, call API
      setPayouts(prev => 
        prev.map(p => 
          p.id === payoutId 
            ? { ...p, status: 'completed', processed_at: new Date().toISOString().split('T')[0] }
            : p
        )
      );
    } catch (error) {
      console.error('Process payout error:', error);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      completed: 'success',
      failed: 'destructive'
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        {icons[status]}
        {status}
      </Badge>
    );
  };

  const pendingTotal = payouts
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendor Payouts</h1>
        <div className="text-right">
          <p className="text-sm text-gray-600">Pending Payouts</p>
          <p className="text-2xl font-bold text-orange-600">₹{pendingTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        {payouts.map((payout) => (
          <Card key={payout.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold">{payout.vendor_name}</h3>
                    {getStatusBadge(payout.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Tenant: {payout.tenant_name}</p>
                    <p>Period: {payout.period} • {payout.orders_count} orders</p>
                    <p>Requested: {payout.created_at}</p>
                    {payout.processed_at && <p>Processed: {payout.processed_at}</p>}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 mb-3">
                    ₹{payout.amount.toLocaleString()}
                  </div>
                  {payout.status === 'pending' && (
                    <Button 
                      onClick={() => processPayout(payout.id)}
                      size="sm"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Process Payout
                    </Button>
                  )}
                  {payout.status === 'completed' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Paid
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {payouts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payouts to process</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Payouts;
