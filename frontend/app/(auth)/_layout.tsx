import { Stack } from 'expo-router';
import { IS_CUSTOMER_APP, IS_DRIVER_APP } from '@/src/config';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* In dedicated mode, only configure the relevant login screen */}
      <Stack.Screen 
        name="customer-login" 
        options={{ 
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="driver-login" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
