import React, { useState, useEffect } from 'react';
import { superAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Building2, Calendar } from 'lucide-react';

const Tenants = () => {
  const { toast } = useToast();
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  const [tenantForm, setTenantForm] = useState({
    name: '',
    business_type: 'single_vendor',
    active_modules: ['food'],
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: '',
    pricing_model: 'subscription',
    commission_percentage: 0,
  });

  useEffect(() => {
    fetchTenants();
    fetchPlans();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await superAdminAPI.getTenants();
      setTenants(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await superAdminAPI.getPlans({ is_active: true });
      setPlans(response.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        await superAdminAPI.updateTenant(editingTenant.id, tenantForm);
        toast({ title: "Success", description: "Tenant updated successfully" });
      } else {
        await superAdminAPI.createTenant(tenantForm);
        toast({ title: "Success", description: "Tenant created successfully" });
      }
      setDialogOpen(false);
      resetTenantForm();
      fetchTenants();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save tenant",
        variant: "destructive",
      });
    }
  };

  const handleAssignSubscription = async (e) => {
    e.preventDefault();
    try {
      await superAdminAPI.assignSubscription({
        tenant_id: selectedTenant.id,
        ...subscriptionForm
      });
      toast({ title: "Success", description: "Subscription assigned successfully" });
      setSubscriptionDialogOpen(false);
      resetSubscriptionForm();
      fetchTenants();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to assign subscription",
        variant: "destructive",
      });
    }
  };

  const resetTenantForm = () => {
    setTenantForm({
      name: '',
      business_type: 'single_vendor',
      active_modules: ['food'],
    });
    setEditingTenant(null);
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      plan_id: '',
      pricing_model: 'subscription',
      commission_percentage: 0,
    });
    setSelectedTenant(null);
  };

  const openEditTenant = (tenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.name,
      business_type: tenant.business_type,
      active_modules: tenant.active_modules,
    });
    setDialogOpen(true);
  };

  const openAssignSubscription = (tenant) => {
    setSelectedTenant(tenant);
    setSubscriptionDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage all businesses on your platform</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetTenantForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Create New Tenant'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Select
                  value={tenantForm.business_type}
                  onValueChange={(value) => setTenantForm({ ...tenantForm, business_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_vendor">Single Vendor</SelectItem>
                    <SelectItem value="multi_vendor">Multi Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Active Modules</Label>
                <div className="space-y-2">
                  {['food', 'grocery', 'laundry'].map((module) => (
                    <div key={module} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={module}
                        checked={tenantForm.active_modules.includes(module)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTenantForm({
                              ...tenantForm,
                              active_modules: [...tenantForm.active_modules, module]
                            });
                          } else {
                            setTenantForm({
                              ...tenantForm,
                              active_modules: tenantForm.active_modules.filter(m => m !== module)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={module} className="capitalize">{module}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTenant ? 'Update' : 'Create'} Tenant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subscription Assignment Dialog */}
      <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subscription to {selectedTenant?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubscription} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pricing_model">Pricing Model</Label>
              <Select
                value={subscriptionForm.pricing_model}
                onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, pricing_model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">Subscription Only</SelectItem>
                  <SelectItem value="commission">Commission Only</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(subscriptionForm.pricing_model === 'subscription' || subscriptionForm.pricing_model === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan</Label>
                <Select
                  value={subscriptionForm.plan_id}
                  onValueChange={(value) => setSubscriptionForm({ ...subscriptionForm, plan_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - ₹{plan.price}/{plan.billing_cycle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(subscriptionForm.pricing_model === 'commission' || subscriptionForm.pricing_model === 'hybrid') && (
              <div className="space-y-2">
                <Label htmlFor="commission">Commission Percentage (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.1"
                  value={subscriptionForm.commission_percentage}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, commission_percentage: parseFloat(e.target.value) })}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSubscriptionDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Assign Subscription</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tenants List */}
      {tenants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg mb-4">No tenants yet</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Tenant
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{tenant.name}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => openEditTenant(tenant)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="capitalize">{tenant.business_type.replace('_', ' ')}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tenant.active_modules?.map((module) => (
                    <Badge key={module} variant="secondary" className="capitalize">
                      {module}
                    </Badge>
                  ))}
                </div>

                <div className="pt-3 border-t">
                  <Badge variant={tenant.status === 'active' ? 'success' : 'destructive'}>
                    {tenant.status}
                  </Badge>
                </div>

                <Button
                  className="w-full mt-2"
                  variant="outline"
                  size="sm"
                  onClick={() => openAssignSubscription(tenant)}
                >
                  Assign Subscription
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tenants;