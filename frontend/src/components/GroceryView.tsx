import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useLocation } from '@/src/contexts/LocationContext';
import { useCart } from '@/src/contexts/CartContext';
import CartConflictModal from './CartConflictModal';

interface GroceryProduct {
  id: string;
  name: string;
  mrp: number;
  selling_price: number;
  discount_percentage: number;
  unit_type: string;
  unit_value: number;
  current_stock: number;
  brand?: string;
  category_id: string;
  tenant_id?: string;
  is_available: boolean;
}

interface GroceryCategory {
  id: string;
  name: string;
  products: GroceryProduct[];
}

export default function GroceryView({ searchQuery }: { searchQuery?: string }) {
  const { location, address } = useLocation();
  const { addToCart, getItemQuantity, updateQuantity, removeItem, cart, clearCart, store: cartStore, loadCart } = useCart();
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [allProducts, setAllProducts] = useState<GroceryProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState<{ itemToAdd: GroceryProduct } | null>(null);

  const getVirtualStoreId = (product?: GroceryProduct) => {
    const tenantId = product?.tenant_id || allProducts[0]?.tenant_id || '';
    return `${tenantId}_grocery`;
  };

  const loadData = useCallback(async () => {
    try {
      const city = address?.city || undefined;
      const response = await customerAPI.getGrocery(
        city, searchQuery || undefined,
        location?.latitude, location?.longitude
      );
      setCategories(response.data.categories || []);
      setAllProducts(response.data.products || []);
    } catch (error) {
      console.error('Error loading grocery:', error);
    } finally {
      setLoading(false);
    }
  }, [address, location, searchQuery]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    await loadCart();
    setRefreshing(false);
  };

  // Filter products
  const displayProducts = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category_id === selectedCategory);

  // ─── Cart conflict & add logic (same as food store) ───
  const handleAddToCart = async (product: GroceryProduct) => {
    const storeId = getVirtualStoreId(product);
    // Check store conflict using cart state
    if (cart && cart.items && cart.items.length > 0 && cart.store_id && cart.store_id !== storeId) {
      setShowConflict({ itemToAdd: product });
      return;
    }
    await addItemToCart(product);
  };

  const handleClearAndAdd = async () => {
    if (!showConflict) return;
    const product = showConflict.itemToAdd;
    setShowConflict(null);
    await clearCart();
    await addItemToCart(product);
  };

  const addItemToCart = async (product: GroceryProduct) => {
    const storeId = getVirtualStoreId(product);
    setAddingItem(product.id);
    try {
      const result = await addToCart(storeId, product.id, 1);
      if (result && result.conflict) {
        setShowConflict({ itemToAdd: product });
      }
    } catch (e) {
      console.error('Add to cart error:', e);
    } finally {
      setAddingItem(null);
    }
  };

  const handleIncrement = async (product: GroceryProduct) => {
    const qty = getItemQuantity(product.id);
    if (qty === 0) {
      await handleAddToCart(product);
    } else {
      await updateQuantity(product.id, qty + 1);
    }
  };

  const handleDecrement = async (product: GroceryProduct) => {
    const qty = getItemQuantity(product.id);
    if (qty <= 1) {
      await removeItem(product.id);
    } else {
      await updateQuantity(product.id, qty - 1);
    }
  };

  // Current cart store name for conflict modal
  const currentCartName = cartStore?.name || (cart?.store_id || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading groceries...</Text>
      </View>
    );
  }

  if (allProducts.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="cart-outline" size={44} color="#10B981" />
        </View>
        <Text style={styles.emptyTitle}>No grocery items</Text>
        <Text style={styles.emptySub}>No grocery products available in your area yet</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />}
      >
        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, selectedCategory === 'all' && styles.chipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.chipText, selectedCategory === 'all' && styles.chipTextActive]}>
              All ({allProducts.length})
            </Text>
          </TouchableOpacity>
          {categories.map(cat => {
            const count = (cat.products || []).length;
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product List */}
        <View style={styles.productList}>
          {displayProducts.map(product => {
            const qty = getItemQuantity(product.id);
            const outOfStock = product.current_stock != null && product.current_stock <= 0;
            const hasDiscount = product.discount_percentage > 0;
            const price = product.selling_price || product.mrp;
            const isAdding = addingItem === product.id;

            return (
              <View key={product.id} style={[styles.productCard, outOfStock && styles.productCardOOS]}>
                <View style={styles.productIconWrap}>
                  <Ionicons name="leaf" size={22} color="#10B981" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <Text style={styles.productUnit}>
                    {product.unit_value} {product.unit_type}
                    {product.brand ? ` · ${product.brand}` : ''}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>{'\u20B9'}{price}</Text>
                    {hasDiscount && (
                      <>
                        <Text style={styles.mrpStrike}>{'\u20B9'}{product.mrp}</Text>
                        <View style={styles.discountPill}>
                          <Text style={styles.discountText}>{product.discount_percentage}% OFF</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.actionCol}>
                  {outOfStock ? (
                    <View style={styles.oosTag}>
                      <Text style={styles.oosText}>Out of stock</Text>
                    </View>
                  ) : qty === 0 ? (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddToCart(product)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#10B981" />
                      ) : (
                        <Text style={styles.addBtnText}>ADD</Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrement(product)}>
                        <Ionicons name="remove" size={16} color="#10B981" />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{qty}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => handleIncrement(product)}>
                        <Ionicons name="add" size={16} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Cart Conflict Modal — same as food store */}
      <CartConflictModal
        visible={!!showConflict}
        currentStoreName={currentCartName}
        newStoreName="Grocery"
        accentColor="#10B981"
        onKeepCurrent={() => setShowConflict(null)}
        onClearAndAdd={handleClearAndAdd}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, color: '#9CA3AF', fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B98112',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#9CA3AF' },
  chipsRow: { marginBottom: 12 },
  chipsContent: { paddingHorizontal: 4, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  productList: { gap: 1 },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  productCardOOS: { opacity: 0.5 },
  productIconWrap: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#10B98110',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  productUnit: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  mrpStrike: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through' },
  discountPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  actionCol: { marginLeft: 12, alignItems: 'center' },
  addBtn: {
    borderWidth: 1.5, borderColor: '#10B981', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#10B98108',
    minWidth: 70, alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#10B981', borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B98110' },
  qtyNum: { fontSize: 14, fontWeight: '700', color: '#10B981', minWidth: 24, textAlign: 'center' },
  oosTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEF2F2' },
  oosText: { fontSize: 11, fontWeight: '600', color: '#DC2626' },
});
