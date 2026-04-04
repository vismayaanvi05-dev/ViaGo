import React, { useState, useEffect } from 'react';
import { laundryAPI, tenantAdminAPI } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock } from 'lucide-react';

const LaundryTimeSlots = () => {
  const { toast } = useToast();
  const [timeSlots, setTimeSlots] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [slotForm, setSlotForm] = useState({
    store_id: '',
    days_of_week: [0],
    start_time: '',
    end_time: '',
    slot_type: 'pickup',
    is_active: true
  });

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const fetchTimeSlots = async () => {
    try {
      const [slotsRes, storesRes] = await Promise.all([
        laundryAPI.getTimeSlots({}),
        tenantAdminAPI.getStores({})
      ]);
      setTimeSlots(slotsRes.data);
      setStores(storesRes.data);
      
      // Auto-select first store if available
      if (storesRes.data.length > 0 && !slotForm.store_id) {
        setSlotForm(prev => ({ ...prev, store_id: storesRes.data[0].id }));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load time slots', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await laundryAPI.createTimeSlot(slotForm);
      toast({ title: 'Success', description: 'Time slot created successfully' });
      setDialogOpen(false);
      resetForm();
      fetchTimeSlots();
    } catch (error) {
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' ? errorMsg : errorMsg?.[0]?.msg || 'Operation failed';
      toast({ title: 'Error', description: displayMsg, variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setSlotForm({ store_id: '', days_of_week: [0], start_time: '', end_time: '', slot_type: 'pickup', is_active: true });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Time Slots</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Time Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Slot</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Store *</Label>
                <select className="w-full border rounded p-2" value={slotForm.store_id} onChange={(e) => setSlotForm({...slotForm, store_id: e.target.value})} required>
                  <option value="">Select store</option>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <select className="w-full border rounded p-2" value={slotForm.days_of_week[0]} onChange={(e) => setSlotForm({...slotForm, days_of_week: [parseInt(e.target.value)]})}>
                  <option value="0">Monday</option>
                  <option value="1">Tuesday</option>
                  <option value="2">Wednesday</option>
                  <option value="3">Thursday</option>
                  <option value="4">Friday</option>
                  <option value="5">Saturday</option>
                  <option value="6">Sunday</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm({...slotForm, start_time: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm({...slotForm, end_time: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <Label>Slot Type *</Label>
                <select className="w-full border rounded p-2" value={slotForm.slot_type} onChange={(e) => setSlotForm({...slotForm, slot_type: e.target.value})}>
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={slotForm.is_active} onChange={(e) => setSlotForm({...slotForm, is_active: e.target.checked})} />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create</Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timeSlots.map(slot => (
          <Card key={slot.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {slot.days_of_week && slot.days_of_week.length > 0 ? ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][slot.days_of_week[0]] : 'N/A'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Time: {slot.start_time} - {slot.end_time}</p>
              <p className="text-sm text-gray-600">Type: {slot.slot_type}</p>
              <p className="text-sm mt-2">
                <span className={slot.is_active ? 'text-green-600' : 'text-gray-400'}>
                  {slot.is_active ? '✓ Active' : '✗ Inactive'}
                </span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {timeSlots.length === 0 && (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No time slots found. Create your first time slot!</p>
        </div>
      )}
    </div>
  );
};

export default LaundryTimeSlots;