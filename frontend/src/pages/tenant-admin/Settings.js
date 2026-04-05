import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Save, DollarSign, TrendingUp, Percent, FileText, Shield, HelpCircle, Phone, Mail, Globe } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    delivery_charge_type: 'flat',
    flat_delivery_charge: 0,
    delivery_charge_per_km: 0,
    free_delivery_above: null,
    tax_enabled: true,
    tax_name: 'GST',
    tax_percentage: 5,
    default_admin_markup_percentage: 0,
    currency: 'INR',
    minimum_order_value: 0,
    // Legal & Support
    privacy_policy: '',
    terms_and_conditions: '',
    support_email: '',
    support_phone: '',
    support_website: '',
    support_hours: '9:00 AM - 6:00 PM (Mon-Sat)',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await tenantAdminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantAdminAPI.updateSettings(settings);
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your business settings</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3">
          <TabsTrigger value="business">Business Settings</TabsTrigger>
          <TabsTrigger value="legal">Legal & Policies</TabsTrigger>
          <TabsTrigger value="support">Help & Support</TabsTrigger>
        </TabsList>

        {/* Business Settings Tab */}
        <TabsContent value="business" className="space-y-6">
        {/* Delivery Charge Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              Delivery Charge Settings
            </CardTitle>
            <CardDescription>
              Configure how delivery charges are calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Delivery Charge Type</Label>
              <Select 
                value={settings.delivery_charge_type} 
                onValueChange={(value) => updateSetting('delivery_charge_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="distance_based">Distance Based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.delivery_charge_type === 'flat' && (
              <div className="space-y-2">
                <Label htmlFor="flat_charge">Flat Delivery Charge (₹)</Label>
                <Input
                  id="flat_charge"
                  type="number"
                  value={settings.flat_delivery_charge}
                  onChange={(e) => updateSetting('flat_delivery_charge', parseFloat(e.target.value))}
                  placeholder="50"
                />
              </div>
            )}

            {settings.delivery_charge_type === 'distance_based' && (
              <div className="space-y-2">
                <Label htmlFor="per_km">Charge Per Kilometer (₹)</Label>
                <Input
                  id="per_km"
                  type="number"
                  value={settings.delivery_charge_per_km}
                  onChange={(e) => updateSetting('delivery_charge_per_km', parseFloat(e.target.value))}
                  placeholder="10"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="free_delivery">Free Delivery Above (₹)</Label>
              <Input
                id="free_delivery"
                type="number"
                value={settings.free_delivery_above || ''}
                onChange={(e) => updateSetting('free_delivery_above', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="500 (Optional)"
              />
              <p className="text-sm text-gray-500">Leave empty for no free delivery threshold</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_order">Minimum Order Value (₹)</Label>
              <Input
                id="min_order"
                type="number"
                value={settings.minimum_order_value}
                onChange={(e) => updateSetting('minimum_order_value', parseFloat(e.target.value))}
                placeholder="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-orange-600" />
              Tax Settings
            </CardTitle>
            <CardDescription>
              Configure tax calculation on orders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Tax</Label>
                <p className="text-sm text-gray-500">Apply tax to all orders</p>
              </div>
              <Switch
                checked={settings.tax_enabled}
                onCheckedChange={(checked) => updateSetting('tax_enabled', checked)}
              />
            </div>

            {settings.tax_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tax_name">Tax Name</Label>
                  <Select 
                    value={settings.tax_name} 
                    onValueChange={(value) => updateSetting('tax_name', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST (Goods and Services Tax)</SelectItem>
                      <SelectItem value="VAT">VAT (Value Added Tax)</SelectItem>
                      <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_percent">Tax Percentage (%)</Label>
                  <Input
                    id="tax_percent"
                    type="number"
                    value={settings.tax_percentage}
                    onChange={(e) => updateSetting('tax_percentage', parseFloat(e.target.value))}
                    placeholder="5"
                    step="0.1"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Admin Markup Settings */}
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Admin Markup (Your Profit Margin)
            </CardTitle>
            <CardDescription>
              Set default profit margin on all menu items
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="markup">Default Admin Markup (%)</Label>
              <Input
                id="markup"
                type="number"
                value={settings.default_admin_markup_percentage}
                onChange={(e) => updateSetting('default_admin_markup_percentage', parseFloat(e.target.value))}
                placeholder="10"
                step="0.1"
              />
              <p className="text-sm text-gray-600">
                This will be applied to all items. You can override per item in the menu.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• If item base price is ₹100 and markup is 10%</p>
                <p>• Customer pays: ₹100 + ₹10 (markup) = ₹110</p>
                <p>• Your profit: ₹10 per item</p>
                <p>• This is separate from platform commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>
              Set your preferred currency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={settings.currency} 
                onValueChange={(value) => updateSetting('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Legal & Policies Tab */}
        <TabsContent value="legal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Privacy Policy
              </CardTitle>
              <CardDescription>
                Define how you handle user data and privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.privacy_policy}
                onChange={(e) => updateSetting('privacy_policy', e.target.value)}
                placeholder="Enter your privacy policy..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-2">
                This will be displayed in the mobile apps under Settings → Privacy Policy
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Terms & Conditions
              </CardTitle>
              <CardDescription>
                Set the rules and guidelines for using your service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.terms_and_conditions}
                onChange={(e) => updateSetting('terms_and_conditions', e.target.value)}
                placeholder="Enter your terms and conditions..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-2">
                This will be displayed in the mobile apps under Settings → Terms & Conditions
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Help & Support Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-600" />
                Support Contact Information
              </CardTitle>
              <CardDescription>
                Provide contact details for customer support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="support_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Support Email
                </Label>
                <Input
                  id="support_email"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => updateSetting('support_email', e.target.value)}
                  placeholder="support@yourbusiness.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Support Phone
                </Label>
                <Input
                  id="support_phone"
                  type="tel"
                  value={settings.support_phone}
                  onChange={(e) => updateSetting('support_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Support Website
                </Label>
                <Input
                  id="support_website"
                  type="url"
                  value={settings.support_website}
                  onChange={(e) => updateSetting('support_website', e.target.value)}
                  placeholder="https://support.yourbusiness.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support_hours">Support Hours</Label>
                <Input
                  id="support_hours"
                  type="text"
                  value={settings.support_hours}
                  onChange={(e) => updateSetting('support_hours', e.target.value)}
                  placeholder="9:00 AM - 6:00 PM (Mon-Sat)"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📱 Where this appears:</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• Customer App: Help & Support section</p>
                  <p>• Delivery App: Contact Support section</p>
                  <p>• Customers can call, email, or visit your website</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default Settings;
