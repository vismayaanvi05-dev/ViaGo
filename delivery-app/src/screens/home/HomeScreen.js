import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { deliveryAPI } from '../../services/deliveryAPI';
import { APP_CONFIG } from '../../config';

const HomeScreen = ({ navigation }) => {
  const { location } = useLocation();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);

  useEffect(() => {
    loadAvailableDeliveries();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAvailableDeliveries, 30000);
    return () => clearInterval(interval);
  }, [selectedModule]);

  const loadAvailableDeliveries = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const response = await deliveryAPI.getAvailableDeliveries(
        location.latitude,
        location.longitude,
        10, // 10km radius
        selectedModule
      );
      setDeliveries(response.data.deliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAvailableDeliveries();
    setRefreshing(false);
  };

  const handleAccept = async (orderId) => {
    Alert.alert(
      'Accept Delivery',
      'Do you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await deliveryAPI.acceptDelivery(orderId);
              Alert.alert('Success', 'Delivery accepted!');
              await loadAvailableDeliveries();
              navigation.navigate('ActiveDelivery', { orderId });
            } catch (error) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to accept delivery');
            }
          },
        },
      ]
    );
  };

  const renderDelivery = ({ item }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.moduleBadge}>
          <Text style={styles.moduleBadgeText}>{item.module?.toUpperCase()}</Text>
        </View>
        <Text style={styles.earningText}>₹{item.estimated_earning}</Text>
      </View>

      <Text style={styles.orderNumber}>#{item.order_number}</Text>

      <View style={styles.locationSection}>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{item.pickup_location?.name}</Text>
            <Text style={styles.distanceText}>{item.pickup_location?.distance_km} km away</Text>
          </View>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🎯</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Drop</Text>
            <Text style={styles.locationText}>{item.drop_location?.address}</Text>
            <Text style={styles.distanceText}>{item.delivery_distance_km} km delivery</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => navigation.navigate('DeliveryDetails', { delivery: item })}
        >
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Available Deliveries</Text>
        <Text style={styles.headerSubtitle}>
          {deliveries.length} deliveries nearby
        </Text>
      </View>

      <View style={styles.moduleFilter}>
        {['All', 'food', 'grocery', 'laundry'].map((module) => (
          <TouchableOpacity
            key={module}
            style={[
              styles.moduleButton,
              (module === 'All' ? !selectedModule : selectedModule === module) &&
                styles.moduleButtonActive,
            ]}
            onPress={() => setSelectedModule(module === 'All' ? null : module)}
          >
            <Text
              style={[
                styles.moduleButtonText,
                (module === 'All' ? !selectedModule : selectedModule === module) &&
                  styles.moduleButtonTextActive,
              ]}
            >
              {module === 'All' ? 'All' : module.charAt(0).toUpperCase() + module.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No deliveries available</Text>
          <Text style={styles.emptySubtext}>Check back in a few minutes</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
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
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  moduleFilter: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  moduleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  moduleButtonActive: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    borderColor: APP_CONFIG.PRIMARY_COLOR,
  },
  moduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  moduleButtonTextActive: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  listContainer: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moduleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  earningText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  locationSection: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
