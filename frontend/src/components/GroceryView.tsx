import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useLocation } from '@/src/contexts/LocationContext';
import { useCart } from '@/src/contexts/CartContext';

const TENANT_ID = 'b331f4e9-00f2-495b-bc46-3e43ef7fb008';
const VIRTUAL_STORE_ID = `${TENANT_ID}_grocery`;

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
  const { addToCart, getItemQuantity, updateQuantity, removeItem, cart, clearCart } = useCart();
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [allProducts, setAllProducts] = useState<GroceryProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Derive virtual store id from first product's tenant_id
  const virtualStoreId = allProducts[0]?.tenant_id
    ? `${allProducts[0].tenant_id}_grocery`
    : VIRTUAL_STORE_ID;

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
    setRefreshing(false);
  };

  // Filter products
  const displayProducts = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter(p => p.category_id === selectedCategory);

  const handleAdd = async (product: GroceryProduct) => {
    const storeId = product.tenant_id ? `${product.tenant_id}_grocery` : virtualStoreId;
    try {
      const result = await addToCart(storeId, product.id, 1);
      if (result && result.conflict) {
        Alert.alert(
          'Replace cart items?',
          result.message || 'Your cart contains items from a different category. Clear cart to add this item?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear & Add',
              style: 'destructive',
              onPress: async () => {
                await clearCart();
                await addToCart(storeId, product.id, 1);
              },
            },
          ]
        );
      }
    } catch (e) {
      console.error('Add to cart error:', e);
    }
  };

  const handleIncrement = async (product: GroceryProduct) => {
    const storeId = product.tenant_id ? `${product.tenant_id}_grocery` : virtualStoreId;
    const qty = getItemQuantity(product.id);
    const cartItem = cart?.items?.find(i => i.item_id === product.id);
    if (cartItem) {
      await updateQuantity(cartItem.item_id, qty + 1);
    } else {
      await addToCart(storeId, product.id, 1);
    }
  };

  const handleDecrement = async (product: GroceryProduct) => {
    const qty = getItemQuantity(product.id);
    const cartItem = cart?.items?.find(i => i.item_id === product.id);
    if (cartItem) {
      if (qty <= 1) {
        await removeItem(cartItem.item_id);
      } else {
        await updateQuantity(cartItem.item_id, qty - 1);
      }
    }
  };

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

          return (
            <View key={product.id} style={[styles.productCard, outOfStock && styles.productCardOOS]}>
              {/* Product Icon */}
              <View style={styles.productIconWrap}>
                <Ionicons name="leaf" size={22} color="#10B981" />
              </View>

              {/* Product Info */}
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

              {/* Add / Qty Controls */}
              <View style={styles.actionCol}>
                {outOfStock ? (
                  <View style={styles.oosTag}>
                    <Text style={styles.oosText}>Out of stock</Text>
                  </View>
                ) : qty === 0 ? (
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(product)}>
                    <Text style={styles.addBtnText}>ADD</Text>
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

  // Category Chips
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

  // Product List
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
  discountPill: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  discountText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },

  // Action column
  actionCol: { marginLeft: 12, alignItems: 'center' },
  addBtn: {
    borderWidth: 1.5, borderColor: '#10B981', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#10B98108',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#10B981' },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#10B981', borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#10B98110',
  },
  qtyNum: { fontSize: 14, fontWeight: '700', color: '#10B981', minWidth: 24, textAlign: 'center' },
  oosTag: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FEF2F2',
  },
  oosText: { fontSize: 11, fontWeight: '600', color: '#DC2626' },
});
