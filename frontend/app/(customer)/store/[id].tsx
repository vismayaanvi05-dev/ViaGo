import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useCart } from '@/src/contexts/CartContext';
import { APP_CONFIG, MODULES } from '@/src/config';

export default function StoreDetailsScreen() {
  const { id, module } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, clearCart, store: cartStore, itemCount, loadCart } = useCart();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);

  const loadStoreDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getRestaurant(id as string);
      setStore(response.data);
    } catch (error) {
      console.error('Error loading store:', error);
      Alert.alert('Error', 'Failed to load store details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStoreDetails();
    loadCart();
  }, [id, loadStoreDetails]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoreDetails();
    await loadCart();
    setRefreshing(false);
  };

  const handleAddToCart = async (item: any) => {
    if (cartStore && cartStore.id !== id) {
      Alert.alert(
        'Different Store',
        `Your cart has items from ${cartStore.name}. Do you want to clear it and add from ${store.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: async () => {
              await clearCart();
              await addItemToCart(item);
            },
          },
        ]
      );
    } else {
      await addItemToCart(item);
    }
  };

  const addItemToCart = async (item: any) => {
    setAddingItem(item.id);
    try {
      const result = await addToCart(id as string, item.id, 1);
      
      if (result.success) {
        Alert.alert(
          '✅ Added to Cart',
          `${item.name} added to your cart`,
          [
            { text: 'Continue', style: 'cancel' },
            { text: 'View Cart', onPress: () => router.push('/(customer)/cart') },
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to add item');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setAddingItem(null);
    }
  };

  const moduleConfig = MODULES[(module as string)?.toUpperCase() as keyof typeof MODULES] || MODULES.FOOD;

  if (loading && !store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#EF4444" />
          <Text style={styles.errorText}>Store not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(customer)/cart')}>
          <Ionicons name="cart" size={24} color="#1F2937" />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Store Info Card */}
        <View style={styles.storeCard}>
          <View style={[styles.storeIcon, { backgroundColor: moduleConfig.color + '20' }]}>
            <Text style={styles.storeIconText}>{moduleConfig.icon}</Text>
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDesc}>{store.description}</Text>
          
          <View style={styles.storeStats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.statValue}>{store.rating || '4.5'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time" size={18} color="#6B7280" />
              <Text style={styles.statValue}>{store.average_prep_time_minutes}</Text>
              <Text style={styles.statLabel}>mins</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="cash" size={18} color="#6B7280" />
              <Text style={styles.statValue}>₹{store.minimum_order_value}</Text>
              <Text style={styles.statLabel}>Min order</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>📜 Menu</Text>
          
          {store.categories?.length === 0 && (
            <View style={styles.emptyMenu}>
              <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyMenuText}>No items available</Text>
            </View>
          )}

          {store.categories?.map((category: any) => (
            <View key={category.id} style={styles.categorySection}>
              <Text style={styles.categoryName}>{category.name}</Text>
              
              {category.items?.map((item: any) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemMain}>
                    {item.is_veg !== null && (
                      <View style={[styles.vegBadge, { borderColor: item.is_veg ? '#22C55E' : '#EF4444' }]}>
                        <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#22C55E' : '#EF4444' }]} />
                      </View>
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.description && (
                        <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                      )}
                      <Text style={styles.itemPrice}>₹{item.base_price}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: moduleConfig.color }]}
                    onPress={() => handleAddToCart(item)}
                    disabled={addingItem === item.id}
                  >
                    {addingItem === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.addBtnText}>ADD</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: moduleConfig.color }]}
          onPress={() => router.push('/(customer)/cart')}
        >
          <View style={styles.floatingCartLeft}>
            <Ionicons name="cart" size={22} color="#fff" />
            <Text style={styles.floatingCartCount}>{itemCount} item(s)</Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { fontSize: 18, color: '#1F2937', marginTop: 12, marginBottom: 20 },
  backBtn: { backgroundColor: APP_CONFIG.PRIMARY_COLOR, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: { padding: 8, position: 'relative' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginHorizontal: 8 },
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
  storeCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  storeIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  storeIconText: { fontSize: 36 },
  storeName: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  storeDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  storeStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: 20 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginTop: 4 },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  menuContainer: { paddingHorizontal: 16 },
  menuTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  emptyMenu: { alignItems: 'center', paddingVertical: 40 },
  emptyMenuText: { marginTop: 12, color: '#9CA3AF', fontSize: 14 },
  categorySection: { marginBottom: 24 },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  vegBadge: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  itemDesc: { fontSize: 13, color: '#9CA3AF', marginBottom: 8, lineHeight: 18 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: APP_CONFIG.PRIMARY_COLOR },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  floatingCart: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartCount: { color: '#fff', fontSize: 15, fontWeight: '600' },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  floatingCartText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
