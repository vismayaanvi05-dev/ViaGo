import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { APP_CONFIG } from '@/src/config';

const P = APP_CONFIG.PRIMARY_COLOR;

const STATUS_TIMELINE = [
  { key: 'placed', label: 'Order Placed', icon: 'receipt-outline' as const, desc: 'Your order has been placed' },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline' as const, desc: 'Restaurant confirmed your order' },
  { key: 'preparing', label: 'Preparing', icon: 'restaurant-outline' as const, desc: 'Your food is being prepared' },
  { key: 'ready', label: 'Ready', icon: 'bag-check-outline' as const, desc: 'Order is ready for pickup' },
  { key: 'out_for_pickup', label: 'Driver Assigned', icon: 'person-outline' as const, desc: 'A delivery partner is on the way to the store' },
  { key: 'on_the_way', label: 'On the Way to Store', icon: 'navigate-outline' as const, desc: 'Driver is heading to pick up your order' },
  { key: 'picked_up', label: 'Order Picked Up', icon: 'bag-check-outline' as const, desc: 'Driver picked up your order' },
  { key: 'in_transit', label: 'In Transit', icon: 'bicycle-outline' as const, desc: 'Your order is on the way to you!' },
  { key: 'reached_location', label: 'Driver Arrived', icon: 'location-outline' as const, desc: 'Driver has reached your location' },
  { key: 'delivered', label: 'Delivered', icon: 'checkmark-done-circle-outline' as const, desc: 'Order delivered successfully' },
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      const response = await customerAPI.getOrder(id as string);
      setOrder(response.data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [loadOrder]);

  const getCurrentStep = () => {
    if (!order) return -1;
    const idx = STATUS_TIMELINE.findIndex(s => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmitRating = async () => {
    setSubmittingRating(true);
    try {
      await customerAPI.submitRating({
        order_id: order.id,
        overall_rating: ratingValue,
        food_rating: ratingValue,
        delivery_rating: ratingValue,
        review: reviewText,
      });
      setShowRating(false);
      setRatingDone(true);
    } catch (e: any) {
      console.error('Rating error:', e);
    } finally { setSubmittingRating(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={P} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backBtnLarge} onPress={() => router.back()}>
            <Text style={styles.backBtnLargeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = getCurrentStep();
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.order_number}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrder(); }} colors={[P]} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconBig, { backgroundColor: isDelivered ? '#D1FAE5' : isCancelled ? '#FEE2E2' : P + '20' }]}>
            <Ionicons
              name={isDelivered ? 'checkmark-done-circle' : isCancelled ? 'close-circle' : 'time'}
              size={36}
              color={isDelivered ? '#10B981' : isCancelled ? '#EF4444' : P}
            />
          </View>
          <Text style={styles.statusTitle}>
            {isDelivered ? 'Order Delivered!' : isCancelled ? 'Order Cancelled' : STATUS_TIMELINE[currentStep]?.label || 'Processing'}
          </Text>
          <Text style={styles.statusDesc}>
            {isDelivered ? 'Your order has been delivered. Enjoy!' : isCancelled ? 'This order was cancelled.' : STATUS_TIMELINE[currentStep]?.desc || ''}
          </Text>
          {!isDelivered && !isCancelled && (
            <View style={styles.etaRow}>
              <Ionicons name="time-outline" size={16} color={P} />
              <Text style={styles.etaText}>Estimated: 30-45 min</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Order Timeline</Text>
            {STATUS_TIMELINE.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <View key={step.key} style={styles.timelineRow}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isDone ? { backgroundColor: '#10B981' } : {},
                      isCurrent ? { backgroundColor: P, borderWidth: 3, borderColor: P + '40' } : {},
                    ]}>
                      {isDone && !isCurrent && <Ionicons name="checkmark" size={12} color="#fff" />}
                      {isCurrent && <View style={styles.currentDotInner} />}
                    </View>
                    {i < STATUS_TIMELINE.length - 1 && (
                      <View style={[styles.timelineLine, isDone ? { backgroundColor: '#10B981' } : {}]} />
                    )}
                  </View>
                  <View style={[styles.timelineContent, isCurrent && styles.timelineContentActive]}>
                    <Text style={[styles.timelineLabel, isDone && { color: '#1A1A2E', fontWeight: '600' }]}>{step.label}</Text>
                    <Text style={styles.timelineDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={[styles.itemRow, i < order.items.length - 1 && styles.itemBorder]}>
              <View style={styles.itemQtyBadge}>
                <Text style={styles.itemQtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName}>{item.item_name || item.name}</Text>
              <Text style={styles.itemPrice}>{'\u20B9'}{(item.unit_price || item.price || 0) * item.quantity}</Text>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Items Total</Text>
            <Text style={styles.payValue}>{'\u20B9'}{order.item_total || order.subtotal || 0}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Delivery Fee</Text>
            <Text style={styles.payValue}>{'\u20B9'}{order.delivery_fee || 30}</Text>
          </View>
          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Taxes</Text>
            <Text style={styles.payValue}>{'\u20B9'}{order.tax || 0}</Text>
          </View>
          <View style={styles.payDivider} />
          <View style={styles.payRow}>
            <Text style={styles.payTotal}>Total Paid</Text>
            <Text style={[styles.payTotal, { color: P }]}>{'\u20B9'}{order.total_amount}</Text>
          </View>
          <View style={styles.payMethodRow}>
            <Ionicons name={order.payment_method === 'cod' ? 'cash-outline' : 'card-outline'} size={16} color="#8E8EA0" />
            <Text style={styles.payMethodText}>{order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.delivery_address && (
          <View style={styles.addressCard}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addrRow}>
              <Ionicons name="location" size={18} color={P} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLine}>{order.delivery_address.address_line}</Text>
                <Text style={styles.addrCity}>
                  {order.delivery_address.city}{order.delivery_address.pincode ? `, ${order.delivery_address.pincode}` : ''}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{order.order_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placed on</Text>
            <Text style={styles.infoValue}>{formatDate(order.created_at)}</Text>
          </View>
          {order.delivered_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Delivered on</Text>
              <Text style={styles.infoValue}>{formatDate(order.delivered_at)}</Text>
            </View>
          )}
        </View>

        {/* Rate Your Order */}
        {order.status === 'delivered' && !order.is_rated && !ratingDone && (
          <View style={styles.ratingCard}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <Text style={styles.ratingSubtext}>How was your order from {order.store?.name || 'the store'}?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRatingValue(star)} style={styles.starBtn}>
                  <Ionicons
                    name={star <= ratingValue ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= ratingValue ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />
            <TouchableOpacity
              style={[styles.submitRatingBtn, { backgroundColor: P }]}
              onPress={handleSubmitRating}
              disabled={submittingRating}
            >
              {submittingRating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitRatingText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {ratingDone && (
          <View style={styles.ratingDoneCard}>
            <Ionicons name="checkmark-circle" size={24} color="#059669" />
            <Text style={styles.ratingDoneText}>Thank you for your feedback!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 16, color: '#1A1A2E', marginTop: 12, marginBottom: 20 },
  backBtnLarge: { backgroundColor: P, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  backBtnLargeText: { color: '#fff', fontWeight: '600' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F2',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },

  statusCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statusIconBig: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statusTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 6 },
  statusDesc: { fontSize: 14, color: '#8E8EA0', textAlign: 'center', marginBottom: 12 },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: P + '10', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  etaText: { fontSize: 13, fontWeight: '600', color: P },

  timelineCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  timelineRow: { flexDirection: 'row', minHeight: 56 },
  timelineLeft: { width: 32, alignItems: 'center' },
  timelineDot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#E5E5EA',
    alignItems: 'center', justifyContent: 'center',
  },
  currentDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E5EA', marginVertical: 4 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineContentActive: { backgroundColor: P + '08', borderRadius: 10, padding: 10, marginLeft: 8 },
  timelineLabel: { fontSize: 14, color: '#8E8EA0', marginBottom: 2 },
  timelineDesc: { fontSize: 12, color: '#B0B0C0' },

  itemsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginBottom: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemQtyBadge: { backgroundColor: P + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 12 },
  itemQtyText: { fontSize: 13, fontWeight: '700', color: P },
  itemName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },

  paymentCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  payLabel: { fontSize: 14, color: '#8E8EA0' },
  payValue: { fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  payDivider: { height: 1, backgroundColor: '#F0F0F2', marginVertical: 10 },
  payTotal: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  payMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#F9F9FB', padding: 10, borderRadius: 10 },
  payMethodText: { fontSize: 13, color: '#8E8EA0' },

  addressCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  addrRow: { flexDirection: 'row', gap: 10 },
  addrLine: { fontSize: 14, fontWeight: '500', color: '#1A1A2E', marginBottom: 2 },
  addrCity: { fontSize: 13, color: '#8E8EA0' },

  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: '#8E8EA0' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#1A1A2E' },
  // Rating
  ratingCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16 },
  ratingSubtext: { fontSize: 14, color: '#8E8EA0', marginBottom: 14 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  starBtn: { padding: 4 },
  reviewInput: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 14, color: '#0F172A', minHeight: 80, textAlignVertical: 'top', marginBottom: 14 },
  submitRatingBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitRatingText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ratingDoneCard: { backgroundColor: '#F0FDF4', borderRadius: 16, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ratingDoneText: { fontSize: 15, fontWeight: '600', color: '#059669' },
});
