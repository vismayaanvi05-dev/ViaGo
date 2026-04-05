import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '@/src/services/api';

export default function ActiveDeliveryScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      const response = await deliveryAPI.getAssignedDeliveries();
      setDeliveries(response.data.deliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
    const interval = setInterval(loadDeliveries, 15000);
    return () => clearInterval(interval);
  }, [loadDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const statusMessages: any = {
      picked_up: 'Mark as Picked Up?',
      out_for_delivery: 'Start Delivery?',
      delivered: 'Mark as Delivered?',
    };

    Alert.alert('Confirm', statusMessages[newStatus], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdating(orderId);
            await deliveryAPI.updateDeliveryStatus(orderId, newStatus);
            Alert.alert('Success', `Order ${newStatus === 'delivered' ? 'delivered' : 'updated'} successfully!`);
            loadDeliveries();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
          } finally {
            setUpdating(null);
          }
        },
      },
    ]);
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'out_for_pickup':
        return { label: 'Picked Up', nextStatus: 'picked_up', icon: 'checkmark-circle' };
      case 'picked_up':
        return { label: 'Start Delivery', nextStatus: 'out_for_delivery', icon: 'navigate' };
      case 'out_for_delivery':
        return { label: 'Mark Delivered', nextStatus: 'delivered', icon: 'checkmark-done' };
      default:
        return null;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'out_for_pickup': return 25;
      case 'picked_up': return 50;
      case 'out_for_delivery': return 75;
      default: return 0;
    }
  };

  const renderDelivery = (delivery: any) => {
    const nextAction = getNextAction(delivery.status);
    const progress = getStatusProgress(delivery.status);

    return (
      <View key={delivery.id} style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>#{delivery.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.statusText}>{delivery.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, progress >= 25 && styles.activeLabel]}>Pickup</Text>
            <Text style={[styles.progressLabel, progress >= 50 && styles.activeLabel]}>Picked</Text>
            <Text style={[styles.progressLabel, progress >= 75 && styles.activeLabel]}>Enroute</Text>
            <Text style={[styles.progressLabel, progress >= 100 && styles.activeLabel]}>Done</Text>
          </View>
        </View>

        <View style={styles.locationSection}>
          <View style={styles.locationItem}>
            <Ionicons name="restaurant" size={20} color="#10B981" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup from</Text>
              <Text style={styles.locationName}>{delivery.store?.name}</Text>
              <Text style={styles.locationAddress}>{delivery.store?.address}</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>

          <View style={styles.locationItem}>
            <Ionicons name="location" size={20} color="#EF4444" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationAddress}>
                {delivery.delivery_address?.address_line || 'Address not available'}
              </Text>
              <Text style={styles.locationAddress}>
                {delivery.delivery_address?.city}, {delivery.delivery_address?.pincode}
              </Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={16} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Amount</Text>
            <Text style={styles.detailValue}>₹{delivery.total_amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{delivery.payment_method === 'cod' ? 'Collect Cash' : 'Already Paid'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Earning</Text>
            <Text style={[styles.detailValue, { color: '#10B981', fontWeight: 'bold' }]}>₹{delivery.delivery_fee || 50}</Text>
          </View>
        </View>

        {nextAction && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleStatusUpdate(delivery.id, nextAction.nextStatus)}
            disabled={updating === delivery.id}
          >
            {updating === delivery.id ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={nextAction.icon as any} size={20} color="#fff" />
                <Text style={styles.actionText}>{nextAction.label}</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
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
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        <Text style={styles.headerSubtitle}>{deliveries.length} pending</Text>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No active deliveries. Check Available tab for new orders.</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
        >
          {deliveries.map(renderDelivery)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  listContainer: { padding: 16 },
  deliveryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumber: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  progressContainer: { marginBottom: 16 },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 10, color: '#9CA3AF' },
  activeLabel: { color: '#10B981', fontWeight: '600' },
  locationSection: { marginBottom: 16 },
  locationItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  locationInfo: { flex: 1, marginLeft: 12 },
  locationLabel: { fontSize: 10, color: '#6B7280', marginBottom: 4 },
  locationName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  locationAddress: { fontSize: 14, color: '#6B7280' },
  callButton: { padding: 8, backgroundColor: '#D1FAE5', borderRadius: 8 },
  orderDetails: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', padding: 16, borderRadius: 12, gap: 8 },
  actionText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
