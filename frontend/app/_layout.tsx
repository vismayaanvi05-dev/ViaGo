import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { LocationProvider } from '@/src/contexts/LocationContext';
import { CartProvider } from '@/src/contexts/CartContext';
import { StatusBar } from 'expo-status-bar';
import { IS_CUSTOMER_APP, IS_DRIVER_APP } from '@/src/config';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />

            {/* Auth screens - always available */}
            <Stack.Screen name="(auth)" />

            {/* Customer routes - hidden when driver-only app */}
            {!IS_DRIVER_APP && (
              <Stack.Screen name="(customer)" />
            )}

            {/* Driver routes - hidden when customer-only app */}
            {!IS_CUSTOMER_APP && (
              <Stack.Screen name="(delivery)" />
            )}

            {/* Admin - available in dev mode and customer app */}
            {!IS_DRIVER_APP && (
              <Stack.Screen name="admin-settings" />
            )}
          </Stack>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
