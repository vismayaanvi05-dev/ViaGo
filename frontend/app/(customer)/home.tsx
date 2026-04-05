import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/src/contexts/LocationContext';
import { useCart } from '@/src/contexts/CartContext';
import { customerAPI } from '@/src/services/api';
import { MODULES, APP_CONFIG } from '@/src/config';
import GroceryView from '@/src/components/GroceryView';
import LaundryView from '@/src/components/LaundryView';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { location, address } = useLocation();
  const { itemCount, subtotal } = useCart();
  const insets = useSafeAreaInsets();
  const [selectedModule, setSelectedModule] = useState('food');
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFoodStores = useCallback(async () => {
    if (!location) return;
    try {
      setLoading(true);
      const city = address?.city || undefined;
      const response = await customerAPI.getStores(
        location.latitude, location.longitude,
        'food', searchQuery || undefined, city
      );
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  }, [location, address, searchQuery]);

  useEffect(() => {
    if (selectedModule === 'food') loadFoodStores();
  }, [loadFoodStores, selectedModule]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedModule === 'food') await loadFoodStores();
    setRefreshing(false);
  };

  const getModuleConfig = (moduleId: string) =>
    MODULES[moduleId.toUpperCase() as keyof typeof MODULES] || MODULES.FOOD;
  const currentModule = getModuleConfig(selectedModule);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.deliverLabel}>Deliver to</Text>
          <TouchableOpacity style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={APP_CONFIG.PRIMARY_COLOR} />
            <Text style={styles.locationText} numberOfLines={1}>
              {address?.city || 'Current Location'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(customer)/cart')}>
          <Ionicons name="cart-outline" size={24} color="#1F2937" />
          {itemCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search (only for food) */}
      {selectedModule === 'food' && (
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search restaurants..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={loadFoodStores}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); }}>
                <Ionicons name="close-circle" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Module Selector */}
      <View style={styles.modules}>
        {Object.values(MODULES).map(mod => {
          const selected = selectedModule === mod.id;
          return (
            <TouchableOpacity
              key={mod.id}
              style={[styles.moduleBtn, selected && { backgroundColor: mod.color, borderColor: mod.color }]}
              onPress={() => { setSelectedModule(mod.id); setSearchQuery(''); }}
              activeOpacity={0.7}
            >
              <Ionicons name={mod.icon as any} size={18} color={selected ? '#fff' : mod.color} />
              <Text style={[styles.moduleLabel, selected && { color: '#fff' }]}>{mod.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {selectedModule === 'food' ? (
        <ScrollView
          style={styles.contentArea}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_CONFIG.PRIMARY_COLOR]} />}
        >
          {loading && !refreshing ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={currentModule.color} />
              <Text style={styles.loadingText}>Finding restaurants...</Text>
            </View>
          ) : stores.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: currentModule.color + '15' }]}>
                <Ionicons name="storefront-outline" size={40} color={currentModule.color} />
              </View>
              <Text style={styles.emptyTitle}>No restaurants found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try different keywords' : 'No restaurants available in your area'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Restaurants near you</Text>
              {stores.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => router.push(`/(customer)/store/${store.id}?module=food`)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.storeAvatar, { backgroundColor: '#EF444418' }]}>
                    <Ionicons name="restaurant" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.storeInfo}>
                    <View style={styles.storeNameRow}>
                      <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                      {(store.avg_rating > 0 || store.rating > 0) ? (
                        <View style={styles.ratingTag}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={styles.ratingText}>{store.avg_rating || store.rating}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.storeDesc} numberOfLines={1}>
                      {store.description || store.cuisine_types?.join(', ') || 'Quality assured'}
                    </Text>
                    <View style={styles.storeMeta}>
                      <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                      <Text style={styles.metaText}>{store.average_prep_time_minutes || 30} min</Text>
                      {store.distance_km != null && (
                        <>
                          <Text style={styles.metaSep}>{'\u2022'}</Text>
                          <Text style={styles.metaText}>{store.distance_km.toFixed(1)} km</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      ) : selectedModule === 'grocery' ? (
        <View style={styles.contentArea}>
          <GroceryView searchQuery={searchQuery} />
        </View>
      ) : (
        <View style={styles.contentArea}>
          <LaundryView searchQuery={searchQuery} />
        </View>
      )}

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
          onPress={() => router.push('/(customer)/cart')}
          activeOpacity={0.85}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>
              {itemCount} item{itemCount > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartTotal}>{'\u20B9'}{subtotal.toFixed(0)}</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  headerLeft: { flex: 1 },
  deliverLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 15, fontWeight: '600', color: '#1F2937', maxWidth: 200 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartBadge: {
    position: 'absolute', top: 4, right: 4, borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchWrap: { paddingHorizontal: 20, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
  modules: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  moduleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#FAFAFA', borderWidth: 1.5, borderColor: '#E5E7EB', gap: 6,
  },
  moduleLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  contentArea: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 12, marginBottom: 14 },
  loadingWrap: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },
  storeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6',
  },
  storeAvatar: {
    width: 56, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  storeInfo: { flex: 1 },
  storeNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  storeName: { fontSize: 15, fontWeight: '600', color: '#1F2937', flex: 1, marginRight: 8 },
  ratingTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, gap: 2 },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  storeDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  storeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  metaSep: { fontSize: 8, color: '#D1D5DB' },

  // Floating Cart
  floatingCart: {
    position: 'absolute', bottom: 16, left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, width: 24, height: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingCartBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  floatingCartLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatingCartTotal: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
