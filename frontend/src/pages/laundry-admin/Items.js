import React, { useState, useEffect } from 'react';
import { laundryAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';

const LaundryItems = () => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    icon: '',
    is_active: true
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await laundryAPI.getItems({});
      setItems(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await laundryAPI.updateItem(editingItem.id, itemForm);
        toast({ title: 'Success', description: 'Item updated successfully' });
      } else {
        await laundryAPI.createItem(itemForm);
        toast({ title: 'Success', description: 'Item created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      fetchItems();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await laundryAPI.deleteItem(id);
        toast({ title: 'Success', description: 'Item deleted successfully' });
        fetchItems();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      category: item.category || '',
      icon: item.icon || '',
      is_active: item.is_active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setItemForm({ name: '', category: '', icon: '', is_active: true });
    setEditingItem(null);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Items</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input value={itemForm.name} onChange={(e) => setItemForm({...itemForm, name: e.target.value})} required placeholder="e.g., Shirt, Pants, Towel" />
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={itemForm.category} onChange={(e) => setItemForm({...itemForm, category: e.target.value})} placeholder="e.g., Clothing, Bedding, Accessories" />
              </div>

              <div className="space-y-2">
                <Label>Icon (emoji or text)</Label>
                <Input value={itemForm.icon} onChange={(e) => setItemForm({...itemForm, icon: e.target.value})} placeholder="👕 or text icon" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={itemForm.is_active} onChange={(e) => setItemForm({...itemForm, is_active: e.target.checked})} />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingItem ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-xl">{item.icon}</span>}
                  <CardTitle className="text-base">{item.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(item)}><Edit className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.category && <p className="text-xs text-gray-600 mb-1">{item.category}</p>}
              <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No items found. Create your first item!</p>
        </div>
      )}
    </div>
  );
};

export default LaundryItems;