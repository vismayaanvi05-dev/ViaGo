import React, { useState, useEffect } from 'react';
import { groceryAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';

const GroceryProducts = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    brand: '',
    category_id: '',
    store_id: '',
    mrp: 0,
    selling_price: 0,
    unit_type: 'piece',
    unit_value: 1,
    current_stock: 0,
    low_stock_threshold: 10,
    is_organic: false,
    is_fresh: false,
    images: [],
    tags: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        groceryAPI.getProducts({}),
        groceryAPI.getCategories({})
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await groceryAPI.updateProduct(editingProduct.id, productForm);
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await groceryAPI.createProduct(productForm);
        toast({ title: 'Success', description: 'Product created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await groceryAPI.deleteProduct(id);
        toast({ title: 'Success', description: 'Product deleted successfully' });
        fetchData();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      brand: product.brand || '',
      category_id: product.category_id,
      store_id: product.store_id,
      mrp: product.mrp,
      selling_price: product.selling_price,
      unit_type: product.unit_type,
      unit_value: product.unit_value,
      current_stock: product.current_stock,
      low_stock_threshold: product.low_stock_threshold,
      is_organic: product.is_organic,
      is_fresh: product.is_fresh,
      images: product.images || [],
      tags: product.tags || []
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      brand: '',
      category_id: '',
      store_id: '',
      mrp: 0,
      selling_price: 0,
      unit_type: 'piece',
      unit_value: 1,
      current_stock: 0,
      low_stock_threshold: 10,
      is_organic: false,
      is_fresh: false,
      images: [],
      tags: []
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input value={productForm.name} onChange={(e) => setProductForm({...productForm, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input value={productForm.brand} onChange={(e) => setProductForm({...productForm, brand: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={productForm.category_id} onValueChange={(value) => setProductForm({...productForm, category_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>MRP *</Label>
                  <Input type="number" step="0.01" value={productForm.mrp} onChange={(e) => setProductForm({...productForm, mrp: parseFloat(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>Selling Price *</Label>
                  <Input type="number" step="0.01" value={productForm.selling_price} onChange={(e) => setProductForm({...productForm, selling_price: parseFloat(e.target.value)})} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit Type *</Label>
                  <Select value={productForm.unit_type} onValueChange={(value) => setProductForm({...productForm, unit_type: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="kg">Kilogram</SelectItem>
                      <SelectItem value="g">Gram</SelectItem>
                      <SelectItem value="litre">Litre</SelectItem>
                      <SelectItem value="ml">Millilitre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit Value</Label>
                  <Input type="number" step="0.01" value={productForm.unit_value} onChange={(e) => setProductForm({...productForm, unit_value: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input type="number" value={productForm.current_stock} onChange={(e) => setProductForm({...productForm, current_stock: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Low Stock Threshold</Label>
                  <Input type="number" value={productForm.low_stock_threshold} onChange={(e) => setProductForm({...productForm, low_stock_threshold: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={productForm.is_organic} onChange={(e) => setProductForm({...productForm, is_organic: e.target.checked})} />
                  <span>Organic</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={productForm.is_fresh} onChange={(e) => setProductForm({...productForm, is_fresh: e.target.checked})} />
                  <span>Fresh</span>
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingProduct ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.brand && <p className="text-sm text-gray-600">{product.brand}</p>}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(product)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">MRP:</span>
                  <span className="font-semibold">₹{product.mrp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-green-600">₹{product.selling_price}</span>
                </div>
                {product.discount_percentage > 0 && (
                  <Badge variant="secondary">{product.discount_percentage.toFixed(0)}% OFF</Badge>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-gray-600">Stock:</span>
                  <span className={product.current_stock <= product.low_stock_threshold ? 'text-red-600 font-semibold' : 'text-gray-900'}>
                    {product.current_stock} {product.unit_type}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  {product.is_organic && <Badge variant="outline" className="text-green-600">Organic</Badge>}
                  {product.is_fresh && <Badge variant="outline" className="text-blue-600">Fresh</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products found</p>
        </div>
      )}
    </div>
  );
};

export default GroceryProducts;