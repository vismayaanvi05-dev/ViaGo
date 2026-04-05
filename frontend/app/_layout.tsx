import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { LocationProvider } from '@/src/contexts/LocationContext';
import { CartProvider } from '@/src/contexts/CartContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(customer)" />
            <Stack.Screen name="(delivery)" />
          </Stack>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
