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
      setHistory(response.data.deliveries);
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
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.periodSelector}>
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

        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>
            {period === 'today' ? "Today's" : period === 'week' ? 'This Week' : 'This Month'} Earnings
          </Text>
          <Text style={styles.earningsAmount}>₹{earnings?.total_earnings || 0}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="bicycle" size={20} color="#6B7280" />
              <Text style={styles.statValue}>{earnings?.total_deliveries || 0}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cash" size={20} color="#6B7280" />
              <Text style={styles.statValue}>₹{earnings?.average_per_delivery || 0}</Text>
              <Text style={styles.statLabel}>Avg/Delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {history.length === 0 ? (
            <Text style={styles.noHistory}>No delivery history</Text>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyOrder}>#{item.order_number}</Text>
                  <Text style={styles.historyStore}>{item.store_name}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.delivered_at || item.created_at)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>+₹{item.delivery_fee || 50}</Text>
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark" size={12} color="#10B981" />
                    <Text style={styles.completedText}>Delivered</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  periodSelector: { flexDirection: 'row', padding: 16, gap: 8 },
  periodButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  activePeriod: { backgroundColor: '#10B981', borderColor: '#10B981' },
  periodText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  activePeriodText: { color: '#fff' },
  earningsCard: { backgroundColor: '#fff', margin: 16, marginTop: 0, padding: 24, borderRadius: 16, alignItems: 'center' },
  earningsLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  earningsAmount: { fontSize: 48, fontWeight: 'bold', color: '#10B981', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 40 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  historySection: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  noHistory: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  historyCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  historyLeft: {},
  historyOrder: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  historyStore: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  historyDate: { fontSize: 12, color: '#9CA3AF' },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981', marginBottom: 8 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  completedText: { fontSize: 12, color: '#10B981' },
});
