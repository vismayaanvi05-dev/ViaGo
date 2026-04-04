import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ChefHat, DollarSign } from 'lucide-react';

const MenuBuilder = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  // Item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category_id: '',
    base_price: 0,
    admin_markup_percentage: null,
    is_veg: true,
    is_available: true,
    is_featured: false,
  });

  useEffect(() => {
    fetchStores();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchCategories();
      fetchItems();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const response = await tenantAdminAPI.getStores({ store_type: 'restaurant' });
      setStores(response.data);
      if (response.data.length > 0) {
        setSelectedStore(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await tenantAdminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await tenantAdminAPI.getCategories({ 
        store_id: selectedStore,
        module: 'food'
      });
      setCategories(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const fetchItems = async () => {
    if (!selectedStore) return;
    
    try {
      const params = { 
        store_id: selectedStore,
        module: 'food'
      };
      
      const response = await tenantAdminAPI.getItems(params);
      setItems(response.data || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      setItems([]);
      // Only show error toast if it's not a "no items" scenario
      if (error.response?.status !== 404) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to load items",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Item Management
  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...itemForm,
        store_id: selectedStore,
        module: 'food',
      };
      
      await tenantAdminAPI.createItem(data);
      toast({ title: "Success", description: "Item created successfully" });
      setItemDialogOpen(false);
      resetItemForm();
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create item",
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      await tenantAdminAPI.updateItem(editingItem.id, itemForm);
      toast({ title: "Success", description: "Item updated successfully" });
      setItemDialogOpen(false);
      resetItemForm();
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await tenantAdminAPI.deleteItem(itemId);
        toast({ title: "Success", description: "Item deleted successfully" });
        fetchItems();
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to delete item",
          variant: "destructive",
        });
      }
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      category_id: '',
      base_price: 0,
      admin_markup_percentage: null,
      is_veg: true,
      is_available: true,
      is_featured: false,
    });
    setEditingItem(null);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      base_price: item.base_price,
      admin_markup_percentage: item.admin_markup_percentage,
      is_veg: item.is_veg,
      is_available: item.is_available,
      is_featured: item.is_featured,
    });
    setItemDialogOpen(true);
  };

  const calculateFinalPrice = () => {
    const basePrice = parseFloat(itemForm.base_price) || 0;
    const markup = parseFloat(itemForm.admin_markup_percentage) || 
                   parseFloat(settings?.default_admin_markup_percentage) || 0;
    const markupAmount = (basePrice * markup) / 100;
    return basePrice + markupAmount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ChefHat className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stores Found</h3>
            <p className="text-gray-600 mb-4">Please create a store first to manage menu</p>
            <Button onClick={() => window.location.href = '/tenant-admin/stores'}>
              Go to Stores
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content - Items */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Builder</h1>
            <p className="text-gray-600 mt-1">Manage your food items</p>
          </div>
          <div className="flex gap-4">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={itemDialogOpen} onOpenChange={(open) => {
              setItemDialogOpen(open);
              if (!open) resetItemForm();
            }}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetItemForm();
                  setItemDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-name">Item Name *</Label>
                      <Input
                        id="item-name"
                        value={itemForm.name}
                        onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-category">Category *</Label>
                      <Select
                        value={itemForm.category_id}
                        onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="item-desc">Description</Label>
                    <Textarea
                      id="item-desc"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-price">Base Price (₹) *</Label>
                      <Input
                        id="item-price"
                        type="number"
                        step="0.01"
                        value={itemForm.base_price}
                        onChange={(e) => setItemForm({ ...itemForm, base_price: parseFloat(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-markup">
                        Admin Markup (%) 
                        <span className="text-xs text-gray-500 ml-1">
                          (Default: {settings?.default_admin_markup_percentage || 0}%)
                        </span>
                      </Label>
                      <Input
                        id="item-markup"
                        type="number"
                        step="0.1"
                        value={itemForm.admin_markup_percentage || ''}
                        onChange={(e) => setItemForm({ 
                          ...itemForm, 
                          admin_markup_percentage: e.target.value ? parseFloat(e.target.value) : null 
                        })}
                        placeholder={`Default: ${settings?.default_admin_markup_percentage || 0}`}
                      />
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                      <span className="font-semibold text-gray-900">Price Calculation</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">₹{itemForm.base_price || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Markup ({itemForm.admin_markup_percentage || settings?.default_admin_markup_percentage || 0}%):</span>
                        <span className="font-medium text-green-600">
                          +₹{((itemForm.base_price || 0) * (itemForm.admin_markup_percentage || settings?.default_admin_markup_percentage || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="font-semibold">Customer Pays:</span>
                        <span className="font-bold text-orange-600">₹{calculateFinalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="item-veg">Vegetarian</Label>
                      <Switch
                        id="item-veg"
                        checked={itemForm.is_veg}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, is_veg: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="item-available">Available</Label>
                      <Switch
                        id="item-available"
                        checked={itemForm.is_available}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, is_available: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="item-featured">Featured Item</Label>
                      <Switch
                        id="item-featured"
                        checked={itemForm.is_featured}
                        onCheckedChange={(checked) => setItemForm({ ...itemForm, is_featured: checked })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setItemDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Create'} Item
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-lg mb-4">No items in this category</p>
              <Button onClick={() => setItemDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {item.name}
                        {item.is_veg !== null && (
                          <Badge variant={item.is_veg ? "success" : "destructive"} className="text-xs">
                            {item.is_veg ? '🟢' : '🔴'}
                          </Badge>
                        )}
                      </CardTitle>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Base Price:</span>
                      <span className="font-medium">₹{item.base_price}</span>
                    </div>
                    {item.admin_markup_percentage > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Your Markup:</span>
                        <span className="text-sm font-medium text-green-600">
                          +{item.admin_markup_percentage}% (₹{item.admin_markup_amount?.toFixed(2)})
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="font-semibold">Customer Pays:</span>
                      <span className="text-lg font-bold text-orange-600">
                        ₹{(item.base_price + (item.admin_markup_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.is_featured && (
                        <Badge variant="secondary">Featured</Badge>
                      )}
                      <Badge variant={item.is_available ? "success" : "destructive"}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBuilder;
