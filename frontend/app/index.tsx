import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { APP_CONFIG, IS_CUSTOMER_APP, IS_DRIVER_APP, IS_DEV_MODE } from '../src/config';
import { Ionicons } from '@expo/vector-icons';

export default function AppEntry() {
  const router = useRouter();
  const { isAuthenticated, loading, appMode } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Authenticated → go to the right home
    if (isAuthenticated) {
      if (IS_DRIVER_APP || appMode === 'driver') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/(customer)/home');
      }
      return;
    }

    // Not authenticated → go to login (unified page for both customer & driver)
    router.replace('/(auth)/customer-login');
  }, [loading, isAuthenticated, appMode]);

  // ─── Loading / Splash State ───
  const color = IS_DRIVER_APP ? '#10B981' : APP_CONFIG.PRIMARY_COLOR;
  const bg = IS_DRIVER_APP ? '#064E3B' : '#1E1B4B';
  const icon = IS_DRIVER_APP ? 'bicycle' : 'flash';
  const name = IS_DRIVER_APP ? 'ViaGo Driver' : 'ViaGo';
  const tagline = IS_DRIVER_APP ? 'Earn on your schedule' : 'Delivery made simple';

  return (
    <View style={[styles.splashContainer, { backgroundColor: bg }]}>
      <View style={[styles.splashIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={40} color="#fff" />
      </View>
      <Text style={styles.splashName}>{name}</Text>
      <Text style={styles.splashTagline}>{tagline}</Text>
      <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  splashIcon: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  splashName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  splashTagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});
