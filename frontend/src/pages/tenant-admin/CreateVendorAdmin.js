import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { tenantAdminAPI } from '@/api/client';
import { Plus, Edit, Trash2, User, Store } from 'lucide-react';

const VendorAdminManagement = () => {
  const { toast } = useToast();
  const [vendorAdmins, setVendorAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  const [formData, setFormData] = useState({
    store_id: '',
    name: '',
    email: '',
    password: '',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vendorsRes, storesRes] = await Promise.all([
        tenantAdminAPI.getVendorAdmins(),
        tenantAdminAPI.getStores()
      ]);
      setVendorAdmins(vendorsRes.data);
      setStores(storesRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingVendor) {
        // Update vendor admin
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Don't send empty password
        
        await tenantAdminAPI.updateVendorAdmin(editingVendor.id, updateData);
        toast({
          title: "Success",
          description: "Vendor Admin updated successfully"
        });
      } else {
        // Create new vendor admin
        await tenantAdminAPI.createVendorAdmin(formData);
        toast({
          title: "Success",
          description: "Vendor Admin created successfully"
        });
      }
      
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Operation failed",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this Vendor Admin?')) return;
    
    try {
      await tenantAdminAPI.deleteVendorAdmin(vendorId);
      toast({
        title: "Success",
        description: "Vendor Admin deleted successfully"
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete Vendor Admin",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      store_id: vendor.store_id,
      name: vendor.name,
      email: vendor.email,
      password: '', // Don't pre-fill password
      status: vendor.status || 'active'
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      store_id: '',
      name: '',
      email: '',
      password: '',
      status: 'active'
    });
    setEditingVendor(null);
  };

  const getStoreName = (storeId) => {
    return stores.find(s => s.id === storeId)?.name || 'Unknown Store';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Admins</h1>
          <p className="text-sm text-gray-600 mt-1">Manage vendor administrators for your stores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor Admin' : 'Create Vendor Admin'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Store *</Label>
                <Select
                  value={formData.store_id}
                  onValueChange={(value) => setFormData({ ...formData, store_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{editingVendor ? 'Password (leave blank to keep current)' : 'Password *'}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingVendor}
                />
                {editingVendor && (
                  <p className="text-xs text-gray-500">Only fill if you want to change the password</p>
                )}
              </div>

              {editingVendor && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingVendor ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vendor Admins List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Store</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Created</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendorAdmins.map(vendor => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{vendor.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-gray-600" />
                        <span>{getStoreName(vendor.store_id)}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                        {vendor.status || 'active'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(vendor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendorAdmins.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No Vendor Admins Yet</p>
                <p className="text-sm">Create your first vendor admin to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAdminManagement;
