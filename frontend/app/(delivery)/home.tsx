import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/src/contexts/LocationContext';
import { deliveryAPI } from '@/src/services/api';

const DRIVER_COLOR = '#10B981';

export default function DeliveryHomeScreen() {
  const { location, address } = useLocation();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    if (!location) return;
    try {
      const response = await deliveryAPI.getAvailableDeliveries(
        location.latitude,
        location.longitude,
        10
      );
      setDeliveries(response.data.deliveries || []);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location]);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 30000);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  const handleAccept = async (orderId: string) => {
    try {
      setAccepting(orderId);
      const response = await deliveryAPI.acceptDelivery(orderId);
      if (response.data.success) {
        Alert.alert('Delivery Accepted!', 'Go to Active tab to start your delivery.');
        loadDeliveries();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept delivery');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (orderId: string) => {
    Alert.alert('Reject Delivery', 'Are you sure you want to reject this delivery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await deliveryAPI.rejectDelivery(orderId, 'Not available');
            loadDeliveries();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject delivery');
          }
        },
      },
    ]);
  };

  const renderDelivery = ({ item }: { item: any }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderTime}>
            {item.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
          </Text>
        </View>
        <View style={styles.earningBadge}>
          <Ionicons name="cash-outline" size={16} color={DRIVER_COLOR} />
          <Text style={styles.earningText}>+{'\u20B9'}{item.estimated_earning || 50}</Text>
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeTimeline}>
          <View style={[styles.routeDot, { backgroundColor: DRIVER_COLOR }]} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeName}>{item.pickup_location?.name || 'Store'}</Text>
            <Text style={styles.routeAddress}>{item.pickup_location?.address || 'Store address'}</Text>
            {item.pickup_location?.distance_km && (
              <Text style={styles.routeDistance}>{item.pickup_location.distance_km} km away</Text>
            )}
          </View>
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>DROP-OFF</Text>
            <Text style={styles.routeAddress}>
              {item.drop_location?.address || 'Customer address'}, {item.drop_location?.city || ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.orderAmountContainer}>
          <Text style={styles.orderAmountLabel}>Order Value</Text>
          <Text style={styles.orderAmount}>{'\u20B9'}{item.total_amount}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.id)}
        >
          <Ionicons name="close" size={20} color="#EF4444" />
          <Text style={styles.rejectText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
          disabled={accepting === item.id}
        >
          {accepting === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.acceptText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={DRIVER_COLOR} />
          <Text style={styles.loadingText}>Finding deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Ready to deliver</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={DRIVER_COLOR} />
            <Text style={styles.locationText}>{address?.city || 'Current Location'}</Text>
          </View>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bicycle-outline" size={56} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No deliveries nearby</Text>
          <Text style={styles.emptySubtitle}>New orders will appear here automatically</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DRIVER_COLOR]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DRIVER_COLOR },
  onlineText: { fontSize: 13, fontWeight: '600', color: '#065F46' },
  listContainer: { padding: 16 },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  orderTime: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  earningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  earningText: { fontSize: 16, fontWeight: '700', color: '#065F46' },
  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  routeTimeline: { width: 24, alignItems: 'center', paddingTop: 4 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  routeDetails: { flex: 1, marginLeft: 12 },
  routePoint: { marginBottom: 16 },
  routeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  routeName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  routeAddress: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  routeDistance: { fontSize: 12, color: DRIVER_COLOR, fontWeight: '500', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 14,
  },
  orderAmountContainer: {},
  orderAmountLabel: { fontSize: 12, color: '#9CA3AF' },
  orderAmount: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    gap: 6,
  },
  rejectText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: DRIVER_COLOR,
    gap: 6,
  },
  acceptText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DRIVER_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  refreshText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
