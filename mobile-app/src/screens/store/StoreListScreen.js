import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { customerAPI } from '../../services/customerAPI';
import { APP_CONFIG } from '../../config';

const StoreListScreen = ({ route, navigation }) => {
  const { module } = route.params;
  const { location } = useLocation();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStores();
  }, [module]);

  const loadStores = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const response = await customerAPI.getStores(
        location.latitude,
        location.longitude,
        module
      );
      setStores(response.data.stores);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  const renderStore = ({ item }) => (
    <TouchableOpacity
      style={styles.storeCard}
      onPress={() => navigation.navigate('StoreDetails', { storeId: item.id, module })}
    >
      <View style={styles.storeLogo}>
        <Text style={styles.storeLogoText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>{item.name}</Text>
        <Text style={styles.storeDescription}>{item.description || 'No description'}</Text>
        <View style={styles.storeMetrics}>
          <Text style={styles.metric}>⭐ {item.rating || 'New'}</Text>
          <Text style={styles.metric}>• {item.distance_km} km</Text>
          <Text style={styles.metric}>• {item.average_prep_time_minutes} mins</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  return (
    <FlatList
      data={stores}
      renderItem={renderStore}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent=(
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>😔</Text>
          <Text style={styles.emptyText}>No stores found</Text>
        </View>
      )
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  storeLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  storeMetrics: {
    flexDirection: 'row',
  },
  metric: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default StoreListScreen;
