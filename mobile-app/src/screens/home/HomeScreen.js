import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocation } from '../../context/LocationContext';
import { customerAPI } from '../../services/customerAPI';
import { MODULES, APP_CONFIG } from '../../config';

const HomeScreen = ({ navigation }) => {
  const { location, address } = useLocation();
  const [selectedModule, setSelectedModule] = useState('food');
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableModules, setAvailableModules] = useState(['food', 'grocery', 'laundry']);

  useEffect(() => {
    loadData();
  }, [location, selectedModule]);

  const loadData = async () => {
    if (!location) return;

    try {
      setLoading(true);
      
      // Get app config
      const configResponse = await customerAPI.getConfig(location.latitude, location.longitude);
      setAvailableModules(configResponse.data.available_modules);

      // Get stores for selected module
      const storesResponse = await customerAPI.getStores(
        location.latitude,
        location.longitude,
        selectedModule
      );
      setStores(storesResponse.data.stores);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderModuleSelector = () => (
    <View style={styles.moduleSelectorContainer}>
      {Object.values(MODULES).map((module) => {
        if (!availableModules.includes(module.id)) return null;
        
        const isSelected = selectedModule === module.id;
        return (
          <TouchableOpacity
            key={module.id}
            style={[
              styles.moduleButton,
              isSelected && { backgroundColor: module.color },
            ]}
            onPress={() => setSelectedModule(module.id)}
          >
            <Text style={styles.moduleIcon}>{module.icon}</Text>
            <Text style={[styles.moduleText, isSelected && styles.moduleTextActive]}>
              {module.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStoreCard = (store) => (
    <TouchableOpacity
      key={store.id}
      style={styles.storeCard}
      onPress={() => navigation.navigate('StoreDetails', { storeId: store.id, module: selectedModule })}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeLogo}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description || 'No description'}</Text>
          <View style={styles.storeMetrics}>
            <Text style={styles.metric}>⭐ {store.rating || 'New'}</Text>
            <Text style={styles.metric}>• {store.distance_km || '?'} km</Text>
            <Text style={styles.metric}>• {store.average_prep_time_minutes || 30} mins</Text>
          </View>
        </View>
      </View>
      {!store.is_deliverable && (
        <View style={styles.notDeliverableTag}>
          <Text style={styles.notDeliverableText}>Not deliverable to your location</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Deliver to</Text>
          <Text style={styles.headerTitle}>
            {address?.city || address?.formattedAddress || 'Current Location'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('Search', { module: selectedModule })}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search for stores or items...</Text>
      </TouchableOpacity>

      {/* Module Selector */}
      {renderModuleSelector()}

      {/* Store Listing */}
      <ScrollView
        style={styles.storeList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>
          {MODULES[selectedModule.toUpperCase()]?.name || 'Stores'} near you
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} style={styles.loader} />
        ) : stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>😔</Text>
            <Text style={styles.emptyStateText}>No stores available</Text>
            <Text style={styles.emptyStateSubtext}>
              Try changing your location or check other modules
            </Text>
          </View>
        ) : (
          stores.map(renderStoreCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  moduleSelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  moduleButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  moduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  moduleTextActive: {
    color: '#fff',
  },
  storeList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  storeHeader: {
    flexDirection: 'row',
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
  notDeliverableTag: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  notDeliverableText: {
    fontSize: 12,
    color: '#DC2626',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default HomeScreen;
