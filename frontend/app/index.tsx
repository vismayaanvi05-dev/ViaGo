import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideCustomer = useRef(new Animated.Value(40)).current;
  const slideDriver = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (IS_DEV_MODE) {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.stagger(120, [
          Animated.spring(slideCustomer, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
          Animated.spring(slideDriver, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, []);

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

    // Not authenticated → go to the right login
    if (IS_CUSTOMER_APP) {
      router.replace('/(auth)/customer-login');
    } else if (IS_DRIVER_APP) {
      router.replace('/(auth)/driver-login');
    }
    // IS_DEV_MODE → show selector below
  }, [loading, isAuthenticated, appMode]);

  // ─── Loading State ───
  if (loading) {
    const color = IS_DRIVER_APP ? '#10B981' : APP_CONFIG.PRIMARY_COLOR;
    return (
      <View style={[styles.splashContainer, IS_DRIVER_APP && { backgroundColor: '#064E3B' }]}>
        <View style={[styles.splashIcon, { backgroundColor: color }]}>
          <Ionicons name={IS_DRIVER_APP ? 'bicycle' : 'flash'} size={40} color="#fff" />
        </View>
        <Text style={styles.splashName}>{APP_CONFIG.APP_NAME}</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ─── Customer App Splash (while redirecting) ───
  if (IS_CUSTOMER_APP) {
    return (
      <View style={styles.splashContainer}>
        <View style={[styles.splashIcon, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
          <Ionicons name="bag-handle" size={40} color="#fff" />
        </View>
        <Text style={styles.splashName}>ViaGo</Text>
        <Text style={styles.splashTagline}>Delivery made simple</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ─── Driver App Splash (while redirecting) ───
  if (IS_DRIVER_APP) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: '#064E3B' }]}>
        <View style={[styles.splashIcon, { backgroundColor: '#10B981' }]}>
          <Ionicons name="bicycle" size={40} color="#fff" />
        </View>
        <Text style={styles.splashName}>ViaGo Driver</Text>
        <Text style={styles.splashTagline}>Earn on your schedule</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ─── Dev Mode: App Selector ───
  return (
    <View style={styles.container}>
      <View style={styles.bgTop} />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={32} color="#fff" />
          </View>
          <Text style={styles.brandName}>{APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.brandTagline}>Delivery made simple</Text>
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEVELOPMENT MODE</Text>
          </View>
        </View>

        {/* App Cards */}
        <View style={styles.appsSection}>
          <Text style={styles.chooseText}>Choose your app</Text>

          {/* Customer */}
          <Animated.View style={{ transform: [{ translateY: slideCustomer }], opacity: fadeAnim }}>
            <TouchableOpacity style={styles.appCard} onPress={() => router.push('/(auth)/customer-login')} activeOpacity={0.85}>
              <View style={styles.appCardInner}>
                <View style={[styles.appIcon, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                  <Ionicons name="bag-handle" size={28} color="#8B5CF6" />
                </View>
                <View style={styles.appCardContent}>
                  <View style={styles.appCardHeader}>
                    <Text style={styles.appCardTitle}>Customer App</Text>
                    <View style={[styles.appBadge, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={[styles.appBadgeText, { color: '#8B5CF6' }]}>ORDER</Text>
                    </View>
                  </View>
                  <Text style={styles.appCardDesc}>Order food, groceries & laundry</Text>
                  <View style={styles.chips}>
                    {['Food', 'Grocery', 'Laundry'].map(c => (
                      <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
                    ))}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Driver */}
          <Animated.View style={{ transform: [{ translateY: slideDriver }], opacity: fadeAnim }}>
            <TouchableOpacity style={styles.appCard} onPress={() => router.push('/(auth)/driver-login')} activeOpacity={0.85}>
              <View style={styles.appCardInner}>
                <View style={[styles.appIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <Ionicons name="bicycle" size={28} color="#10B981" />
                </View>
                <View style={styles.appCardContent}>
                  <View style={styles.appCardHeader}>
                    <Text style={styles.appCardTitle}>Driver App</Text>
                    <View style={[styles.appBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.appBadgeText, { color: '#059669' }]}>DELIVER</Text>
                    </View>
                  </View>
                  <Text style={styles.appCardDesc}>Accept deliveries & earn money</Text>
                  <View style={styles.chips}>
                    {['Earnings', 'Track', 'Flexible'].map(c => (
                      <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
                    ))}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.adminLink} onPress={() => router.push('/admin-settings')}>
            <Ionicons name="settings-outline" size={14} color="#9CA3AF" />
            <Text style={styles.adminLinkText}>Admin Portal</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>v{APP_CONFIG.VERSION}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Splash (for dedicated app modes)
  splashContainer: {
    flex: 1, backgroundColor: '#1E1B4B', alignItems: 'center', justifyContent: 'center',
  },
  splashIcon: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  splashName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  splashTagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  // Dev mode selector
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 280,
    backgroundColor: '#1E1B4B', borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
  },
  content: { flex: 1, paddingHorizontal: 24 },
  brandSection: { alignItems: 'center', paddingTop: 64, paddingBottom: 24 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: '#8B5CF6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  brandName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  brandTagline: { fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  devBadge: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8,
  },
  devBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  appsSection: { flex: 1, paddingTop: 20 },
  chooseText: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 14, marginLeft: 4,
  },
  appCard: {
    marginBottom: 12, borderRadius: 20, backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06,
    shadowRadius: 16, elevation: 3,
  },
  appCardInner: { flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20 },
  appIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  appCardContent: { flex: 1, marginLeft: 14 },
  appCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  appCardTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  appBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  appBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  appCardDesc: { fontSize: 13, color: '#64748B', marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 5 },
  chip: { backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  chipText: { fontSize: 10, color: '#64748B', fontWeight: '500' },
  footer: { alignItems: 'center', paddingBottom: 28, gap: 8 },
  adminLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16 },
  adminLinkText: { color: '#9CA3AF', fontSize: 13 },
  versionText: { fontSize: 12, color: '#CBD5E1' },
});
