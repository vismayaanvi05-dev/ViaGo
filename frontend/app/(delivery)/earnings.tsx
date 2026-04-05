import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '@/src/services/api';

const DRIVER_COLOR = '#10B981';

export default function EarningsScreen() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings, setEarnings] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
    loadHistory();
  }, [period]);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getEarnings(period);
      setEarnings(response.data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await deliveryAPI.getDeliveryHistory(0, 10);
      setHistory(response.data.deliveries || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
    loadHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return "Today's";
      case 'week': return 'This Week';
      case 'month': return 'This Month';
    }
  };

  if (loading && !earnings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={DRIVER_COLOR} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DRIVER_COLOR]} />}
      >
        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButton, period === p && styles.activePeriod]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.activePeriodText]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsGradient}>
            <Text style={styles.earningsLabel}>{getPeriodLabel()} Earnings</Text>
            <Text style={styles.earningsAmount}>{'\u20B9'}{earnings?.total_earnings || 0}</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="bicycle" size={22} color={DRIVER_COLOR} />
              </View>
              <Text style={styles.statValue}>{earnings?.total_deliveries || 0}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="cash" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{'\u20B9'}{earnings?.average_per_delivery || 0}</Text>
              <Text style={styles.statLabel}>Avg / Delivery</Text>
            </View>
          </View>
        </View>

        {/* Recent Deliveries */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyHistoryText}>No delivery history yet</Text>
              <Text style={styles.emptyHistorySubtext}>Complete deliveries to see them here</Text>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-circle" size={24} color={DRIVER_COLOR} />
                </View>
                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyOrder}>#{item.order_number}</Text>
                    <Text style={styles.historyAmount}>+{'\u20B9'}{item.delivery_fee || 50}</Text>
                  </View>
                  <Text style={styles.historyStore}>{item.store_name || 'Restaurant'}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.delivered_at || item.created_at)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  periodContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  activePeriod: { backgroundColor: DRIVER_COLOR, borderColor: DRIVER_COLOR },
  periodText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activePeriodText: { color: '#fff' },
  earningsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  earningsGradient: {
    backgroundColor: DRIVER_COLOR,
    padding: 28,
    alignItems: 'center',
  },
  earningsLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  earningsAmount: { fontSize: 48, fontWeight: '800', color: '#fff' },
  statsGrid: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#9CA3AF' },
  historySection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 14 },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyHistoryText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 12 },
  emptyHistorySubtext: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyIcon: { marginRight: 14 },
  historyContent: { flex: 1 },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyOrder: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  historyAmount: { fontSize: 16, fontWeight: '700', color: DRIVER_COLOR },
  historyStore: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#9CA3AF' },
});
