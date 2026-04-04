import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';

const Categories = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [categories, setCategories] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    parent_id: null,
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      fetchCategories();
    }
  }, [selectedStore]);

  const fetchStores = async () => {
    try {
      const response = await tenantAdminAPI.getStores({});
      const storeList = response.data || [];
      setStores(storeList);
      if (storeList.length > 0) {
        setSelectedStore(storeList[0].id);
      }
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

  const fetchCategories = async () => {
    try {
      const response = await tenantAdminAPI.getCategories({
        store_id: selectedStore,
        module: 'food'
      });
      setCategories(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await tenantAdminAPI.createCategory({
        ...categoryForm,
        store_id: selectedStore,
        module: 'food'
      });
      toast({ title: "Success", description: editingCategory ? "Category updated" : "Category created successfully" });
      fetchCategories();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      await tenantAdminAPI.updateCategory(editingCategory.id, categoryForm);
      toast({ title: "Success", description: "Category updated successfully" });
      fetchCategories();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = findCategoryById(categoryId);
    const subCategories = categories.filter(c => c.parent_id === categoryId);
    
    if (subCategories.length > 0) {
      toast({
        title: "Cannot Delete",
        description: "Please delete all sub-categories first",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await tenantAdminAPI.deleteCategory(categoryId);
        toast({ title: "Success", description: "Category deleted successfully" });
        fetchCategories();
      } catch (error) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to delete category",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      parent_id: null,
    });
    setEditingCategory(null);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || null,
    });
    setDialogOpen(true);
  };

  const openAddSubCategoryDialog = (parentCategory) => {
    resetForm();
    setCategoryForm({
      name: '',
      description: '',
      parent_id: parentCategory.id,
    });
    setDialogOpen(true);
  };

  const findCategoryById = (id) => {
    return categories.find(c => c.id === id);
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getMainCategories = () => {
    return categories.filter(c => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order);
  };

  const getSubCategories = (parentId) => {
    return categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);
  };

  const renderCategoryTree = () => {
    const mainCategories = getMainCategories();

    return mainCategories.map((category) => {
      const subCategories = getSubCategories(category.id);
      const isExpanded = expandedCategories.has(category.id);
      const hasSubCategories = subCategories.length > 0;

      return (
        <div key={category.id} className="mb-2">
          {/* Main Category */}
          <div className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 flex-1">
              {hasSubCategories ? (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <FolderOpen className="h-5 w-5 text-orange-600" />
                  ) : (
                    <Folder className="h-5 w-5 text-orange-600" />
                  )}
                </button>
              ) : (
                <Folder className="h-5 w-5 text-gray-400" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-500">{category.description}</p>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {subCategories.length} sub-categories
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openAddSubCategoryDialog(category)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Sub
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditDialog(category)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteCategory(category.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sub-categories */}
          {isExpanded && hasSubCategories && (
            <div className="ml-8 mt-2 space-y-2">
              {subCategories.map((subCategory) => (
                <div
                  key={subCategory.id}
                  className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-800">{subCategory.name}</h4>
                      {subCategory.description && (
                        <p className="text-xs text-gray-500">{subCategory.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(subCategory)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(subCategory.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories & Sub-categories</h1>
          <p className="text-gray-600 mt-1">Organize your menu structure</p>
        </div>
        <div className="flex gap-3">
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

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Main Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory 
                    ? 'Edit Category' 
                    : categoryForm.parent_id 
                      ? `Add Sub-category under "${findCategoryById(categoryForm.parent_id)?.name}"`
                      : 'Add Main Category'
                  }
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                {!categoryForm.parent_id && !editingCategory?.parent_id && (
                  <div className="space-y-2">
                    <Label htmlFor="parent">Parent Category (Optional)</Label>
                    <Select
                      value={categoryForm.parent_id || 'none'}
                      onValueChange={(val) => setCategoryForm({ ...categoryForm, parent_id: val === 'none' ? null : val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Main Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Main Category (No Parent)</SelectItem>
                        {getMainCategories().map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCategory ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-4">Create your first category to organize your menu</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {renderCategoryTree()}
        </div>
      )}
    </div>
  );
};

export default Categories;
