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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deliveryAPI } from '@/src/services/api';

const G = '#10B981';

const STATUS_FLOW = [
  { key: 'out_for_pickup', label: 'On the Way', icon: 'navigate' as const, color: '#3B82F6', desc: 'Head to store for pickup' },
  { key: 'picked_up', label: 'Order Picked Up', icon: 'bag-check' as const, color: '#8B5CF6', desc: 'Collected from store' },
  { key: 'in_transit', label: 'In Transit', icon: 'bicycle' as const, color: '#F59E0B', desc: 'On the way to customer' },
  { key: 'reached_location', label: 'Reached Location', icon: 'location' as const, color: '#3B82F6', desc: 'Arrived at drop-off' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle' as const, color: '#059669', desc: 'Successfully delivered' },
];

export default function ActiveDeliveriesScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ orderId: string; nextStatus: string; label: string } | null>(null);
  const [expandedItems, setExpandedItems] = useState<string | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const callPhone = (phone: string) => {
    if (phone && phone !== 'N/A') {
      Linking.openURL(`tel:${phone}`);
    }
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
    // If status is "on_the_way" (old), map to picked_up
    if (currentStatus === 'on_the_way') return STATUS_FLOW[1];
    return null;
  };

  const getCurrentStatusIndex = (status: string) => {
    const idx = STATUS_FLOW.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setConfirmModal(null);
    try {
      setUpdating(orderId);
      await deliveryAPI.updateDeliveryStatus(orderId, newStatus);
      showToast(`Updated to ${STATUS_FLOW.find(s => s.key === newStatus)?.label || newStatus}`);
      loadOrders();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const renderStatusTimeline = (currentStatus: string) => {
    const currentIdx = getCurrentStatusIndex(currentStatus);
    return (
      <View style={styles.timeline}>
        {STATUS_FLOW.map((step, idx) => {
          const isCompleted = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && { backgroundColor: step.color },
                  isCurrent && styles.timelineDotCurrent,
                ]}>
                  {isCompleted ? (
                    <Ionicons name={isCurrent ? step.icon : 'checkmark'} size={isCurrent ? 14 : 12} color="#fff" />
                  ) : (
                    <Text style={styles.timelineStepNum}>{idx + 1}</Text>
                  )}
                </View>
                {idx < STATUS_FLOW.length - 1 && (
                  <View style={[
                    styles.timelineLine,
                    isCompleted && idx < currentIdx && { backgroundColor: G },
                  ]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineLabel,
                  isCompleted && { color: '#0F172A', fontWeight: '700' },
                  isCurrent && { color: step.color },
                ]}>
                  {step.label}
                </Text>
                {isCurrent && <Text style={styles.timelineDesc}>{step.desc}</Text>}
              </View>
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
            const currentStep = STATUS_FLOW.find(s => s.key === order.status) || STATUS_FLOW[0];
            const items = order.items || [];
            const storePhone = order.pickup_location?.phone || order.store?.phone || 'N/A';
            const customerPhone = order.customer_phone || 'N/A';
            const customerName = order.customer?.name || 'Customer';
            const isItemsExpanded = expandedItems === order.id;

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
                  <View style={[styles.currentStatusBadge, { backgroundColor: currentStep.color + '15' }]}>
                    <Ionicons name={currentStep.icon} size={14} color={currentStep.color} />
                    <Text style={[styles.currentStatusText, { color: currentStep.color }]}>
                      {currentStep.label}
                    </Text>
                  </View>
                </View>

                {/* Status Timeline */}
                {renderStatusTimeline(order.status)}

                {/* Pickup Location with Call */}
                <View style={styles.locationSection}>
                  <View style={styles.locationCard}>
                    <View style={[styles.locIcon, { backgroundColor: G + '15' }]}>
                      <Ionicons name="restaurant" size={16} color={G} />
                    </View>
                    <View style={styles.locDetails}>
                      <Text style={styles.locLabel}>Pickup</Text>
                      <Text style={styles.locName}>{order.pickup_location?.name || order.store?.name || 'Store'}</Text>
                      <Text style={styles.locAddr}>
                        {order.pickup_location?.address || order.store?.address || ''}
                      </Text>
                    </View>
                    {storePhone !== 'N/A' && (
                      <TouchableOpacity style={[styles.callBtnSmall, { backgroundColor: G + '15' }]} onPress={() => callPhone(storePhone)}>
                        <Ionicons name="call" size={16} color={G} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.locationCard}>
                    <View style={[styles.locIcon, { backgroundColor: '#EF444415' }]}>
                      <Ionicons name="location" size={16} color="#EF4444" />
                    </View>
                    <View style={styles.locDetails}>
                      <Text style={styles.locLabel}>Deliver to {customerName}</Text>
                      <Text style={styles.locAddr}>
                        {order.drop_location?.address || 'Customer address'}
                        {order.drop_location?.city ? `, ${order.drop_location.city}` : ''}
                      </Text>
                      {order.drop_location?.landmark ? (
                        <Text style={styles.locLandmark}>Near: {order.drop_location.landmark}</Text>
                      ) : null}
                    </View>
                    {customerPhone !== 'N/A' && (
                      <TouchableOpacity style={[styles.callBtnSmall, { backgroundColor: '#3B82F615' }]} onPress={() => callPhone(customerPhone)}>
                        <Ionicons name="call" size={16} color="#3B82F6" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Order Items */}
                <TouchableOpacity
                  style={styles.itemsToggle}
                  onPress={() => setExpandedItems(isItemsExpanded ? null : order.id)}
                >
                  <View style={styles.itemsToggleLeft}>
                    <Ionicons name="receipt-outline" size={16} color="#64748B" />
                    <Text style={styles.itemsToggleText}>
                      {items.length} items {'\u00B7'} {'\u20B9'}{order.total_amount}
                    </Text>
                  </View>
                  <View style={styles.itemsToggleRight}>
                    <Text style={styles.payMethodText}>{order.payment_method === 'cod' ? 'COD' : 'Paid'}</Text>
                    <Ionicons name={isItemsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>

                {isItemsExpanded && items.length > 0 && (
                  <View style={styles.itemsList}>
                    {items.map((item: any, idx: number) => (
                      <View key={item.id || idx} style={styles.itemRow}>
                        <View style={styles.itemQtyBadge}>
                          <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                        </View>
                        <Text style={styles.itemNameText}>{item.item_name}</Text>
                        <Text style={styles.itemPriceText}>{'\u20B9'}{item.total_price || (item.unit_price * item.quantity)}</Text>
                      </View>
                    ))}
                    <View style={styles.itemsTotalRow}>
                      <Text style={styles.itemsTotalLabel}>Order Total</Text>
                      <Text style={styles.itemsTotalValue}>{'\u20B9'}{order.total_amount}</Text>
                    </View>
                  </View>
                )}

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
                        <Ionicons name={nextStatus.icon} size={18} color="#fff" />
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

      {/* Confirm Modal */}
      <Modal visible={!!confirmModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#D1FAE5' }]}>
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
    marginBottom: 14,
  },
  orderNumber: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  orderTime: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  currentStatusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    paddingVertical: 5, borderRadius: 10, gap: 5,
  },
  currentStatusText: { fontSize: 12, fontWeight: '700' },

  // Timeline
  timeline: { marginBottom: 14 },
  timelineStep: { flexDirection: 'row', minHeight: 36 },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineDot: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotCurrent: {
    borderWidth: 2, borderColor: 'rgba(16,185,129,0.3)',
  },
  timelineStepNum: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', minHeight: 8 },
  timelineContent: { flex: 1, marginLeft: 10, paddingBottom: 8 },
  timelineLabel: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  timelineDesc: { fontSize: 11, color: '#64748B', marginTop: 1 },

  // Location Section
  locationSection: {
    marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  locationCard: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10,
  },
  locIcon: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  locDetails: { flex: 1 },
  locLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  locName: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginTop: 1 },
  locAddr: { fontSize: 12, color: '#64748B', marginTop: 1, lineHeight: 16 },
  locLandmark: { fontSize: 11, color: '#F59E0B', fontWeight: '500', marginTop: 2 },
  callBtnSmall: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // Items toggle
  itemsToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F8FAFC', marginBottom: 12,
  },
  itemsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsToggleText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  itemsToggleRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payMethodText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  itemsList: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  itemQtyBadge: {
    width: 28, height: 22, borderRadius: 4, backgroundColor: G + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: G },
  itemNameText: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  itemPriceText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  itemsTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 8, marginTop: 4,
  },
  itemsTotalLabel: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  itemsTotalValue: { fontSize: 15, fontWeight: '800', color: '#0F172A' },

  // Action Button
  statusButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 14, gap: 8,
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
    width: 56, height: 56, borderRadius: 28,
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
