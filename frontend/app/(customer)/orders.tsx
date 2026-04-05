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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { customerAPI } from '@/src/services/api';
import { APP_CONFIG } from '@/src/config';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const response = await customerAPI.getOrders(0, 50);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'delivered':
        return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', label: 'Delivered' };
      case 'cancelled':
        return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle', label: 'Cancelled' };
      case 'out_for_delivery':
        return { color: '#3B82F6', bg: '#DBEAFE', icon: 'bicycle', label: 'On the way' };
      case 'preparing':
      case 'confirmed':
        return { color: '#F59E0B', bg: '#FEF3C7', icon: 'restaurant', label: 'Preparing' };
      case 'picked_up':
        return { color: '#8B5CF6', bg: '#EDE9FE', icon: 'bag-check', label: 'Picked up' };
      default:
        return { color: '#6B7280', bg: '#F3F4F6', icon: 'time', label: 'Processing' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isTrackable = (status: string) => {
    return !['delivered', 'cancelled'].includes(status);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.status);
    const trackable = isTrackable(item.status);
    
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/(customer)/order/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
            <Text style={styles.orderDate}>{formatDate(item.placed_at || item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        
        <View style={styles.storeRow}>
          <View style={styles.storeIcon}>
            <Ionicons name="restaurant" size={18} color={APP_CONFIG.PRIMARY_COLOR} />
          </View>
          <Text style={styles.storeName}>{item.store_name || 'Restaurant'}</Text>
        </View>
        
        <View style={styles.itemsList}>
          {item.items?.slice(0, 3).map((orderItem: any, index: number) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.quantity}x {orderItem.item_name}
            </Text>
          ))}
          {item.items?.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} more items</Text>
          )}
        </View>
        
        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{'\u20B9'}{item.total_amount}</Text>
          </View>
          {trackable ? (
            <View style={[styles.trackBadge, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.trackText}>Track Order</Text>
            </View>
          ) : (
            <View style={styles.paymentBadge}>
              <Ionicons name="cash-outline" size={14} color="#6B7280" />
              <Text style={styles.paymentText}>
                {item.payment_method === 'cod' ? 'Cash' : 'Paid'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{orders.length} orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[APP_CONFIG.PRIMARY_COLOR]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', flex: 1 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  orderCount: { fontSize: 14, color: '#6B7280' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { padding: 16 },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderNumber: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  storeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  itemsList: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  itemText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  moreItems: { fontSize: 13, color: APP_CONFIG.PRIMARY_COLOR, fontWeight: '500', marginTop: 4 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  totalLabel: { fontSize: 12, color: '#9CA3AF' },
  totalAmount: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 2 },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  paymentText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  trackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  trackText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280' },
});
