import React, { useState, useEffect } from 'react';
import { laundryAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, DollarSign } from 'lucide-react';

const LaundryPricing = () => {
  const { toast } = useToast();
  const [pricing, setPricing] = useState([]);
  const [services, setServices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  
  const [pricingForm, setPricingForm] = useState({
    service_id: '',
    item_id: '',
    price_per_item: 0,
    price_per_kg: 0,
    pricing_type: 'per_item'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pricingRes, servicesRes, itemsRes] = await Promise.all([
        laundryAPI.getPricing({}),
        laundryAPI.getServices({}),
        laundryAPI.getItems({})
      ]);
      setPricing(pricingRes.data);
      setServices(servicesRes.data);
      setItems(itemsRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPricing) {
        await laundryAPI.updatePricing(editingPricing.id, pricingForm);
        toast({ title: 'Success', description: 'Pricing updated successfully' });
      } else {
        await laundryAPI.createPricing(pricingForm);
        toast({ title: 'Success', description: 'Pricing created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    }
  };

  const openEditDialog = (p) => {
    setEditingPricing(p);
    setPricingForm({
      service_id: p.service_id,
      item_id: p.item_id,
      price_per_item: p.price_per_item,
      price_per_kg: p.price_per_kg,
      pricing_type: p.pricing_type
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setPricingForm({ service_id: '', item_id: '', price_per_item: 0, price_per_kg: 0, pricing_type: 'per_item' });
    setEditingPricing(null);
  };

  const getServiceName = (id) => services.find(s => s.id === id)?.name || 'Unknown';
  const getItemName = (id) => items.find(i => i.id === id)?.name || 'Unknown';

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pricing</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Pricing</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPricing ? 'Edit Pricing' : 'Add Pricing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={pricingForm.service_id} onValueChange={(value) => setPricingForm({...pricingForm, service_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Item *</Label>
                <Select value={pricingForm.item_id} onValueChange={(value) => setPricingForm({...pricingForm, item_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                  <SelectContent>
                    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Pricing Type *</Label>
                <Select value={pricingForm.pricing_type} onValueChange={(value) => setPricingForm({...pricingForm, pricing_type: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_item">Per Item</SelectItem>
                    <SelectItem value="per_kg">Per Kilogram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingForm.pricing_type === 'per_item' && (
                <div className="space-y-2">
                  <Label>Price Per Item *</Label>
                  <Input type="number" step="0.01" value={pricingForm.price_per_item} onChange={(e) => setPricingForm({...pricingForm, price_per_item: parseFloat(e.target.value)})} required />
                </div>
              )}

              {pricingForm.pricing_type === 'per_kg' && (
                <div className="space-y-2">
                  <Label>Price Per Kg *</Label>
                  <Input type="number" step="0.01" value={pricingForm.price_per_kg} onChange={(e) => setPricingForm({...pricingForm, price_per_kg: parseFloat(e.target.value)})} required />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingPricing ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-3">Service</th>
                  <th className="text-left p-3">Item</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map(p => (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{getServiceName(p.service_id)}</td>
                    <td className="p-3">{getItemName(p.item_id)}</td>
                    <td className="p-3">{p.pricing_type === 'per_item' ? 'Per Item' : 'Per Kg'}</td>
                    <td className="p-3 font-semibold">
                      ₹{p.pricing_type === 'per_item' ? p.price_per_item : p.price_per_kg}
                      {p.pricing_type === 'per_kg' && '/kg'}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pricing.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No pricing found. Create your first pricing rule!</p>
        </div>
      )}
    </div>
  );
};

export default LaundryPricing;