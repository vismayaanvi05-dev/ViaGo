import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/api/client';
import { Building2, Settings, CreditCard, Users, Truck } from 'lucide-react';

const EnhancedCreateTenant = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    business_type: 'multi_vendor',
    active_modules: ['food'],
    contact_email: '',
    contact_phone: '',
    
    // Feature Configuration
    payment_methods: ['cod', 'online'],
    
    // Admin Controls
    can_manage_delivery_fees: true,
    can_manage_tax: true,
    can_manage_commission: true,
    
    // Apps Enabled
    delivery_boy_app_enabled: true,
    vendor_admin_app_enabled: true,
    customer_app_enabled: true,
    
    // Permissions
    tenant_admin_can_create_delivery_boys: true,
    tenant_admin_can_create_vendors: true,
    
    // Delivery & Commission
    delivery_fee_type: 'distance_based',
    platform_commission_percentage: 10.0,
  });

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({ ...prev, [field]: checked }));
  };

  const handlePaymentMethodToggle = (method, checked) => {
    setFormData(prev => {
      const methods = checked 
        ? [...prev.payment_methods, method]
        : prev.payment_methods.filter(m => m !== method);
      return { ...prev, payment_methods: methods };
    });
  };

  const handleModuleToggle = (module, checked) => {
    setFormData(prev => {
      const modules = checked 
        ? [...prev.active_modules, module]
        : prev.active_modules.filter(m => m !== module);
      return { ...prev, active_modules: modules };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.createTenantEnhanced(formData);
      
      toast({
        title: "Success",
        description: `Tenant "${formData.name}" created successfully!`
      });

      navigate('/super-admin/tenants');
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create tenant",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Create New Tenant</h1>
        <p className="text-gray-600 mb-6">
          Configure a new business with custom features and permissions
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., FoodHub Inc"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Business Type *</Label>
                  <Select
                    value={formData.business_type}
                    onValueChange={(val) => setFormData({...formData, business_type: val})}
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
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    placeholder="contact@business.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="9876543210"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Active Modules</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.active_modules.includes('food')}
                      onCheckedChange={(checked) => handleModuleToggle('food', checked)}
                    />
                    <span>🍔 Food Delivery</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.active_modules.includes('grocery')}
                      onCheckedChange={(checked) => handleModuleToggle('grocery', checked)}
                    />
                    <span>🛒 Grocery</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.active_modules.includes('laundry')}
                      onCheckedChange={(checked) => handleModuleToggle('laundry', checked)}
                    />
                    <span>🧺 Laundry</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.payment_methods.includes('cod')}
                    onCheckedChange={(checked) => handlePaymentMethodToggle('cod', checked)}
                  />
                  <span>💵 Cash on Delivery</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.payment_methods.includes('online')}
                    onCheckedChange={(checked) => handlePaymentMethodToggle('online', checked)}
                  />
                  <span>💳 Online Payment</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.payment_methods.includes('card')}
                    onCheckedChange={(checked) => handlePaymentMethodToggle('card', checked)}
                  />
                  <span>💳 Card Payment</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.payment_methods.includes('upi')}
                    onCheckedChange={(checked) => handlePaymentMethodToggle('upi', checked)}
                  />
                  <span>📱 UPI</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.payment_methods.includes('wallet')}
                    onCheckedChange={(checked) => handlePaymentMethodToggle('wallet', checked)}
                  />
                  <span>👛 Wallet</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Admin Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tenant Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.can_manage_delivery_fees}
                    onCheckedChange={(checked) => handleCheckboxChange('can_manage_delivery_fees', checked)}
                  />
                  <span>Can manage delivery fees</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.can_manage_tax}
                    onCheckedChange={(checked) => handleCheckboxChange('can_manage_tax', checked)}
                  />
                  <span>Can manage tax settings</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.can_manage_commission}
                    onCheckedChange={(checked) => handleCheckboxChange('can_manage_commission', checked)}
                  />
                  <span>Can manage commission/markup</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Delivery Fee Type</Label>
                  <Select
                    value={formData.delivery_fee_type}
                    onValueChange={(val) => setFormData({...formData, delivery_fee_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                      <SelectItem value="distance_based">Distance Based</SelectItem>
                      <SelectItem value="area_based">Area Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Platform Commission (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.platform_commission_percentage}
                    onChange={(e) => setFormData({...formData, platform_commission_percentage: parseFloat(e.target.value)})}
                    placeholder="10.0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Apps & Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Apps & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">Enable/disable apps for this tenant</p>
                
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.customer_app_enabled}
                    onCheckedChange={(checked) => handleCheckboxChange('customer_app_enabled', checked)}
                  />
                  <span>📱 Customer App (Mobile)</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.delivery_boy_app_enabled}
                    onCheckedChange={(checked) => handleCheckboxChange('delivery_boy_app_enabled', checked)}
                  />
                  <span>🛵 Delivery Boy App (Mobile)</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.vendor_admin_app_enabled}
                    onCheckedChange={(checked) => handleCheckboxChange('vendor_admin_app_enabled', checked)}
                  />
                  <span>🏪 Vendor Admin App (Web)</span>
                </label>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm text-gray-600 mb-3">Tenant Admin Permissions</p>
                
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.tenant_admin_can_create_delivery_boys}
                    onCheckedChange={(checked) => handleCheckboxChange('tenant_admin_can_create_delivery_boys', checked)}
                  />
                  <span>Can create delivery boys</span>
                </label>

                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.tenant_admin_can_create_vendors}
                    onCheckedChange={(checked) => handleCheckboxChange('tenant_admin_can_create_vendors', checked)}
                  />
                  <span>Can create vendor admins</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating Tenant...' : 'Create Tenant'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/super-admin/tenants')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedCreateTenant;
