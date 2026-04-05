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

const DRIVER_COLOR = '#10B981';

export default function ActiveDeliveryScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadDeliveries = useCallback(async () => {
    try {
      const response = await deliveryAPI.getAssignedDeliveries();
      setDeliveries(response.data.deliveries || []);
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

    Alert.alert('Confirm', statusMessages[newStatus] || 'Update status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            setUpdating(orderId);
            await deliveryAPI.updateDeliveryStatus(orderId, newStatus);
            Alert.alert('Success', newStatus === 'delivered' ? 'Order delivered successfully!' : 'Status updated!');
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
        return { label: 'Picked Up', nextStatus: 'picked_up', icon: 'checkmark-circle' as const };
      case 'picked_up':
        return { label: 'Start Delivery', nextStatus: 'out_for_delivery', icon: 'navigate' as const };
      case 'out_for_delivery':
        return { label: 'Mark Delivered', nextStatus: 'delivered', icon: 'checkmark-done' as const };
      default:
        return null;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'out_for_pickup':
        return { color: '#F59E0B', bg: '#FEF3C7', label: 'Going to Pickup', progress: 25 };
      case 'picked_up':
        return { color: '#3B82F6', bg: '#DBEAFE', label: 'Picked Up', progress: 50 };
      case 'out_for_delivery':
        return { color: '#8B5CF6', bg: '#EDE9FE', label: 'On the Way', progress: 75 };
      default:
        return { color: '#6B7280', bg: '#F3F4F6', label: status?.replace(/_/g, ' ') || 'Processing', progress: 0 };
    }
  };

  const renderDelivery = (delivery: any) => {
    const nextAction = getNextAction(delivery.status);
    const statusConfig = getStatusConfig(delivery.status);

    return (
      <View key={delivery.id} style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>#{delivery.order_number}</Text>
            <Text style={styles.orderTime}>
              {delivery.payment_method === 'cod' ? 'Collect Cash' : 'Already Paid'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${statusConfig.progress}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <View style={[styles.progressDot, statusConfig.progress >= 25 && styles.progressDotActive]} />
            <View style={[styles.progressDot, statusConfig.progress >= 50 && styles.progressDotActive]} />
            <View style={[styles.progressDot, statusConfig.progress >= 75 && styles.progressDotActive]} />
            <View style={[styles.progressDot, statusConfig.progress >= 100 && styles.progressDotActive]} />
          </View>
          <View style={styles.progressLabelsText}>
            <Text style={[styles.progressLabel, statusConfig.progress >= 25 && styles.activeLabel]}>Pickup</Text>
            <Text style={[styles.progressLabel, statusConfig.progress >= 50 && styles.activeLabel]}>Picked</Text>
            <Text style={[styles.progressLabel, statusConfig.progress >= 75 && styles.activeLabel]}>Enroute</Text>
            <Text style={[styles.progressLabel, statusConfig.progress >= 100 && styles.activeLabel]}>Done</Text>
          </View>
        </View>

        {/* Locations */}
        <View style={styles.locationSection}>
          <View style={styles.locationItem}>
            <View style={[styles.locationIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="restaurant" size={18} color={DRIVER_COLOR} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup from</Text>
              <Text style={styles.locationName}>{delivery.store?.name || 'Store'}</Text>
              <Text style={styles.locationAddress}>{delivery.store?.address || 'Store address'}</Text>
            </View>
          </View>

          <View style={styles.locationDivider} />

          <View style={styles.locationItem}>
            <View style={[styles.locationIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="location" size={18} color="#EF4444" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Deliver to</Text>
              <Text style={styles.locationAddress}>
                {delivery.delivery_address?.address_line || 'Customer address'}
              </Text>
              <Text style={styles.locationAddress}>
                {delivery.delivery_address?.city || ''}{delivery.delivery_address?.pincode ? `, ${delivery.delivery_address.pincode}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Amount</Text>
            <Text style={styles.detailValue}>{'\u20B9'}{delivery.total_amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Your Earning</Text>
            <Text style={[styles.detailValue, { color: DRIVER_COLOR, fontWeight: '700' }]}>
              +{'\u20B9'}{delivery.delivery_fee || 50}
            </Text>
          </View>
        </View>

        {/* Action Button */}
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
                <Ionicons name={nextAction.icon} size={22} color="#fff" />
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={DRIVER_COLOR} />
          <Text style={styles.loadingText}>Loading active deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{deliveries.length}</Text>
        </View>
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="checkmark-circle" size={56} color={DRIVER_COLOR} />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No active deliveries right now.{'\n'}Check the Deliveries tab for new orders.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DRIVER_COLOR]} />}
          contentContainerStyle={styles.listContainer}
        >
          {deliveries.map(renderDelivery)}
          <View style={{ height: 20 }} />
        </ScrollView>
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
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  countBadge: {
    backgroundColor: DRIVER_COLOR,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  listContainer: { padding: 16 },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderNumber: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  orderTime: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressContainer: { marginBottom: 20 },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DRIVER_COLOR,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  progressDotActive: { backgroundColor: DRIVER_COLOR },
  progressLabelsText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: { fontSize: 10, color: '#9CA3AF' },
  activeLabel: { color: DRIVER_COLOR, fontWeight: '600' },
  locationSection: { marginBottom: 16 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  locationName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  locationAddress: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  locationDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 52 },
  orderDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DRIVER_COLOR,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  actionText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
});
