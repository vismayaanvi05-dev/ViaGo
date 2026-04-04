import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';

import SplashScreen from '../screens/SplashScreen';
import LocationScreen from '../screens/LocationScreen';
import OTPLoginScreen from '../screens/auth/OTPLoginScreen';
import MainNavigator from './MainNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { location, loading: locationLoading } = useLocation();

  if (authLoading || locationLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!location ? (
        <Stack.Screen name="Location" component={LocationScreen} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="OTPLogin" component={OTPLoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
