import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface Address {
  city?: string;
  formattedAddress?: string;
  street?: string;
  region?: string;
}

interface LocationContextType {
  location: LocationData | null;
  address: Address | null;
  loading: boolean;
  permissionGranted: boolean;
  getCurrentLocation: () => Promise<void>;
  setManualLocation: (coords: LocationData, addressText: string) => void;
  requestLocationPermission: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setPermissionGranted(true);
        getCurrentLocation();
      } else {
        setPermissionGranted(false);
        // Set default location for testing
        setLocation({ latitude: 19.0760, longitude: 72.8777 });
        setAddress({ city: 'Mumbai', formattedAddress: 'Mumbai, Maharashtra' });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocation({ latitude: 19.0760, longitude: 72.8777 });
      setAddress({ city: 'Mumbai', formattedAddress: 'Mumbai, Maharashtra' });
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      
      setLocation(coords);
      
      const addresses = await Location.reverseGeocodeAsync(coords);
      if (addresses && addresses.length > 0) {
        setAddress(addresses[0] as Address);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      // Fallback to Mumbai
      setLocation({ latitude: 19.0760, longitude: 72.8777 });
      setAddress({ city: 'Mumbai', formattedAddress: 'Mumbai, Maharashtra' });
    } finally {
      setLoading(false);
    }
  };

  const setManualLocation = (coords: LocationData, addressText: string) => {
    setLocation(coords);
    setAddress({ formattedAddress: addressText });
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        address,
        loading,
        permissionGranted,
        getCurrentLocation,
        setManualLocation,
        requestLocationPermission,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
};
