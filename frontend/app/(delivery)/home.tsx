import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/src/contexts/LocationContext';
import { deliveryAPI } from '@/src/services/api';

const G = '#10B981';

export default function DeliveryHomeScreen() {
  const { location, address } = useLocation();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rejectConfirm, setRejectConfirm] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const callPhone = (phone: string) => {
    if (phone && phone !== 'N/A') {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const loadDeliveries = useCallback(async () => {
    if (!location || !isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
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
  }, [location, isOnline]);

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
        showToast('Delivery accepted! Check Active tab.');
        loadDeliveries();
      }
    } catch (error: any) {
      showToast(error.response?.data?.detail || 'Failed to accept delivery', 'error');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setRejectConfirm(null);
    try {
      await deliveryAPI.rejectDelivery(orderId, 'Not available');
      showToast('Delivery declined');
      loadDeliveries();
    } catch (error) {
      showToast('Failed to decline delivery', 'error');
    }
  };

  const renderDelivery = ({ item }: { item: any }) => {
    const isExpanded = expandedCard === item.id;
    const items = item.items || [];
    const storePhone = item.pickup_location?.phone || 'N/A';
    const customerPhone = item.customer_phone || 'N/A';
    const customerName = item.customer?.name || 'Customer';

    return (
      <View style={styles.deliveryCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.orderRow}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <View style={styles.moduleBadge}>
                <Text style={styles.moduleText}>
                  {item.pickup_location?.store_type === 'grocery' ? 'Grocery' :
                   item.pickup_location?.store_type === 'laundry' ? 'Laundry' : 'Food'}
                </Text>
              </View>
            </View>
            <Text style={styles.orderMeta}>
              {item.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'} {'\u00B7'} {items.length} items
            </Text>
          </View>
          <View style={styles.earningBadge}>
            <Text style={styles.earningText}>+{'\u20B9'}{item.estimated_earning || 50}</Text>
          </View>
        </View>

        {/* Store (Pickup) */}
        <View style={styles.locationSection}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: G }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>PICKUP FROM</Text>
              <Text style={styles.locationName}>{item.pickup_location?.name || 'Store'}</Text>
              <Text style={styles.locationAddress}>
                {item.pickup_location?.address || ''}{item.pickup_location?.city ? `, ${item.pickup_location.city}` : ''}
              </Text>
              {item.pickup_location?.distance_km != null && (
                <Text style={styles.distanceText}>{item.pickup_location.distance_km.toFixed(1)} km away</Text>
              )}
            </View>
            {storePhone !== 'N/A' && (
              <TouchableOpacity style={styles.callBtn} onPress={() => callPhone(storePhone)}>
                <Ionicons name="call" size={16} color={G} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.routeConnector}>
            <View style={styles.routeDashLine} />
          </View>

          {/* Customer (Drop-off) */}
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: '#EF4444' }]} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>DELIVER TO</Text>
              <Text style={styles.locationName}>{customerName}</Text>
              <Text style={styles.locationAddress}>
                {item.drop_location?.address || 'Customer address'}{item.drop_location?.city ? `, ${item.drop_location.city}` : ''}
              </Text>
              {item.drop_location?.landmark ? (
                <Text style={styles.landmarkText}>Near: {item.drop_location.landmark}</Text>
              ) : null}
            </View>
            {customerPhone !== 'N/A' && (
              <TouchableOpacity style={styles.callBtn} onPress={() => callPhone(customerPhone)}>
                <Ionicons name="call" size={16} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Items Preview / Expand */}
        <TouchableOpacity
          style={styles.itemsToggle}
          onPress={() => setExpandedCard(isExpanded ? null : item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.itemsToggleLeft}>
            <Ionicons name="receipt-outline" size={16} color="#64748B" />
            <Text style={styles.itemsToggleText}>
              {items.length} {items.length === 1 ? 'item' : 'items'} {'\u00B7'} {'\u20B9'}{item.total_amount}
            </Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94A3B8" />
        </TouchableOpacity>

        {isExpanded && items.length > 0 && (
          <View style={styles.itemsList}>
            {items.map((orderItem: any, idx: number) => (
              <View key={orderItem.id || idx} style={styles.itemRow}>
                <View style={styles.itemQty}>
                  <Text style={styles.itemQtyText}>{orderItem.quantity}x</Text>
                </View>
                <Text style={styles.itemName}>{orderItem.item_name}</Text>
                <Text style={styles.itemPrice}>{'\u20B9'}{orderItem.total_price || (orderItem.unit_price * orderItem.quantity)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => setRejectConfirm(item.id)}
          >
            <Ionicons name="close" size={18} color="#EF4444" />
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAccept(item.id)}
            disabled={accepting === item.id}
            activeOpacity={0.85}
          >
            {accepting === item.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.acceptText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={G} />
          <Text style={styles.loadingText}>Finding deliveries...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>
            {isOnline ? 'Ready to deliver' : 'You are offline'}
          </Text>
          <View style={styles.locationRowHeader}>
            <Ionicons name="location" size={14} color={G} />
            <Text style={styles.locationTextHeader} numberOfLines={1}>
              {address?.city || 'Current Location'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.toggleContainer, !isOnline && styles.toggleContainerOff]}
          onPress={() => setIsOnline(!isOnline)}
          activeOpacity={0.8}
        >
          <View style={[styles.toggleThumb, !isOnline && styles.toggleThumbOff]} />
          <Text style={[styles.toggleText, !isOnline && styles.toggleTextOff]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>
      </View>

      {!isOnline ? (
        <View style={styles.offlineState}>
          <View style={styles.offlineIcon}>
            <Ionicons name="moon-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineSubtitle}>Go online to start receiving delivery requests</Text>
          <TouchableOpacity style={styles.goOnlineBtn} onPress={() => setIsOnline(true)}>
            <Ionicons name="power" size={18} color="#fff" />
            <Text style={styles.goOnlineBtnText}>Go Online</Text>
          </TouchableOpacity>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bicycle-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No deliveries nearby</Text>
          <Text style={styles.emptySubtitle}>New orders will appear here automatically</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={16} color="#fff" />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[G]} />
          }
        />
      )}

      {/* Reject Modal */}
      <Modal visible={!!rejectConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={[styles.modalIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="close-circle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Decline Delivery?</Text>
            <Text style={styles.modalMsg}>This order will be available for other drivers.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectConfirm(null)}>
                <Text style={styles.modalCancelText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: '#EF4444' }]}
                onPress={() => rejectConfirm && handleReject(rejectConfirm)}
              >
                <Text style={styles.modalConfirmText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={[styles.toastWrap, toast.type === 'error' ? { backgroundColor: '#EF4444' } : { backgroundColor: G }]}>
          <Ionicons name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} size={16} color="#fff" />
          <Text style={styles.toastText}>{toast.message}</Text>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  locationRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationTextHeader: { fontSize: 15, fontWeight: '700', color: '#0F172A', maxWidth: 180 },

  toggleContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#D1FAE5', paddingHorizontal: 4, paddingVertical: 4,
    borderRadius: 24, minWidth: 96, gap: 6,
  },
  toggleContainerOff: { backgroundColor: '#F1F5F9' },
  toggleThumb: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: G,
    alignItems: 'center', justifyContent: 'center',
  },
  toggleThumbOff: { backgroundColor: '#94A3B8' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#065F46', paddingRight: 10 },
  toggleTextOff: { color: '#64748B' },

  listContainer: { padding: 16 },

  deliveryCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  moduleBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  moduleText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  orderMeta: { fontSize: 12, color: '#94A3B8', marginTop: 3 },
  earningBadge: {
    backgroundColor: '#D1FAE5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  },
  earningText: { fontSize: 16, fontWeight: '800', color: '#065F46' },

  locationSection: { marginBottom: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  locationDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, marginRight: 12 },
  locationInfo: { flex: 1 },
  locationLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 2 },
  locationName: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 1 },
  locationAddress: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  distanceText: { fontSize: 12, color: G, fontWeight: '600', marginTop: 2 },
  landmarkText: { fontSize: 12, color: '#F59E0B', fontWeight: '500', marginTop: 2 },
  callBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  routeConnector: { paddingLeft: 4, paddingVertical: 2 },
  routeDashLine: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 3 },

  itemsToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
    backgroundColor: '#F8FAFC', marginBottom: 12,
  },
  itemsToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemsToggleText: { fontSize: 13, fontWeight: '600', color: '#334155' },

  itemsList: {
    backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  itemQty: {
    width: 28, height: 22, borderRadius: 4, backgroundColor: G + '15',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  itemQtyText: { fontSize: 12, fontWeight: '700', color: G },
  itemName: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500' },
  itemPrice: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  actions: { flexDirection: 'row', gap: 10 },
  rejectButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#FECACA',
    backgroundColor: '#FEF2F2', gap: 6,
  },
  rejectText: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  acceptButton: {
    flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 13, borderRadius: 12, backgroundColor: G, gap: 6,
  },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 28 },
  refreshButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: G,
    paddingHorizontal: 24, paddingVertical: 13, borderRadius: 12, gap: 6,
  },
  refreshText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  offlineState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  offlineIcon: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  offlineTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  offlineSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  goOnlineBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: G,
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, gap: 8,
  },
  goOnlineBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

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

  toastWrap: {
    position: 'absolute', top: 60, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, elevation: 8,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
