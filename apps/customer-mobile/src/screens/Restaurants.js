import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../api/client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Clock, Star } from 'lucide-react';

const Restaurants = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisineFilter, setCuisineFilter] = useState('');

  useEffect(() => {
    fetchRestaurants();
  }, [search, cuisineFilter]);

  const fetchRestaurants = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (cuisineFilter) params.cuisine_type = cuisineFilter;
      
      const response = await customerAPI.getRestaurants(params);
      setRestaurants(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">HyperServe</h1>
          <p className="text-gray-600">Order food from nearby restaurants</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search restaurants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={() => navigate('/customer/addresses')}>Addresses</Button>
          <Button onClick={() => navigate('/customer/orders')}>My Orders</Button>
        </div>
      </div>

      {/* Restaurants Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No restaurants found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/customer/restaurant/${restaurant.id}`)}
              >
                <CardHeader className="p-0">
                  <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 rounded-t-lg flex items-center justify-center">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt={restaurant.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-white">{restaurant.name[0]}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{restaurant.description || 'Delicious food awaits!'}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {restaurant.cuisine_types?.slice(0, 3).map((cuisine) => (
                      <Badge key={cuisine} variant="secondary" className="text-xs">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.average_prep_time_minutes} mins</span>
                    </div>
                    {restaurant.distance_km && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.distance_km} km</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <div className="w-full">
                    {restaurant.minimum_order_value > 0 && (
                      <p className="text-sm text-gray-500">Min order: ₹{restaurant.minimum_order_value}</p>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;