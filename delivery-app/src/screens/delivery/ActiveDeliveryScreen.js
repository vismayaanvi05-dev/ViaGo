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

const ActiveDeliveryScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    loadDelivery();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadDelivery, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadDelivery = async () => {
    try {
      const response = await deliveryAPI.getAssignedDeliveries();
      const activeDelivery = response.data.deliveries.find((d) => d.id === orderId);
      if (activeDelivery) {
        setDelivery(activeDelivery);
      } else {
        // Delivery completed or not found
        Alert.alert('Delivery Complete', 'This delivery has been completed.', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (error) {
      console.error('Error loading delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus, statusLabel) => {
    Alert.alert(
      `Update Status`,
      `Mark order as "${statusLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setUpdating(true);
              await deliveryAPI.updateDeliveryStatus(orderId, newStatus);
              Alert.alert('Success', `Status updated to ${statusLabel}`);
              await loadDelivery();
              
              // If delivered, navigate back to home
              if (newStatus === 'delivered') {
                setTimeout(() => {
                  navigation.navigate('Home');
                }, 1500);
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to update status');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const openMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  const callPhone = (phone) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('No Phone', 'Customer phone number not available');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Delivery not found</Text>
      </View>
    );
  }

  // Determine next action based on current status
  const getNextAction = () => {
    switch (delivery.status) {
      case 'out_for_pickup':
        return { status: 'picked_up', label: 'Mark as Picked Up', icon: '✅' };
      case 'picked_up':
        return { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚' };
      case 'out_for_delivery':
        return { status: 'delivered', label: 'Mark as Delivered', icon: '🎉' };
      default:
        return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <ScrollView style={styles.container}>
      {/* Status Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Delivery</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{delivery.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
        <Text style={styles.orderNumber}>#{delivery.order_number}</Text>
      </View>

      {/* Progress Tracker */}
      <View style={styles.progressSection}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressStep, delivery.status === 'out_for_pickup' && styles.progressStepActive]}>
            <Text style={styles.progressIcon}>📍</Text>
            <Text style={styles.progressLabel}>Going to Pickup</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, delivery.status === 'picked_up' && styles.progressStepActive]}>
            <Text style={styles.progressIcon}>📦</Text>
            <Text style={styles.progressLabel}>Picked Up</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, delivery.status === 'out_for_delivery' && styles.progressStepActive]}>
            <Text style={styles.progressIcon}>🚚</Text>
            <Text style={styles.progressLabel}>Out for Delivery</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={[styles.progressStep, delivery.status === 'delivered' && styles.progressStepActive]}>
            <Text style={styles.progressIcon}>✅</Text>
            <Text style={styles.progressLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      {/* Pickup Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Pickup from</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationName}>{delivery.store?.name}</Text>
          <Text style={styles.locationAddress}>{delivery.store?.address}</Text>
          {delivery.store?.phone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => callPhone(delivery.store.phone)}
            >
              <Text style={styles.contactButtonText}>📞 Call Store</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openMaps(delivery.store?.lat, delivery.store?.lng)}
          >
            <Text style={styles.mapButtonText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Drop Location */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 Deliver to</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationAddress}>{delivery.delivery_address?.address_line}</Text>
          <Text style={styles.locationCity}>
            {delivery.delivery_address?.city}, {delivery.delivery_address?.postal_code}
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => callPhone(delivery.customer_phone)}
          >
            <Text style={styles.contactButtonText}>📞 Call Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() =>
              openMaps(delivery.delivery_address?.lat, delivery.delivery_address?.lng)
            }
          >
            <Text style={styles.mapButtonText}>🗺️ Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Order Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Module</Text>
            <Text style={styles.summaryValue}>{delivery.module?.toUpperCase()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Order Amount</Text>
            <Text style={styles.summaryValue}>₹{delivery.total_amount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment</Text>
            <Text style={styles.summaryValue}>{delivery.payment_method || 'Cash'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryEarning}>Your Earning</Text>
            <Text style={styles.summaryEarning}>₹{delivery.delivery_fee || 50}</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      {nextAction && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, updating && styles.actionButtonDisabled]}
            onPress={() => updateStatus(nextAction.status, nextAction.label)}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {nextAction.icon} {nextAction.label}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 16,
  },
  progressTrack: {
    alignItems: 'center',
  },
  progressStep: {
    alignItems: 'center',
    opacity: 0.4,
  },
  progressStepActive: {
    opacity: 1,
  },
  progressIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
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
    marginBottom: 4,
  },
  locationCity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryEarning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  actionButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ActiveDeliveryScreen;
