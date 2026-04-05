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
import { customerAPI } from '@/src/services/api';
import { APP_CONFIG } from '@/src/config';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const response = await customerAPI.getOrders(0, 50);
      setOrders(response.data.orders);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'out_for_delivery': return '#3B82F6';
      case 'preparing': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderOrder = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.order_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.storeName}>{item.store_name}</Text>
      <Text style={styles.orderDate}>{formatDate(item.placed_at || item.created_at)}</Text>
      
      <View style={styles.orderItems}>
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
        <Text style={styles.totalAmount}>₹{item.total_amount}</Text>
        <Text style={styles.paymentMethod}>{item.payment_method === 'cod' ? 'Cash on Delivery' : 'Paid'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={60} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>Your orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
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
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  listContainer: { padding: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  storeName: { fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 4 },
  orderDate: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  orderItems: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  itemText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  moreItems: { fontSize: 14, color: APP_CONFIG.PRIMARY_COLOR, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  paymentMethod: { fontSize: 12, color: '#6B7280' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280' },
});
