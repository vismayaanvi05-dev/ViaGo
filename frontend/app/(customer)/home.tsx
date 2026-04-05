import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/src/contexts/LocationContext';
import { customerAPI } from '@/src/services/api';
import { MODULES, APP_CONFIG } from '@/src/config';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { location, address } = useLocation();
  const [selectedModule, setSelectedModule] = useState('food');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStores();
  }, [location, selectedModule]);

  const loadStores = async () => {
    if (!location) return;

    try {
      setLoading(true);
      const response = await customerAPI.getStores(
        location.latitude,
        location.longitude,
        selectedModule
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

  const renderModuleSelector = () => (
    <View style={styles.moduleSelectorContainer}>
      {Object.values(MODULES).map((module) => {
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

  const renderStoreCard = (store: any) => (
    <TouchableOpacity
      key={store.id}
      style={styles.storeCard}
      onPress={() => router.push(`/(customer)/store/${store.id}?module=${selectedModule}`)}
    >
      <View style={styles.storeHeader}>
        <View style={[styles.storeLogo, { backgroundColor: MODULES[selectedModule.toUpperCase() as keyof typeof MODULES]?.color || APP_CONFIG.PRIMARY_COLOR }]}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription} numberOfLines={1}>
            {store.description || 'Fresh & delicious'}
          </Text>
          <View style={styles.storeMetrics}>
            <Text style={styles.metric}>
              <Ionicons name="star" size={12} color="#F59E0B" /> {store.rating || 'New'}
            </Text>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Deliver to</Text>
          <Text style={styles.headerTitle}>
            <Ionicons name="location" size={16} color={APP_CONFIG.PRIMARY_COLOR} />
            {' '}{address?.city || 'Current Location'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(customer)/profile')}>
          <Ionicons name="person-circle" size={32} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {renderModuleSelector()}

      <ScrollView
        style={styles.storeList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>
          {MODULES[selectedModule.toUpperCase() as keyof typeof MODULES]?.name || 'Stores'} near you
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} style={styles.loader} />
        ) : stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="sad-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No stores available</Text>
            <Text style={styles.emptyStateSubtext}>
              Try changing your location or check other modules
            </Text>
          </View>
        ) : (
          stores.map(renderStoreCard)
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

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
    padding: 4,
  },
  moduleSelectorContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  moduleButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
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
    padding: 16,
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
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
