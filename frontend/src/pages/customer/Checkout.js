import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus } from 'lucide-react';

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const restaurantId = localStorage.getItem('restaurant_id');

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await customerAPI.getAddresses();
      setAddresses(response.data);
      const defaultAddr = response.data.find(a => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast({
        title: "Error",
        description: "Please select a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: "Error",
        description: "Restaurant not found",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        store_id: restaurantId,
        delivery_address_id: selectedAddress,
        items: cart.map(item => ({
          item_id: item.item_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          add_ons: item.add_ons || []
        })),
        payment_method: paymentMethod,
        delivery_type: 'instant',
        allow_substitution: false
      };

      const response = await customerAPI.placeOrder(orderData);
      
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${response.data.order_number}`,
      });

      // Clear cart
      localStorage.removeItem('cart');
      localStorage.removeItem('restaurant_id');
      
      navigate(`/customer/order/${response.data.order_id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Delivery Address */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Delivery Address</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/customer/addresses')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start space-x-2 p-3 border rounded-lg mb-2">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                    <p className="font-medium">{address.address_type}</p>
                    <p className="text-sm text-gray-600">{address.address_line}</p>
                    <p className="text-sm text-gray-600">{address.city}, {address.pincode}</p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {addresses.length === 0 && (
              <p className="text-gray-500 text-center py-4">No addresses found. Please add one.</p>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cart.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-600">{item.variant_name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₹{item.price * item.quantity}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{getCartTotal()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg mb-2">
                <RadioGroupItem value="upi" id="upi" />
                <Label htmlFor="upi" className="flex-1 cursor-pointer">
                  <p className="font-medium">UPI</p>
                  <p className="text-sm text-gray-600">Pay via UPI apps</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg mb-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer">
                  <p className="font-medium">Card</p>
                  <p className="text-sm text-gray-600">Credit/Debit Card</p>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-gray-600">Pay when you receive</p>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button
          size="lg"
          className="w-full"
          onClick={handlePlaceOrder}
          disabled={loading || !selectedAddress}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;