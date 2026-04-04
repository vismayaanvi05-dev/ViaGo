import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import apiClient, { tenantAdminAPI } from '@/api/client';

const CreateVendorAdmin = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    store_id: '',
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await tenantAdminAPI.getStores();
      console.log('Stores response:', response.data);
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await tenantAdminAPI.createVendorAdmin(formData);
      
      toast({
        title: "Success",
        description: `Vendor Admin created for ${response.data.user.store_name}`
      });

      // Reset form
      setFormData({
        store_id: '',
        name: '',
        email: '',
        password: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create vendor admin",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Create Vendor Admin</h1>
        <p className="text-gray-600 mb-6">
          For multi-vendor setup: Give restaurant/store owners their own login to manage their menu and orders.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Admin Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store">Select Store/Restaurant</Label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  No stores? Create one from the Stores page first.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Owner/Manager Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Restaurant Owner"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Username)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@restaurant.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  This will be their username for login
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500">
                  Minimum 6 characters
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating...' : 'Create Vendor Admin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">💡 Vendor Admin Access:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>✅ Manage their store menu & items</li>
            <li>✅ View and process orders for their store</li>
            <li>✅ Update store timings & settings</li>
            <li>❌ Cannot see other stores' data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateVendorAdmin;
