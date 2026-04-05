import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '@/src/services/api';

const G = '#10B981';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadEarnings = useCallback(async () => {
    try {
      const response = await deliveryAPI.getEarnings(period);
      setEarnings(response.data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadEarnings();
  }, [loadEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  if (loading && !earnings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={G} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalEarnings = earnings?.total_earnings || 0;
  const totalDeliveries = earnings?.total_deliveries || 0;
  const avgEarning = totalDeliveries > 0 ? (totalEarnings / totalDeliveries).toFixed(0) : 0;
  const recentOrders = earnings?.recent_orders || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G]} />}
      >
        {/* Period Tabs */}
        <View style={styles.periodRow}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>{'\u20B9'}{totalEarnings}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="bicycle" size={18} color={G} />
              </View>
              <Text style={styles.statValue}>{totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trending-up" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{'\u20B9'}{avgEarning}</Text>
              <Text style={styles.statLabel}>Per Delivery</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="star" size={18} color="#6366F1" />
              </View>
              <Text style={styles.statValue}>{earnings?.rating || '5.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Delivery History</Text>

          {recentOrders.length === 0 ? (
            <View style={styles.noHistory}>
              <Ionicons name="document-text-outline" size={36} color="#D1D5DB" />
              <Text style={styles.noHistoryText}>No deliveries in this period</Text>
            </View>
          ) : (
            recentOrders.map((order: any, index: number) => (
              <View key={order.id || index} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyIcon, {
                    backgroundColor: order.status === 'delivered' ? '#D1FAE5' : '#FEE2E2'
                  }]}>
                    <Ionicons
                      name={order.status === 'delivered' ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={order.status === 'delivered' ? '#059669' : '#EF4444'}
                    />
                  </View>
                  <View>
                    <Text style={styles.historyOrder}>#{order.order_number}</Text>
                    <Text style={styles.historyStore}>{order.store_name || 'Store'}</Text>
                    <Text style={styles.historyTime}>
                      {order.completed_at ? new Date(order.completed_at).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyEarning}>+{'\u20B9'}{order.delivery_earning || 50}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },

  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },

  periodRow: {
    flexDirection: 'row', padding: 16, gap: 8,
  },
  periodTab: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  periodTabActive: { backgroundColor: G },
  periodText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  periodTextActive: { color: '#fff' },

  earningsCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  earningsLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginBottom: 4 },
  earningsAmount: { fontSize: 42, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between', width: '100%',
    paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  statDivider: { width: 1, height: 60, backgroundColor: '#F1F5F9' },

  recentSection: { marginHorizontal: 16 },
  recentTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  noHistory: { alignItems: 'center', paddingVertical: 40 },
  noHistoryText: { fontSize: 14, color: '#94A3B8', marginTop: 10 },

  historyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 8,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  historyIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  historyOrder: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  historyStore: { fontSize: 12, color: '#64748B', marginTop: 1 },
  historyTime: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  historyEarning: { fontSize: 16, fontWeight: '800', color: '#059669' },
});
