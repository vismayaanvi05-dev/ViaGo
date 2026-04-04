import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Store, Clock, MapPin, Phone, Mail } from 'lucide-react';

const VendorSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [storeForm, setStoreForm] = useState({
    name: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    opening_time: '09:00',
    closing_time: '22:00',
    packaging_charge: 0,
    service_charge: 0,
    is_active: true,
    accepts_cod: true,
    accepts_online: true,
  });
  const [storeId, setStoreId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchStoreDetails();
  }, []);

  const fetchStoreDetails = async () => {
    setLoading(true);
    try {
      const response = await vendorAPI.getStore();
      const stores = response.data || [];
      const store = stores[0]; // Vendor has only one store
      
      if (store) {
        setStoreId(store.id);
        setStoreForm({
          name: store.name || '',
          address_line: store.address_line || '',
          city: store.city || '',
          state: store.state || '',
          pincode: store.pincode || '',
          phone: store.phone || '',
          email: store.email || '',
          opening_time: store.opening_time || '09:00',
          closing_time: store.closing_time || '22:00',
          packaging_charge: store.packaging_charge || 0,
          service_charge: store.service_charge || 0,
          is_active: store.is_active !== false,
          accepts_cod: store.accepts_cod !== false,
          accepts_online: store.accepts_online !== false,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load store details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStoreUpdate = async (e) => {
    e.preventDefault();
    try {
      await vendorAPI.updateStore(storeForm);
      toast({ title: "Success", description: "Store settings updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    try {
      await vendorAPI.changePassword(passwordForm);
      toast({ title: "Success", description: "Password changed successfully" });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to change password",
        variant: "destructive",
      });
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
        <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
        <p className="text-gray-600 mt-1">Manage your store information and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Store Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Store Name *</Label>
                  <Input
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Address *</Label>
                  <Textarea
                    value={storeForm.address_line}
                    onChange={(e) => setStoreForm({ ...storeForm, address_line: e.target.value })}
                    rows={2}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    value={storeForm.state}
                    onChange={(e) => setStoreForm({ ...storeForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit">Save Changes</Button>

        {/* Restaurant Charges */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Packaging Charge (₹)</Label>
                  <Input
                    type="number"
                    value={storeForm.packaging_charge}
                    onChange={(e) => setStoreForm({ ...storeForm, packaging_charge: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500">Added to each order</p>
                </div>
                <div className="space-y-2">
                  <Label>Service Charge (%)</Label>
                  <Input
                    type="number"
                    value={storeForm.service_charge}
                    onChange={(e) => setStoreForm({ ...storeForm, service_charge: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500">% of order value</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Note: Delivery fee is managed by tenant admin</p>
              <Button type="submit">Save All Settings</Button>
            </form>
          </CardContent>
        </Card>

            </form>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={storeForm.opening_time}
                  onChange={(e) => setStoreForm({ ...storeForm, opening_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={storeForm.closing_time}
                  onChange={(e) => setStoreForm({ ...storeForm, closing_time: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label>Store Currently Active</Label>
                <p className="text-sm text-gray-500">Accept new orders</p>
              </div>
              <Switch
                checked={storeForm.is_active}
                onCheckedChange={(checked) => setStoreForm({ ...storeForm, is_active: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label>Accept Cash on Delivery</Label>
                <Switch
                  checked={storeForm.accepts_cod}
                  onCheckedChange={(checked) => setStoreForm({ ...storeForm, accepts_cod: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Label>Accept Online Payments</Label>
                <Switch
                  checked={storeForm.accepts_online}
                  onCheckedChange={(checked) => setStoreForm({ ...storeForm, accepts_online: checked })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit">Change Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorSettings;