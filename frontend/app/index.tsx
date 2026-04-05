import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { APP_CONFIG } from '../src/config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../src/components/LinearGradient';

const { width } = Dimensions.get('window');

export default function AppLauncher() {
  const router = useRouter();
  const { isAuthenticated, loading, appMode } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideCustomer = useRef(new Animated.Value(40)).current;
  const slideDriver = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.spring(slideCustomer, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.spring(slideDriver, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (appMode === 'driver') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/(customer)/home');
      }
    }
  }, [loading, isAuthenticated, appMode]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.bgTop} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo & Branding */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="flash" size={32} color="#fff" />
            </View>
          </View>
          <Text style={styles.brandName}>{APP_CONFIG.APP_NAME}</Text>
          <Text style={styles.brandTagline}>Delivery made simple</Text>
        </View>

        {/* App Selection */}
        <View style={styles.appsSection}>
          <Text style={styles.chooseText}>Choose your app</Text>

          {/* Customer App Card */}
          <Animated.View style={{ transform: [{ translateY: slideCustomer }], opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.appCard}
              onPress={() => router.push('/(auth)/customer-login')}
              activeOpacity={0.85}
            >
              <View style={styles.appCardGradient}>
                <View style={[styles.appIconContainer, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                  <Ionicons name="bag-handle" size={28} color="#8B5CF6" />
                </View>
                <View style={styles.appCardContent}>
                  <View style={styles.appCardHeader}>
                    <Text style={styles.appCardTitle}>Customer</Text>
                    <View style={[styles.appBadge, { backgroundColor: '#F3E8FF' }]}>
                      <Text style={[styles.appBadgeText, { color: '#8B5CF6' }]}>ORDER</Text>
                    </View>
                  </View>
                  <Text style={styles.appCardDesc}>Order food, groceries & laundry services</Text>
                  <View style={styles.appCardFeatures}>
                    <View style={styles.featureChip}>
                      <Ionicons name="restaurant-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Food</Text>
                    </View>
                    <View style={styles.featureChip}>
                      <Ionicons name="cart-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Grocery</Text>
                    </View>
                    <View style={styles.featureChip}>
                      <Ionicons name="shirt-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Laundry</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Driver App Card */}
          <Animated.View style={{ transform: [{ translateY: slideDriver }], opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.appCard}
              onPress={() => router.push('/(auth)/driver-login')}
              activeOpacity={0.85}
            >
              <View style={styles.appCardGradient}>
                <View style={[styles.appIconContainer, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                  <Ionicons name="bicycle" size={28} color="#10B981" />
                </View>
                <View style={styles.appCardContent}>
                  <View style={styles.appCardHeader}>
                    <Text style={styles.appCardTitle}>Driver</Text>
                    <View style={[styles.appBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.appBadgeText, { color: '#059669' }]}>DELIVER</Text>
                    </View>
                  </View>
                  <Text style={styles.appCardDesc}>Accept deliveries & earn money on your schedule</Text>
                  <View style={styles.appCardFeatures}>
                    <View style={styles.featureChip}>
                      <Ionicons name="wallet-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Earnings</Text>
                    </View>
                    <View style={styles.featureChip}>
                      <Ionicons name="navigate-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Live Track</Text>
                    </View>
                    <View style={styles.featureChip}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.featureText}>Flexible</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => router.push('/admin-settings')}
          >
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
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
    backgroundColor: '#1E1B4B',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  brandSection: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: APP_CONFIG.PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  appsSection: {
    flex: 1,
    paddingTop: 20,
  },
  chooseText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  appCard: {
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  appCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  appIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appCardContent: {
    flex: 1,
    marginLeft: 16,
  },
  appCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  appCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  appBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  appBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  appCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  appCardFeatures: {
    flexDirection: 'row',
    gap: 6,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 32,
    gap: 10,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  adminLinkText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  versionText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});
