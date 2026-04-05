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

export default function DeliveryHomeScreen() {
  const { location, address } = useLocation();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (!location) return;
    try {
      const response = await deliveryAPI.getAvailableDeliveries(
        location.latitude,
        location.longitude,
        10
      );
      setDeliveries(response.data.deliveries);
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
      const response = await deliveryAPI.acceptDelivery(orderId);
      if (response.data.success) {
        Alert.alert('Success!', 'Delivery accepted. Go to Active tab to start delivery.');
        loadDeliveries();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to accept delivery');
    }
  };

  const handleReject = async (orderId: string) => {
    Alert.alert('Reject Delivery', 'Are you sure?', [
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
        <Text style={styles.orderNumber}>#{item.order_number}</Text>
        <Text style={styles.earning}>₹{item.estimated_earning || 50}</Text>
      </View>
      
      <View style={styles.locationSection}>
        <View style={styles.locationItem}>
          <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>PICKUP</Text>
            <Text style={styles.locationName}>{item.pickup_location?.name}</Text>
            <Text style={styles.locationAddress}>{item.pickup_location?.address}</Text>
            <Text style={styles.distance}>{item.pickup_location?.distance_km} km away</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.locationItem}>
          <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>DROP</Text>
            <Text style={styles.locationAddress}>
              {item.drop_location?.address || 'Address not available'}, {item.drop_location?.city}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.orderAmount}>Order: ₹{item.total_amount}</Text>
        <Text style={styles.paymentMethod}>{item.payment_method === 'cod' ? 'COD' : 'Paid'}</Text>
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
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
        <View>
          <Text style={styles.headerTitle}>Available Deliveries</Text>
          <Text style={styles.headerSubtitle}>
            <Ionicons name="location" size={14} color="#10B981" />
            {' '}{address?.city || 'Current Location'}
          </Text>
        </View>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bicycle-outline" size={60} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No deliveries nearby</Text>
          <Text style={styles.emptySubtitle}>New orders will appear here</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  onlineIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  onlineText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  listContainer: { padding: 16 },
  deliveryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  earning: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
  locationSection: { marginBottom: 16 },
  locationItem: { flexDirection: 'row', paddingVertical: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12, marginTop: 4 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  locationName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  locationAddress: { fontSize: 14, color: '#6B7280' },
  distance: { fontSize: 12, color: '#10B981', fontWeight: '500', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4, marginLeft: 24 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 16 },
  orderAmount: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  paymentMethod: { fontSize: 12, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444', gap: 8 },
  rejectText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
  acceptButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, backgroundColor: '#10B981', gap: 8 },
  acceptText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, gap: 8 },
  refreshText: { color: '#fff', fontWeight: '600' },
});
