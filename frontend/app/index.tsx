import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { APP_CONFIG } from '@/src/config';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, loading, userRole } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (userRole === 'delivery_partner') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/(customer)/home');
      }
    }
  }, [loading, isAuthenticated, userRole]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🚗</Text>
        <Text style={styles.title}>{APP_CONFIG.APP_NAME}</Text>
        <Text style={styles.subtitle}>Your complete delivery solution</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#8B5CF6' }]}
          onPress={() => router.push('/(auth)/login?role=customer')}
        >
          <Ionicons name="cart" size={48} color="#fff" />
          <Text style={styles.cardTitle}>Customer App</Text>
          <Text style={styles.cardDesc}>Order food, groceries & laundry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: '#10B981' }]}
          onPress={() => router.push('/(auth)/login?role=delivery_partner')}
        >
          <Ionicons name="bicycle" size={48} color="#fff" />
          <Text style={styles.cardTitle}>Delivery Partner</Text>
          <Text style={styles.cardDesc}>Accept deliveries & earn money</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>v{APP_CONFIG.VERSION}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  cards: {
    gap: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  cardDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 40,
  },
});
