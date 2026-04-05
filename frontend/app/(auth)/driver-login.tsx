import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Driver login is unified into the main login page (customer-login.tsx)
// This redirect ensures any deep links to driver-login still work
export default function DriverLoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/(auth)/customer-login');
  }, []);

  return null;
}
