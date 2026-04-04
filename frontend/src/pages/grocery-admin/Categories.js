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
import { Plus, Edit, Trash2, FolderTree, ChevronRight } from 'lucide-react';

const GroceryCategories = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: null,
    sort_order: 0
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await groceryAPI.getCategories({});
      setCategories(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await groceryAPI.updateCategory(editingCategory.id, categoryForm);
        toast({ title: 'Success', description: 'Category updated successfully' });
      } else {
        await groceryAPI.createCategory(categoryForm);
        toast({ title: 'Success', description: 'Category created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await groceryAPI.deleteCategory(id);
        toast({ title: 'Success', description: 'Category deleted successfully' });
        fetchCategories();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      sort_order: category.sort_order
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setCategoryForm({ name: '', description: '', parent_id: null, sort_order: 0 });
    setEditingCategory(null);
  };

  const parentCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId) => categories.filter(cat => cat.parent_id === parentId);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} required />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Parent Category (for subcategory)</Label>
                <Select value={categoryForm.parent_id || 'none'} onValueChange={(value) => setCategoryForm({...categoryForm, parent_id: value === 'none' ? null : value})}>
                  <SelectTrigger><SelectValue placeholder="None (Main Category)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Main Category)</SelectItem>
                    {parentCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value)})} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingCategory ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Hierarchy */}
      <div className="space-y-4">
        {parentCategories.map(parent => (
          <Card key={parent.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5 text-green-600" />
                  <CardTitle>{parent.name}</CardTitle>
                  <Badge>{getSubcategories(parent.id).length} subcategories</Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(parent)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(parent.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
            </CardHeader>
            {getSubcategories(parent.id).length > 0 && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {getSubcategories(parent.id).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <span>{sub.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(sub)}><Edit className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)}><Trash2 className="h-3 w-3 text-red-600" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {parentCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderTree className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No categories found. Create your first category!</p>
        </div>
      )}
    </div>
  );
};

export default GroceryCategories;