import React, { createContext, useState, useEffect, useContext } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
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
        setLoading(false);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
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
        setAddress(addresses[0]);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    } finally {
      setLoading(false);
    }
  };

  const setManualLocation = async (coords, addressText) => {
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
