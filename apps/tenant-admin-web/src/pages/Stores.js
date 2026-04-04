import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Stores = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    store_type: 'restaurant',
    description: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    delivery_radius_km: 5,
    minimum_order_value: 0,
    average_prep_time_minutes: 30,
    cuisine_types: [],
    opening_time: '09:00',
    closing_time: '22:00',
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await tenantAdminAPI.getStores({ store_type: 'restaurant' });
      setStores(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStore) {
        await tenantAdminAPI.updateStore(editingStore.id, formData);
        toast({ title: "Success", description: "Store updated successfully" });
      } else {
        await tenantAdminAPI.createStore(formData);
        toast({ title: "Success", description: "Store created successfully" });
      }
      setDialogOpen(false);
      resetForm();
      fetchStores();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save store",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      store_type: 'restaurant',
      description: '',
      address_line: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      delivery_radius_km: 5,
      minimum_order_value: 0,
      average_prep_time_minutes: 30,
      cuisine_types: [],
      opening_time: '09:00',
      closing_time: '22:00',
    });
    setEditingStore(null);
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      store_type: store.store_type,
      description: store.description || '',
      address_line: store.address_line,
      city: store.city,
      state: store.state,
      pincode: store.pincode,
      phone: store.phone || '',
      email: store.email || '',
      delivery_radius_km: store.delivery_radius_km,
      minimum_order_value: store.minimum_order_value,
      average_prep_time_minutes: store.average_prep_time_minutes,
      cuisine_types: store.cuisine_types || [],
      opening_time: store.opening_time || '09:00',
      closing_time: store.closing_time || '22:00',
    });
    setDialogOpen(true);
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <p className="text-gray-600 mt-1">Manage your restaurants</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Store Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={formData.address_line}
                  onChange={(e) => setFormData({ ...formData, address_line: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening">Opening Time</Label>
                  <Input
                    id="opening"
                    type="time"
                    value={formData.opening_time}
                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing">Closing Time</Label>
                  <Input
                    id="closing"
                    type="time"
                    value={formData.closing_time}
                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="radius">Delivery Radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={formData.delivery_radius_km}
                    onChange={(e) => setFormData({ ...formData, delivery_radius_km: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_order">Min Order (₹)</Label>
                  <Input
                    id="min_order"
                    type="number"
                    value={formData.minimum_order_value}
                    onChange={(e) => setFormData({ ...formData, minimum_order_value: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prep_time">Prep Time (min)</Label>
                  <Input
                    id="prep_time"
                    type="number"
                    value={formData.average_prep_time_minutes}
                    onChange={(e) => setFormData({ ...formData, average_prep_time_minutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingStore ? 'Update' : 'Create'} Store
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 text-lg mb-4">No stores yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{store.name}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(store)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                {store.description && (
                  <p className="text-sm text-gray-600">{store.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p>{store.address_line}</p>
                    <p>{store.city}, {store.state} - {store.pincode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{store.opening_time} - {store.closing_time}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Radius: {store.delivery_radius_km}km</Badge>
                  <Badge variant="secondary">Min: ₹{store.minimum_order_value}</Badge>
                  <Badge variant={store.is_active ? "success" : "destructive"}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;