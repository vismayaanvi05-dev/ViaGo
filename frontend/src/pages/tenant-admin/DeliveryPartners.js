import React, { useState, useEffect } from 'react';
import { tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, UserPlus, Bike, Car, Truck, Phone, Mail, MapPin, TrendingUp } from 'lucide-react';

const DeliveryPartners = () => {
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const toast = (message) => {
    // Simple toast notification - non-blocking
    const toastMessage = message.description || message.title;
    console.log('Toast:', toastMessage);
    
    // Create a simple toast element
    const toastEl = document.createElement('div');
    toastEl.className = 'fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm';
    toastEl.innerHTML = `
      <div class="flex items-start">
        <div class="flex-1">
          <p class="text-sm font-semibold text-gray-900">${message.title || 'Notification'}</p>
          ${message.description ? `<p class="text-sm text-gray-600 mt-1">${message.description}</p>` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(toastEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toastEl.remove();
    }, 3000);
  };
  
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_type: 'bike',
    vehicle_number: '',
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await tenantAdminAPI.getDeliveryPartners();
      setPartners(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load delivery partners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePartner = async () => {
    if (!newPartner.name || !newPartner.email || !newPartner.password) {
      toast({
        title: "Validation Error",
        description: "Name, email, and password are required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await tenantAdminAPI.createDeliveryPartner(newPartner);
      
      // Close dialog immediately
      setIsCreateDialogOpen(false);
      
      // Reset form
      setNewPartner({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicle_type: 'bike',
        vehicle_number: '',
      });
      
      // Show success toast
      toast({
        title: "Success",
        description: "Delivery partner created successfully. They can now login with their email and password.",
      });
      
      // Refresh list in background
      fetchPartners();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create delivery partner",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const getVehicleIcon = (type) => {
    switch(type) {
      case 'bike': return <Bike className="h-4 w-4" />;
      case 'car': return <Car className="h-4 w-4" />;
      case 'truck': return <Truck className="h-4 w-4" />;
      default: return <Bike className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      busy: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Partners</h1>
          <p className="text-gray-600 mt-1">Manage your delivery partner network</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Delivery Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Delivery Partner</DialogTitle>
              <DialogDescription>
                Create a new delivery partner account. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPartner.password}
                  onChange={(e) => setNewPartner({...newPartner, password: e.target.value})}
                  placeholder="Enter password for login"
                />
                <p className="text-sm text-gray-500">Delivery partner will use this password to login</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle Type</Label>
                <Select 
                  value={newPartner.vehicle_type} 
                  onValueChange={(value) => setNewPartner({...newPartner, vehicle_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bike">Bike / Scooter</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="truck">Truck / Van</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_number">Vehicle Number</Label>
                <Input
                  id="vehicle_number"
                  value={newPartner.vehicle_number}
                  onChange={(e) => setNewPartner({...newPartner, vehicle_number: e.target.value})}
                  placeholder="AB-1234"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePartner} disabled={creating}>
                {creating ? 'Creating...' : 'Create Partner'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Partners</p>
                <p className="text-2xl font-bold">{partners.length}</p>
              </div>
              <UserPlus className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {partners.filter(p => p.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Busy</p>
                <p className="text-2xl font-bold text-orange-600">
                  {partners.filter(p => p.current_order_id).length}
                </p>
              </div>
              <Bike className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-400">
                  {partners.filter(p => p.status === 'inactive').length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners List */}
      <Card>
        <CardHeader>
          <CardTitle>All Delivery Partners</CardTitle>
          <CardDescription>View and manage your delivery partner network</CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No delivery partners yet</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first delivery partner</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Delivery Partner
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div 
                  key={partner.id} 
                  className="border rounded-lg p-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{partner.name}</h3>
                        {getStatusBadge(partner.status)}
                        {partner.current_order_id && (
                          <Badge variant="outline" className="bg-orange-50">
                            On Delivery
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          {partner.email}
                        </div>
                        {partner.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4" />
                            {partner.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          {getVehicleIcon(partner.vehicle_type)}
                          {partner.vehicle_type} {partner.vehicle_number && `- ${partner.vehicle_number}`}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <TrendingUp className="h-4 w-4" />
                          {partner.total_deliveries || 0} deliveries
                        </div>
                      </div>
                      {partner.current_location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                          <MapPin className="h-4 w-4" />
                          Last location: {partner.current_location.lat.toFixed(4)}, {partner.current_location.lng.toFixed(4)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryPartners;
