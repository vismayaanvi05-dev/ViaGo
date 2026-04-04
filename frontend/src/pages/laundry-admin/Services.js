import React, { useState, useEffect } from 'react';
import { laundryAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react';

const LaundryServices = () => {
  const { toast } = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    icon: '',
    is_active: true
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await laundryAPI.getServices({});
      setServices(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await laundryAPI.updateService(editingService.id, serviceForm);
        toast({ title: 'Success', description: 'Service updated successfully' });
      } else {
        await laundryAPI.createService(serviceForm);
        toast({ title: 'Success', description: 'Service created successfully' });
      }
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Operation failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await laundryAPI.deleteService(id);
        toast({ title: 'Success', description: 'Service deleted successfully' });
        fetchServices();
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
      }
    }
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      icon: service.icon || '',
      is_active: service.is_active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setServiceForm({ name: '', description: '', icon: '', is_active: true });
    setEditingService(null);
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Services</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input value={serviceForm.name} onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})} required placeholder="e.g., Wash, Iron, Dry Clean" />
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={serviceForm.description} onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})} placeholder="Brief description of the service" />
              </div>

              <div className="space-y-2">
                <Label>Icon (emoji or text)</Label>
                <Input value={serviceForm.icon} onChange={(e) => setServiceForm({...serviceForm, icon: e.target.value})} placeholder="🧺 or text icon" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={serviceForm.is_active} onChange={(e) => setServiceForm({...serviceForm, is_active: e.target.checked})} />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">{editingService ? 'Update' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {service.icon && <span className="text-2xl">{service.icon}</span>}
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEditDialog(service)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(service.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <Badge variant={service.is_active ? "default" : "secondary"}>
                {service.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No services found. Create your first service!</p>
        </div>
      )}
    </div>
  );
};

export default LaundryServices;