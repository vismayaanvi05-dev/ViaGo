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
  { key: 'out_for_pickup', label: 'Go to Pickup', icon: 'navigate', next: 'picked_up', nextLabel: 'Arrived & Picked Up' },
  { key: 'picked_up', label: 'Picked Up', icon: 'bag-check', next: 'out_for_delivery', nextLabel: 'Start Delivery' },
  { key: 'out_for_delivery', label: 'On the Way', icon: 'bicycle', next: 'delivered', nextLabel: 'Mark Delivered' },
];

const getStatusMeta = (status: string) => {
  switch (status) {
    case 'out_for_pickup': return { color: '#F59E0B', bg: '#FEF3C7', label: 'Go to Pickup', step: 0 };
    case 'picked_up': return { color: '#3B82F6', bg: '#DBEAFE', label: 'Picked Up', step: 1 };
    case 'out_for_delivery': return { color: '#8B5CF6', bg: '#EDE9FE', label: 'On the Way', step: 2 };
    default: return { color: '#6B7280', bg: '#F3F4F6', label: status?.replace(/_/g, ' ') || 'Pending', step: -1 };
  }
};

export default function ActiveDeliveryScreen() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; status: string; label: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  const handleStatusUpdate = async () => {
    if (!confirmAction) return;
    const { orderId, status } = confirmAction;
    setConfirmAction(null);
    setUpdating(orderId);
    try {
      await deliveryAPI.updateDeliveryStatus(orderId, status);
      if (status === 'delivered') {
        showToast('Order delivered successfully!');
      } else {
        showToast('Status updated');
      }
      await loadDeliveries();
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to update', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const openMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const renderDelivery = (delivery: any) => {
    const meta = getStatusMeta(delivery.status);
    const flow = STATUS_FLOW.find(f => f.key === delivery.status);
    const isUpdating = updating === delivery.id;
    const steps = ['Accepted', 'Picked Up', 'On the Way', 'Delivered'];
    const currentStep = meta.step + 1;

    return (
      <View key={delivery.id} style={styles.card}>
        {/* Order Header */}
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>Order #{delivery.order_number}</Text>
            <Text style={styles.orderMeta}>
              {delivery.items?.length || 0} items {'\u2022'} {'\u20B9'}{delivery.total_amount}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Progress Steps */}
        <View style={styles.progress}>
          {steps.map((s, i) => (
            <View key={i} style={styles.progressStep}>
              <View style={[styles.progressDot, i < currentStep ? styles.progressDotDone : (i === currentStep ? styles.progressDotActive : {})]}>
                {i < currentStep ? <Ionicons name="checkmark" size={10} color="#fff" /> : null}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.progressLine, i < currentStep ? styles.progressLineDone : {}]} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.progressLabels}>
          {steps.map((s, i) => (
            <Text key={i} style={[styles.progressLabelText, i <= currentStep ? { color: G, fontWeight: '600' } : {}]}>{s}</Text>
          ))}
        </View>

        {/* Pickup Location */}
        <View style={styles.locationBlock}>
          <View style={styles.locationRow}>
            <View style={[styles.locIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="restaurant" size={16} color={G} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>PICKUP</Text>
              <Text style={styles.locName}>{delivery.store?.name || 'Store'}</Text>
              <Text style={styles.locAddr}>{delivery.store?.address || ''}</Text>
            </View>
            {delivery.store?.lat && (
              <TouchableOpacity style={styles.navBtn} onPress={() => openMaps(delivery.store.lat, delivery.store.lng, delivery.store.name)}>
                <Ionicons name="navigate" size={18} color={G} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.locDivider} />

          <View style={styles.locationRow}>
            <View style={[styles.locIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="location" size={16} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>DROP-OFF</Text>
              <Text style={styles.locAddr}>
                {delivery.delivery_address?.address_line || 'Customer address'}
                {delivery.delivery_address?.city ? `, ${delivery.delivery_address.city}` : ''}
              </Text>
              {delivery.delivery_address?.phone && (
                <Text style={styles.locPhone}>{delivery.delivery_address.phone}</Text>
              )}
            </View>
            {delivery.delivery_address?.lat && (
              <TouchableOpacity style={styles.navBtn} onPress={() => openMaps(delivery.delivery_address.lat, delivery.delivery_address.lng, 'Customer')}>
                <Ionicons name="navigate" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Earnings */}
        <View style={styles.earningRow}>
          <View>
            <Text style={styles.earningLabel}>Payment</Text>
            <Text style={styles.earningValue}>{delivery.payment_method === 'cod' ? 'Collect Cash' : 'Prepaid'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.earningLabel}>Your Earning</Text>
            <Text style={[styles.earningValue, { color: G }]}>+{'\u20B9'}{delivery.delivery_fee || 50}</Text>
          </View>
        </View>

        {/* Action Button */}
        {flow && (
          <TouchableOpacity
            style={[styles.actionBtn, isUpdating && { opacity: 0.6 }]}
            onPress={() => setConfirmAction({ orderId: delivery.id, status: flow.next, label: flow.nextLabel })}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name={flow.next === 'delivered' ? 'checkmark-done-circle' : 'arrow-forward-circle'} size={22} color="#fff" />
                <Text style={styles.actionBtnText}>{flow.nextLabel}</Text>
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
          <ActivityIndicator size="large" color={G} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Deliveries</Text>
        {deliveries.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{deliveries.length}</Text>
          </View>
        )}
      </View>

      {deliveries.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCircle}>
            <Ionicons name="checkmark-done" size={48} color={G} />
          </View>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>No active deliveries.{'\n'}Accept orders from Deliveries tab.</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDeliveries(); }} colors={[G]} />}
        >
          {deliveries.map(renderDelivery)}
        </ScrollView>
      )}

      {/* Confirm Action Modal */}
      <Modal visible={!!confirmAction} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={[styles.modalIconWrap, { backgroundColor: confirmAction?.status === 'delivered' ? '#D1FAE5' : '#DBEAFE' }]}>
              <Ionicons
                name={confirmAction?.status === 'delivered' ? 'checkmark-done-circle' : 'arrow-forward-circle'}
                size={32}
                color={confirmAction?.status === 'delivered' ? G : '#3B82F6'}
              />
            </View>
            <Text style={styles.modalTitle}>{confirmAction?.label}?</Text>
            <Text style={styles.modalMsg}>
              {confirmAction?.status === 'delivered'
                ? 'Confirm that you have delivered this order to the customer.'
                : 'Update the delivery status for this order.'}
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmAction(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: G }]} onPress={handleStatusUpdate}>
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={[styles.toastWrap, toast.type === 'error' ? { backgroundColor: '#EF4444' } : { backgroundColor: G }]}>
          <Ionicons name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={18} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F2',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  countBadge: {
    backgroundColor: G, minWidth: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  countText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  orderId: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  orderMeta: { fontSize: 13, color: '#8E8EA0', marginTop: 4 },
  statusPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  statusPillText: { fontSize: 12, fontWeight: '700' },

  progress: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 6 },
  progressStep: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E5E5EA', alignItems: 'center', justifyContent: 'center' },
  progressDotDone: { backgroundColor: G },
  progressDotActive: { backgroundColor: '#E5E5EA', borderWidth: 2, borderColor: G },
  progressLine: { flex: 1, height: 3, backgroundColor: '#E5E5EA', marginHorizontal: 2 },
  progressLineDone: { backgroundColor: G },
  progressLabels: { flexDirection: 'row', paddingHorizontal: 0, marginBottom: 18 },
  progressLabelText: { flex: 1, fontSize: 10, color: '#8E8EA0', textAlign: 'center' },

  locationBlock: { backgroundColor: '#F9F9FB', borderRadius: 14, padding: 14, marginBottom: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8 },
  locIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  locLabel: { fontSize: 10, fontWeight: '700', color: '#8E8EA0', letterSpacing: 0.5, marginBottom: 3 },
  locName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 2 },
  locAddr: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  locPhone: { fontSize: 13, color: G, fontWeight: '500', marginTop: 4 },
  locDivider: { height: 1, backgroundColor: '#E5E5EA', marginLeft: 48, marginVertical: 4 },
  navBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },

  earningRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F9F9FB', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  earningLabel: { fontSize: 12, color: '#8E8EA0', marginBottom: 4 },
  earningValue: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: G, paddingVertical: 16, borderRadius: 14, gap: 10,
  },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  emptyCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#8E8EA0', textAlign: 'center', lineHeight: 22 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 320, alignItems: 'center' },
  modalIconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  modalMsg: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  toastWrap: {
    position: 'absolute', top: 60, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, elevation: 8,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
