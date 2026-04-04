import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { superAdminAPI } from '@/api/client';
import { Edit, Trash2, Plus, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ManageTenantAdmins = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getTenantAdmins();
      setAdmins(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tenant admins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      password: '' // Empty for security
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    try {
      await superAdminAPI.updateTenantAdmin(editingAdmin.id, editingAdmin);
      toast({
        title: "Success",
        description: "Tenant admin updated successfully"
      });
      setShowEditDialog(false);
      fetchAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (adminId, adminName) => {
    if (!confirm(`Are you sure you want to delete ${adminName}?`)) return;

    try {
      await superAdminAPI.deleteTenantAdmin(adminId);
      toast({
        title: "Success",
        description: "Tenant admin deleted successfully"
      });
      fetchAdmins();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete tenant admin",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Tenant Admins</h1>
        <Button onClick={() => window.location.href = '/super-admin/tenant-admins/create'}>
          <Plus className="h-4 w-4 mr-2" />
          Create New
        </Button>
      </div>

      <div className="space-y-4">
        {admins.map((admin) => (
          <Card key={admin.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{admin.name}</h3>
                    <Badge variant={admin.is_active ? "success" : "destructive"}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{admin.email}</span>
                    </div>
                    <p>Tenant ID: {admin.tenant_id}</p>
                    <p>Created: {new Date(admin.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(admin)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(admin.id, admin.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {admins.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <p>No tenant admins created yet</p>
              <Button className="mt-4" onClick={() => window.location.href = '/super-admin/tenant-admins/create'}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Tenant Admin
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant Admin</DialogTitle>
          </DialogHeader>
          
          {editingAdmin && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({...editingAdmin, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({...editingAdmin, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>New Password (leave blank to keep current)</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={editingAdmin.password}
                  onChange={(e) => setEditingAdmin({...editingAdmin, password: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTenantAdmins;
