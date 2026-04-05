import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const [selectedModule, setSelectedModule] = useState('food');
  const [stores, setStores] = useState<any[]>([]);
  const [groceryData, setGroceryData] = useState<{ categories: any[], products: any[] }>({ categories: [], products: [] });
  const [laundryData, setLaundryData] = useState<{ services: any[], items: any[] }>({ services: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!location) return;
    try {
      setLoading(true);
      const city = address?.city || undefined;
      
      if (selectedModule === 'food') {
        const response = await customerAPI.getStores(
          location.latitude, location.longitude,
          selectedModule, searchQuery || undefined, city
        );
        setStores(response.data.stores || []);
      } else if (selectedModule === 'grocery') {
        const response = await customerAPI.getGrocery(
          city, searchQuery || undefined,
          location.latitude, location.longitude
        );
        setGroceryData(response.data);
      } else if (selectedModule === 'laundry') {
        const response = await customerAPI.getLaundry(
          city, searchQuery || undefined,
          location.latitude, location.longitude
        );
        setLaundryData(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [location, address, selectedModule, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getModuleConfig = (moduleId: string) =>
    MODULES[moduleId.toUpperCase() as keyof typeof MODULES] || MODULES.FOOD;

  const currentModule = getModuleConfig(selectedModule);

  // ─── Render Food Stores ───
  const renderFoodStores = () => (
    <>
      <Text style={styles.sectionTitle}>
        <Ionicons name="restaurant" size={18} color={currentModule.color} /> Restaurants near you
      </Text>
      {stores.length === 0 ? (
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
        stores.map((store) => (
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
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.metaText}>{store.average_prep_time_minutes || 30} min</Text>
                </View>
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
        ))
      )}
    </>
  );

  // ─── Render Grocery Products ───
  const renderGrocery = () => {
    const { categories, products } = groceryData;
    const hasData = categories.length > 0 || products.length > 0;

    return (
      <>
        <Text style={styles.sectionTitle}>
          <Ionicons name="cart" size={18} color="#10B981" /> Fresh Groceries
        </Text>
        {!hasData ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="cart-outline" size={40} color="#10B981" />
            </View>
            <Text style={styles.emptyTitle}>No grocery items</Text>
            <Text style={styles.emptySubtitle}>No grocery products available in your area</Text>
          </View>
        ) : (
          categories.map((cat) => (
            <View key={cat.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{cat.name}</Text>
              {(cat.products || []).length === 0 ? (
                <Text style={styles.noCatItems}>No products in this category</Text>
              ) : (
                (cat.products || []).map((product: any) => (
                  <View key={product.id} style={styles.productCard}>
                    <View style={[styles.productIcon, { backgroundColor: '#10B98115' }]}>
                      <Ionicons name="leaf" size={20} color="#10B981" />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <View style={styles.productMeta}>
                        {product.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
                        <Text style={styles.productUnit}>
                          {product.unit_value} {product.unit_type}
                        </Text>
                      </View>
                      {product.current_stock != null && product.current_stock <= 0 && (
                        <Text style={styles.outOfStock}>Out of stock</Text>
                      )}
                    </View>
                    <View style={styles.priceSection}>
                      {product.discount_percentage > 0 && (
                        <Text style={styles.mrpStrike}>{'\u20B9'}{product.mrp}</Text>
                      )}
                      <Text style={styles.sellingPrice}>{'\u20B9'}{product.selling_price || product.mrp}</Text>
                      {product.discount_percentage > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>{product.discount_percentage}% off</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          ))
        )}
      </>
    );
  };

  // ─── Render Laundry Services ───
  const renderLaundry = () => {
    const { services, items } = laundryData;
    const hasData = services.length > 0 || items.length > 0;

    return (
      <>
        <Text style={styles.sectionTitle}>
          <Ionicons name="shirt" size={18} color="#3B82F6" /> Laundry Services
        </Text>
        {!hasData ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconWrap, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="shirt-outline" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.emptyTitle}>No laundry services</Text>
            <Text style={styles.emptySubtitle}>No laundry services available in your area</Text>
          </View>
        ) : (
          <>
            {/* Services with items */}
            {services.map((svc) => (
              <View key={svc.id} style={styles.categorySection}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.categoryTitle}>{svc.name}</Text>
                  {svc.turnaround_time_hours && (
                    <View style={styles.turnaroundBadge}>
                      <Ionicons name="time-outline" size={12} color="#3B82F6" />
                      <Text style={styles.turnaroundText}>{svc.turnaround_time_hours}h</Text>
                    </View>
                  )}
                </View>
                {svc.description ? <Text style={styles.serviceDesc}>{svc.description}</Text> : null}
                {(svc.items || []).map((item: any) => (
                  <View key={item.id} style={styles.productCard}>
                    <View style={[styles.productIcon, { backgroundColor: '#3B82F615' }]}>
                      <Ionicons name="shirt" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productUnit}>
                        {item.pricing_type === 'per_kg' ? 'Per Kg' : 'Per Item'}
                      </Text>
                    </View>
                    <View style={styles.priceSection}>
                      <Text style={styles.sellingPrice}>{'\u20B9'}{item.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
            {/* Items without services (fallback) */}
            {services.length === 0 && items.length > 0 && (
              <View style={styles.categorySection}>
                <Text style={styles.categoryTitle}>Available Items</Text>
                {items.map((item: any) => (
                  <View key={item.id} style={styles.productCard}>
                    <View style={[styles.productIcon, { backgroundColor: '#3B82F615' }]}>
                      <Ionicons name="shirt" size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productUnit}>
                        {item.pricing_type === 'per_kg' ? 'Per Kg' : 'Per Item'}
                      </Text>
                    </View>
                    <View style={styles.priceSection}>
                      <Text style={styles.sellingPrice}>{'\u20B9'}{item.price}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </>
    );
  };

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
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => router.push('/(customer)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color="#1F2937" />
          {itemCount > 0 && (
            <View style={[styles.cartBadge, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${currentModule.name.toLowerCase()}...`}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadData}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); }}>
              <Ionicons name="close-circle" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Module Selector */}
      <View style={styles.modules}>
        {Object.values(MODULES).map((mod) => {
          const selected = selectedModule === mod.id;
          return (
            <TouchableOpacity
              key={mod.id}
              style={[styles.moduleBtn, selected && { backgroundColor: mod.color, borderColor: mod.color }]}
              onPress={() => setSelectedModule(mod.id)}
              activeOpacity={0.7}
            >
              <Ionicons name={mod.icon as any} size={18} color={selected ? '#fff' : mod.color} />
              <Text style={[styles.moduleLabel, selected && { color: '#fff' }]}>{mod.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentArea}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[APP_CONFIG.PRIMARY_COLOR]} />}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={currentModule.color} />
            <Text style={styles.loadingText}>
              {selectedModule === 'food' ? 'Finding restaurants...' :
               selectedModule === 'grocery' ? 'Loading groceries...' : 'Loading services...'}
            </Text>
          </View>
        ) : (
          <>
            {selectedModule === 'food' && renderFoodStores()}
            {selectedModule === 'grocery' && renderGrocery()}
            {selectedModule === 'laundry' && renderLaundry()}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
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
    position: 'absolute', top: 4, right: 4,
    borderRadius: 8, minWidth: 16, height: 16,
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
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

  // Food store card
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
  ratingTag: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 5, gap: 2,
  },
  ratingText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  storeDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  storeMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  metaSep: { fontSize: 8, color: '#D1D5DB' },

  // Category section (grocery/laundry)
  categorySection: {
    marginBottom: 20, backgroundColor: '#FAFAFA', borderRadius: 16, padding: 16,
  },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  noCatItems: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  serviceDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  turnaroundBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  turnaroundText: { fontSize: 12, fontWeight: '600', color: '#3B82F6' },

  // Product card (grocery/laundry items)
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#F3F4F6',
  },
  productIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productBrand: { fontSize: 12, color: '#6B7280' },
  productUnit: { fontSize: 12, color: '#9CA3AF' },
  outOfStock: { fontSize: 11, color: '#DC2626', fontWeight: '600', marginTop: 2 },

  // Price section
  priceSection: { alignItems: 'flex-end', marginLeft: 8 },
  mrpStrike: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  sellingPrice: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  discountBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2,
  },
  discountText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },
});
