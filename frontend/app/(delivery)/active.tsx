import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '@/src/services/api';

const G = '#10B981';

const STATUS_FLOW = [
  { key: 'out_for_pickup', label: 'Heading to Store', icon: 'navigate', color: '#3B82F6' },
  { key: 'picked_up', label: 'Picked Up', icon: 'bag-check', color: '#8B5CF6' },
  { key: 'out_for_delivery', label: 'On the Way', icon: 'bicycle', color: G },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle', color: '#059669' },
];

export default function ActiveDeliveriesScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ orderId: string; nextStatus: string; label: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadOrders = useCallback(async () => {
    try {
      const response = await deliveryAPI.getAssignedDeliveries();
      setOrders(response.data.deliveries || []);
    } catch (error) {
      console.error('Error loading assigned orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = STATUS_FLOW.findIndex(s => s.key === currentStatus);
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      return STATUS_FLOW[idx + 1];
    }
    return null;
  };

  const getCurrentStatusIndex = (status: string) => {
    return STATUS_FLOW.findIndex(s => s.key === status);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setConfirmModal(null);
    try {
      setUpdating(orderId);
      await deliveryAPI.updateDeliveryStatus(orderId, newStatus);
      showToast(`Status updated to ${STATUS_FLOW.find(s => s.key === newStatus)?.label || newStatus}`);
      loadOrders();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const renderProgressBar = (currentStatus: string) => {
    const currentIdx = getCurrentStatusIndex(currentStatus);
    return (
      <View style={styles.progressContainer}>
        {STATUS_FLOW.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <View key={step.key} style={styles.progressStep}>
              <View style={[
                styles.progressDot,
                isCompleted && { backgroundColor: step.color },
                isCurrent && { borderWidth: 2, borderColor: step.color + '40' },
              ]}>
                {isCompleted && (
                  <Ionicons name={isCurrent ? step.icon as any : 'checkmark'} size={isCurrent ? 12 : 10} color="#fff" />
                )}
              </View>
              {idx < STATUS_FLOW.length - 1 && (
                <View style={[
                  styles.progressLine,
                  isCompleted && idx < currentIdx && { backgroundColor: G },
                ]} />
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={G} />
          <Text style={styles.loadingText}>Loading deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{orders.length}</Text>
        </View>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No active deliveries</Text>
          <Text style={styles.emptySub}>Accept orders from the Home tab to see them here</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G]} />}
          contentContainerStyle={styles.scrollContent}
        >
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const isUpdating = updating === order.id;
            const currentStep = STATUS_FLOW.find(s => s.key === order.status);

            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>#{order.order_number}</Text>
                    <Text style={styles.orderTime}>
                      {order.placed_at ? new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <View style={[styles.currentStatusBadge, { backgroundColor: (currentStep?.color || G) + '15' }]}>
                    <Ionicons name={currentStep?.icon as any || 'ellipse'} size={14} color={currentStep?.color || G} />
                    <Text style={[styles.currentStatusText, { color: currentStep?.color || G }]}>
                      {currentStep?.label || order.status}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                {renderProgressBar(order.status)}

                {/* Route Info */}
                <View style={styles.routeSection}>
                  <View style={styles.routeRow}>
                    <View style={[styles.routeIndicator, { backgroundColor: G }]} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Pickup</Text>
                      <Text style={styles.routeValue}>{order.pickup_location?.name || 'Store'}</Text>
                    </View>
                  </View>
                  <View style={styles.routeDash} />
                  <View style={styles.routeRow}>
                    <View style={[styles.routeIndicator, { backgroundColor: '#EF4444' }]} />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLabel}>Drop-off</Text>
                      <Text style={styles.routeValue} numberOfLines={1}>
                        {order.drop_location?.address || 'Customer address'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Order Details */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="receipt-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{order.items?.length || 0} items</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{'\u20B9'}{order.total_amount}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="card-outline" size={16} color="#64748B" />
                    <Text style={styles.detailText}>{order.payment_method === 'cod' ? 'COD' : 'Paid'}</Text>
                  </View>
                </View>

                {/* Action Button */}
                {nextStatus && order.status !== 'delivered' ? (
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: nextStatus.color }]}
                    onPress={() => setConfirmModal({
                      orderId: order.id,
                      nextStatus: nextStatus.key,
                      label: nextStatus.label,
                    })}
                    disabled={isUpdating}
                    activeOpacity={0.85}
                  >
                    {isUpdating ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name={nextStatus.icon as any} size={18} color="#fff" />
                        <Text style={styles.statusButtonText}>
                          Mark as {nextStatus.label}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : order.status === 'delivered' ? (
                  <View style={styles.deliveredBanner}>
                    <Ionicons name="checkmark-done-circle" size={20} color="#059669" />
                    <Text style={styles.deliveredText}>Delivery Complete</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Confirm Status Modal */}
      <Modal visible={!!confirmModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={32} color={G} />
            </View>
            <Text style={styles.modalTitle}>Update Status</Text>
            <Text style={styles.modalMsg}>
              Mark this order as "{confirmModal?.label}"?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: G }]}
                onPress={() => confirmModal && handleStatusUpdate(confirmModal.orderId, confirmModal.nextStatus)}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={[styles.toastWrap, toast.type === 'error' ? { backgroundColor: '#EF4444' } : { backgroundColor: G }]}>
          <Ionicons name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={16} color="#fff" />
          <Text style={styles.toastText}>{toast.msg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  countBadge: {
    backgroundColor: G, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  countText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  scrollContent: { padding: 16 },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderNumber: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  orderTime: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  currentStatusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 10, gap: 5,
  },
  currentStatusText: { fontSize: 12, fontWeight: '700' },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    paddingHorizontal: 4,
  },
  progressStep: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: 2 },

  // Route
  routeSection: { marginBottom: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeIndicator: { width: 10, height: 10, borderRadius: 5 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  routeValue: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 1 },
  routeDash: {
    width: 2, height: 14, backgroundColor: '#E2E8F0', marginLeft: 4, marginVertical: 4,
  },

  // Details
  detailsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginBottom: 14,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  // Action Button
  statusButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  statusButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  deliveredBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 14, backgroundColor: '#D1FAE5', gap: 8,
  },
  deliveredText: { fontSize: 15, fontWeight: '700', color: '#059669' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center' },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%',
    maxWidth: 320, alignItems: 'center',
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  modalMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 22, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modalConfirm: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Toast
  toastWrap: {
    position: 'absolute', top: 60, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, elevation: 8,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
