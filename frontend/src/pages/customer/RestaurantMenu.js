import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';

const RestaurantMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetchRestaurant();
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [id]);

  const fetchRestaurant = async () => {
    try {
      const response = await customerAPI.getRestaurant(id);
      setRestaurant(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item, variant = null) => {
    const cartItem = {
      item_id: item.id,
      item_name: item.name,
      variant_id: variant?.id || null,
      variant_name: variant?.name || null,
      price: variant?.price || item.base_price,
      quantity: 1,
      add_ons: []
    };

    const existingIndex = cart.findIndex(
      (i) => i.item_id === cartItem.item_id && i.variant_id === cartItem.variant_id
    );

    let newCart;
    if (existingIndex >= 0) {
      newCart = [...cart];
      newCart[existingIndex].quantity += 1;
    } else {
      newCart = [...cart, cartItem];
    }

    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    localStorage.setItem('restaurant_id', id);
    
    toast({
      title: "Added to cart",
      description: `${item.name} added successfully`,
    });
  };

  const updateQuantity = (index, delta) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    
    setCart(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/customer')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
              <p className="text-sm text-gray-600">{restaurant?.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {restaurant?.categories?.map((category) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.items?.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          {item.is_veg !== null && (
                            <Badge variant={item.is_veg ? "success" : "destructive"} className="text-xs">
                              {item.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        <p className="text-lg font-bold text-orange-600 mt-2">₹{item.base_price}</p>
                        
                        {item.variants?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.variants.map((variant) => (
                              <Button
                                key={variant.id}
                                size="sm"
                                variant="outline"
                                onClick={() => addToCart(item, variant)}
                              >
                                {variant.name} - ₹{variant.price}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      {item.variants?.length === 0 && (
                        <Button
                          onClick={() => addToCart(item)}
                          className="ml-4"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{cart.length} items</p>
                <p className="text-xl font-bold text-gray-900">₹{getCartTotal()}</p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/customer/checkout')}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;