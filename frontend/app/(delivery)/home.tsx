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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
      showToast('Delivery rejected');
      loadDeliveries();
    } catch (error) {
      showToast('Failed to reject delivery', 'error');
    }
  };

  const renderDelivery = ({ item }: { item: any }) => (
    <View style={styles.deliveryCard}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          <Text style={styles.orderMeta}>
            {item.payment_method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
          </Text>
        </View>
        <View style={styles.earningBadge}>
          <Text style={styles.earningText}>+{'\u20B9'}{item.estimated_earning || 50}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routeTimeline}>
          <View style={[styles.routeDot, { backgroundColor: G }]} />
          <View style={styles.routeLine} />
          <View style={[styles.routeDot, { backgroundColor: '#EF4444' }]} />
        </View>
        <View style={styles.routeDetails}>
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>PICKUP</Text>
            <Text style={styles.routeName}>{item.pickup_location?.name || 'Store'}</Text>
            <Text style={styles.routeAddress}>{item.pickup_location?.address || 'Store address'}</Text>
            {item.pickup_location?.distance_km != null && (
              <Text style={styles.routeDistance}>{item.pickup_location.distance_km.toFixed(1)} km away</Text>
            )}
          </View>
          <View style={styles.routePoint}>
            <Text style={styles.routeLabel}>DROP-OFF</Text>
            <Text style={styles.routeAddress}>
              {item.drop_location?.address || 'Customer address'}{item.drop_location?.city ? `, ${item.drop_location.city}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Order Value */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.orderAmountLabel}>Order Value</Text>
          <Text style={styles.orderAmount}>{'\u20B9'}{item.total_amount}</Text>
        </View>
        {item.items?.length > 0 && (
          <Text style={styles.itemsCount}>{item.items.length} items</Text>
        )}
      </View>

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
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={G} />
            <Text style={styles.locationText} numberOfLines={1}>
              {address?.city || 'Current Location'}
            </Text>
          </View>
        </View>

        {/* Online/Offline Toggle */}
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
          <TouchableOpacity
            style={styles.goOnlineBtn}
            onPress={() => setIsOnline(true)}
          >
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

      {/* Reject Confirmation Modal */}
      <Modal visible={!!rejectConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="close-circle" size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Decline Delivery?</Text>
            <Text style={styles.modalMsg}>Are you sure you want to decline this delivery?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectConfirm(null)}>
                <Text style={styles.modalCancelText}>Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirm}
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

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flex: 1 },
  headerGreeting: { fontSize: 12, color: '#64748B', fontWeight: '500', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 15, fontWeight: '700', color: '#0F172A', maxWidth: 180 },

  // Toggle
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

  // List
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
  orderNumber: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  orderMeta: { fontSize: 12, color: '#64748B', marginTop: 3 },
  earningBadge: {
    backgroundColor: '#D1FAE5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10,
  },
  earningText: { fontSize: 16, fontWeight: '800', color: '#065F46' },

  routeContainer: { flexDirection: 'row', marginBottom: 16 },
  routeTimeline: { width: 24, alignItems: 'center', paddingTop: 4 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },
  routeDetails: { flex: 1, marginLeft: 12 },
  routePoint: { marginBottom: 14 },
  routeLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 3 },
  routeName: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 2 },
  routeAddress: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  routeDistance: { fontSize: 12, color: G, fontWeight: '600', marginTop: 3 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginBottom: 14,
  },
  orderAmountLabel: { fontSize: 11, color: '#94A3B8' },
  orderAmount: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  itemsCount: { fontSize: 13, color: '#64748B', fontWeight: '500' },

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

  // Empty / Offline
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
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2',
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
    backgroundColor: '#EF4444',
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
