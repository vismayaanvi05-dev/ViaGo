import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { customerAPI } from '../../services/customerAPI';
import { APP_CONFIG } from '../../config';

const OrderTrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrderDetails();
    // Poll for updates every 10 seconds
    const interval = setInterval(loadOrderDetails, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrderDetails = async () => {
    try {
      const response = await customerAPI.getOrderDetails(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order details:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOrderDetails();
  };

  const getStatusSteps = () => {
    const allSteps = [
      { key: 'pending', label: 'Order Placed', icon: '✅' },
      { key: 'confirmed', label: 'Confirmed', icon: '📝' },
      { key: 'preparing', label: 'Preparing', icon: '🍳' },
      { key: 'ready', label: 'Ready', icon: '✅' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '🎉' },
    ];

    const currentIndex = allSteps.findIndex((s) => s.key === order?.status);
    return allSteps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Order Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
        <Text style={styles.storeName}>{order.store?.name}</Text>
        <Text style={styles.orderDate}>
          Placed on {new Date(order.placed_at).toLocaleString('en-IN')}
        </Text>
      </View>

      {/* Status Timeline */}
      <View style={styles.timeline}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        {getStatusSteps().map((step, index) => (
          <View key={step.key} style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <View
                style={[
                  styles.timelineDot,
                  step.completed && styles.timelineDotCompleted,
                  step.active && styles.timelineDotActive,
                ]}
              >
                {step.completed && <Text style={styles.timelineDotText}>{step.icon}</Text>}
              </View>
              {index < getStatusSteps().length - 1 && (
                <View
                  style={[
                    styles.timelineLine,
                    step.completed && styles.timelineLineCompleted,
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineLabel,
                  step.active && styles.timelineLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Order Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        {order.items?.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.item_name}</Text>
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.unit_price * item.quantity}</Text>
          </View>
        ))}
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.delivery_address?.address_line}</Text>
        <Text style={styles.addressText}>
          {order.delivery_address?.city}, {order.delivery_address?.state} -{' '}
          {order.delivery_address?.pincode}
        </Text>
      </View>

      {/* Bill Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Summary</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>₹{order.subtotal}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={styles.billValue}>₹{order.delivery_fee || 0}</Text>
        </View>
        <View style={[styles.billRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.total_amount}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timeline: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineIcon: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotCompleted: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  timelineDotActive: {
    borderWidth: 2,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
  },
  timelineDotText: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  timelineLabelActive: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 16,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.PRIMARY_COLOR,
  },
});

export default OrderTrackingScreen;
