import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/src/contexts/LocationContext';
import { useCart } from '@/src/contexts/CartContext';
import { customerAPI } from '@/src/services/api';
import { MODULES, APP_CONFIG } from '@/src/config';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { location, address } = useLocation();
  const { itemCount } = useCart();
  const [selectedModule, setSelectedModule] = useState('food');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStores = useCallback(async () => {
    if (!location) return;

    try {
      setLoading(true);
      const response = await customerAPI.getStores(
        location.latitude,
        location.longitude,
        selectedModule,
        searchQuery || undefined
      );
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  }, [location, selectedModule, searchQuery]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  const getModuleConfig = (moduleId: string) => {
    return MODULES[moduleId.toUpperCase() as keyof typeof MODULES] || MODULES.FOOD;
  };

  const currentModule = getModuleConfig(selectedModule);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Deliver to</Text>
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location" size={18} color={APP_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.locationText} numberOfLines={1}>
              {address?.city || address?.formattedAddress || 'Current Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={() => router.push('/(customer)/cart')}
        >
          <Ionicons name="cart" size={26} color="#1F2937" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${currentModule.name.toLowerCase()}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadStores}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); loadStores(); }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Module Selector */}
      <View style={styles.moduleContainer}>
        {Object.values(MODULES).map((module) => {
          const isSelected = selectedModule === module.id;
          return (
            <TouchableOpacity
              key={module.id}
              style={[
                styles.moduleButton,
                isSelected && { backgroundColor: module.color, borderColor: module.color },
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

      {/* Stores List */}
      <ScrollView
        style={styles.storesList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_CONFIG.PRIMARY_COLOR]} />
        }
      >
        <Text style={styles.sectionTitle}>
          {currentModule.icon} {currentModule.name} near you
        </Text>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Finding stores...</Text>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No stores found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try different keywords' : 'No stores available in your area'}
            </Text>
          </View>
        ) : (
          stores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => router.push(`/(customer)/store/${store.id}?module=${selectedModule}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.storeImage, { backgroundColor: currentModule.color + '20' }]}>
                <Text style={styles.storeInitial}>{store.name.charAt(0)}</Text>
              </View>
              <View style={styles.storeInfo}>
                <View style={styles.storeHeader}>
                  <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                  {store.rating && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{store.rating}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.storeDesc} numberOfLines={1}>
                  {store.description || store.cuisine_types?.join(', ') || 'Quality assured'}
                </Text>
                <View style={styles.storeMetaRow}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{store.average_prep_time_minutes || 30} min</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{store.distance_km?.toFixed(1) || '?'} km</Text>
                  </View>
                  {store.minimum_order_value > 0 && (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>Min ₹{store.minimum_order_value}</Text>
                    </View>
                  )}
                </View>
                {!store.is_deliverable && (
                  <View style={styles.notDeliverable}>
                    <Text style={styles.notDeliverableText}>Outside delivery range</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937', maxWidth: 200 },
  cartButton: { position: 'relative', padding: 8 },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937' },
  moduleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  moduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  moduleIcon: { fontSize: 18 },
  moduleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  moduleTextActive: { color: '#fff' },
  storesList: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storeImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  storeInitial: { fontSize: 28, fontWeight: 'bold', color: '#6B7280' },
  storeInfo: { flex: 1 },
  storeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  storeName: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 8 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  storeDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  storeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  notDeliverable: {
    marginTop: 6,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  notDeliverableText: { fontSize: 11, color: '#DC2626', fontWeight: '500' },
});
