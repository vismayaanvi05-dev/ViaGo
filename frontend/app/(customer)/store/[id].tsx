import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useCart } from '@/src/contexts/CartContext';
import { APP_CONFIG, MODULES } from '@/src/config';

export default function StoreDetailsScreen() {
  const { id, module } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, clearCart, store: cartStore, itemCount, loadCart, getItemQuantity, updateQuantity, removeItem } = useCart();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showConflict, setShowConflict] = useState<{ itemToAdd: any } | null>(null);

  const loadStoreDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getRestaurant(id as string);
      setStore(response.data);
    } catch (error) {
      console.error('Error loading store:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStoreDetails();
    loadCart();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStoreDetails();
    await loadCart();
    setRefreshing(false);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async (item: any) => {
    // Check store conflict
    if (cartStore && cartStore.id !== id) {
      setShowConflict({ itemToAdd: item });
      return;
    }
    await addItemToCart(item);
  };

  const handleClearAndAdd = async () => {
    if (!showConflict) return;
    const item = showConflict.itemToAdd;
    setShowConflict(null);
    await clearCart();
    await addItemToCart(item);
  };

  const addItemToCart = async (item: any) => {
    setAddingItem(item.id);
    try {
      const result = await addToCart(id as string, item.id, 1);
      if (result.success) {
        showToast(`${item.name} added to cart`);
      } else if (result.conflict) {
        setShowConflict({ itemToAdd: item });
      } else {
        showToast(result.message || 'Failed to add item', 'error');
      }
    } catch (error) {
      showToast('Something went wrong', 'error');
    } finally {
      setAddingItem(null);
    }
  };

  const handleIncrement = async (item: any) => {
    const currentQty = getItemQuantity(item.id);
    if (currentQty === 0) {
      setAddingItem(item.id);
      await handleAddToCart(item);
      setAddingItem(null);
    } else {
      updateQuantity(item.id, currentQty + 1);
    }
  };

  const handleDecrement = async (item: any) => {
    const currentQty = getItemQuantity(item.id);
    if (currentQty <= 1) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, currentQty - 1);
    }
  };

  const moduleConfig = MODULES[(module as string)?.toUpperCase() as keyof typeof MODULES] || MODULES.FOOD;

  if (loading && !store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={moduleConfig.color} />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!store) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={60} color="#EF4444" />
          <Text style={styles.errorText}>Store not found</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: moduleConfig.color }]} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Go Back</Text>
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
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(customer)/cart')}>
          <Ionicons name="cart-outline" size={22} color="#1F2937" />
          {itemCount > 0 && (
            <View style={[styles.badge, { backgroundColor: moduleConfig.color }]}>
              <Text style={styles.badgeText}>{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Store Hero */}
        <View style={[styles.heroCard, { borderBottomColor: moduleConfig.color + '30' }]}>
          <View style={[styles.heroIcon, { backgroundColor: moduleConfig.color + '15' }]}>
            <Text style={{ fontSize: 40 }}>{moduleConfig.icon}</Text>
          </View>
          <Text style={styles.heroName}>{store.name}</Text>
          {store.description ? <Text style={styles.heroDesc}>{store.description}</Text> : null}
          
          <View style={styles.heroMeta}>
            <View style={styles.metaChip}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.metaChipText}>{store.rating || '4.5'}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaChip}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.metaChipText}>{store.average_prep_time_minutes || 30} min</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>Min {'\u20B9'}{store.minimum_order_value || 0}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          {store.categories?.length === 0 && (
            <View style={styles.emptyMenu}>
              <Ionicons name="restaurant-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyMenuText}>No items available</Text>
            </View>
          )}

          {store.categories?.map((category: any) => (
            <View key={category.id} style={styles.categoryBlock}>
              <Text style={styles.categoryName}>{category.name}</Text>
              
              {category.items?.map((item: any) => {
                const qty = getItemQuantity(item.id);
                const isAdding = addingItem === item.id;
                
                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemLeft}>
                      {item.is_veg !== null && item.is_veg !== undefined && (
                        <View style={[styles.vegIndicator, { borderColor: item.is_veg ? '#22C55E' : '#EF4444' }]}>
                          <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#22C55E' : '#EF4444' }]} />
                        </View>
                      )}
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                        ) : null}
                        <Text style={[styles.itemPrice, { color: moduleConfig.color }]}>{'\u20B9'}{item.base_price}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemAction}>
                      {isAdding ? (
                        <View style={[styles.addBtnLoading, { borderColor: moduleConfig.color }]}>
                          <ActivityIndicator size="small" color={moduleConfig.color} />
                        </View>
                      ) : qty > 0 ? (
                        <View style={[styles.qtyControl, { borderColor: moduleConfig.color }]}>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => handleDecrement(item)}
                          >
                            <Ionicons name={qty === 1 ? "trash-outline" : "remove"} size={16} color={moduleConfig.color} />
                          </TouchableOpacity>
                          <Text style={[styles.qtyText, { color: moduleConfig.color }]}>{qty}</Text>
                          <TouchableOpacity 
                            style={styles.qtyBtn} 
                            onPress={() => handleIncrement(item)}
                          >
                            <Ionicons name="add" size={16} color={moduleConfig.color} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.addBtn, { borderColor: moduleConfig.color }]}
                          onPress={() => handleAddToCart(item)}
                        >
                          <Text style={[styles.addBtnText, { color: moduleConfig.color }]}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Cart Bar */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.floatingCart, { backgroundColor: moduleConfig.color }]}
          onPress={() => router.push('/(customer)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.floatingCartLabel}>
              {itemCount === 1 ? '1 item' : `${itemCount} items`} added
            </Text>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartAction}>VIEW CART</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Toast Notification */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Ionicons 
            name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
            size={18} 
            color="#fff" 
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Store Conflict Modal */}
      <Modal visible={!!showConflict} transparent animationType="fade">
        <View style={styles.conflictOverlay}>
          <View style={styles.conflictModal}>
            <View style={styles.conflictIconContainer}>
              <Ionicons name="swap-horizontal" size={32} color="#F59E0B" />
            </View>
            <Text style={styles.conflictTitle}>Replace cart?</Text>
            <Text style={styles.conflictMessage}>
              Your cart has items from {cartStore?.name}. Do you want to clear it and add items from {store?.name}?
            </Text>
            <View style={styles.conflictActions}>
              <TouchableOpacity
                style={styles.conflictCancelBtn}
                onPress={() => setShowConflict(null)}
              >
                <Text style={styles.conflictCancelText}>Keep Current</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.conflictConfirmBtn, { backgroundColor: moduleConfig.color }]}
                onPress={handleClearAndAdd}
              >
                <Text style={styles.conflictConfirmText}>Clear & Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  loadingText: { marginTop: 16, color: '#6B7280', fontSize: 15 },
  errorText: { fontSize: 18, color: '#1F2937', marginTop: 16, marginBottom: 24 },
  primaryBtn: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1F2937', textAlign: 'center' },
  badge: {
    position: 'absolute',
    top: 2, right: 2,
    borderRadius: 10, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Hero
  heroCard: {
    backgroundColor: '#fff',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 3,
  },
  heroIcon: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  heroName: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 6, textAlign: 'center' },
  heroDesc: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  heroMeta: { flexDirection: 'row', alignItems: 'center' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginHorizontal: 10 },

  // Menu
  menuSection: { paddingHorizontal: 16, paddingTop: 20 },
  emptyMenu: { alignItems: 'center', paddingVertical: 48 },
  emptyMenuText: { marginTop: 12, color: '#9CA3AF', fontSize: 15 },
  categoryBlock: { marginBottom: 28 },
  categoryName: {
    fontSize: 15, fontWeight: '700', color: '#6B7280',
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  itemLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  vegIndicator: {
    width: 16, height: 16, borderWidth: 1.5, borderRadius: 3,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 3,
  },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 3 },
  itemDesc: { fontSize: 12, color: '#9CA3AF', marginBottom: 6, lineHeight: 17 },
  itemPrice: { fontSize: 15, fontWeight: '700' },

  // Item Action (Add / Qty)
  itemAction: { marginLeft: 12 },
  addBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  addBtnLoading: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 10 },
  qtyText: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  // Floating Cart
  floatingCart: {
    position: 'absolute',
    bottom: 16, left: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 18,
    borderRadius: 14,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  floatingCartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  floatingCartBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  floatingCartLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  floatingCartAction: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  // Toast
  toast: {
    position: 'absolute',
    top: 70, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8,
    elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },

  // Conflict Modal
  conflictOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  conflictModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  conflictIconContainer: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  conflictTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  conflictMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  conflictActions: { flexDirection: 'row', gap: 12, width: '100%' },
  conflictCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  conflictCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  conflictConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  conflictConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
