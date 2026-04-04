import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { deliveryAPI } from '../../services/deliveryAPI';
import { APP_CONFIG } from '../../config';

const DeliveryDetailsScreen = ({ route, navigation }) => {
  const { delivery } = route.params;
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(delivery);

  const handleAccept = async () => {
    Alert.alert(
      'Accept Delivery',
      `Earnings: ₹${orderDetails.estimated_earning}\nDistance: ${orderDetails.delivery_distance_km} km`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setLoading(true);
              await deliveryAPI.acceptDelivery(orderDetails.id);
              Alert.alert('Success', 'Delivery accepted!', [
                {
                  text: 'OK',
                  onPress: () => navigation.replace('ActiveDelivery', { orderId: orderDetails.id }),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to accept delivery');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openMaps = (lat, lng, label) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPhone = (phone) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <View style={styles.header}>
        <View style={styles.moduleBadge}>
          <Text style={styles.moduleBadgeText}>{orderDetails.module?.toUpperCase()}</Text>
        </View>
        <Text style={styles.orderNumber}>#{orderDetails.order_number}</Text>
        <Text style={styles.earningText}>₹{orderDetails.estimated_earning}</Text>
      </View>

      {/* Pickup Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationName}>{orderDetails.pickup_location?.name}</Text>
          <Text style={styles.locationAddress}>{orderDetails.pickup_location?.address}</Text>
          <Text style={styles.distanceText}>{orderDetails.pickup_location?.distance_km} km away</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() =>
              openMaps(
                orderDetails.pickup_location?.lat,
                orderDetails.pickup_location?.lng,
                'Pickup'
              )
            }
          >
            <Text style={styles.mapButtonText}>Open in Maps 🗺️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drop Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Drop Location</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationAddress}>{orderDetails.drop_location?.address}</Text>
          <Text style={styles.locationCity}>{orderDetails.drop_location?.city}</Text>
          <Text style={styles.distanceText}>{orderDetails.delivery_distance_km} km from pickup</Text>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() =>
              openMaps(orderDetails.drop_location?.lat, orderDetails.drop_location?.lng, 'Drop')
            }
          >
            <Text style={styles.mapButtonText}>Open in Maps 🗺️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Items */}
      {orderDetails.items && orderDetails.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📦 Order Items</Text>
          <View style={styles.itemsCard}>
            {orderDetails.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.name} x {item.quantity}
                </Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.itemRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{orderDetails.total_amount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Earnings Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Earnings Breakdown</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Base Fee</Text>
            <Text style={styles.earningsValue}>₹30</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Distance ({orderDetails.delivery_distance_km} km)</Text>
            <Text style={styles.earningsValue}>₹{(orderDetails.delivery_distance_km * 10).toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.earningsRow}>
            <Text style={styles.earningsTotal}>Total Earnings</Text>
            <Text style={styles.earningsTotal}>₹{orderDetails.estimated_earning}</Text>
          </View>
        </View>
      </View>

      {/* Accept Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, loading && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept Delivery</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  moduleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  moduleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  earningText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  locationCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  mapButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 14,
    color: '#1F2937',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  earningsCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  earningsTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  acceptButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DeliveryDetailsScreen;
