import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/src/contexts/CartContext';
import { APP_CONFIG } from '@/src/config';

export default function CartScreen() {
  const router = useRouter();
  const {
    cart, store, subtotal, itemCount, loading,
    loadCart, updateQuantity, removeItem, clearCart,
  } = useCart();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    setUpdatingItem(itemId);
    try {
      if (newQty < 1) {
        await removeItem(itemId);
      } else {
        await updateQuantity(itemId, newQty);
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    setClearing(true);
    await clearCart();
    setClearing(false);
    setShowClearConfirm(false);
  };

  const handleCheckout = () => {
    if (!cart || itemCount === 0) return;
    router.push('/(customer)/checkout');
  };

  const deliveryFee = 30;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  if (loading && !cart) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={56} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from stores to get started</Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
            onPress={() => router.push('/(customer)/home')}
          >
            <Text style={styles.browseBtnText}>Browse Stores</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCartItem = ({ item }: { item: any }) => {
    const isUpdating = updatingItem === item.item_id;
    return (
      <View style={styles.cartItem}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <Text style={styles.itemUnitPrice}>{'\u20B9'}{item.unit_price} each</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={styles.qtyRow}>
            {isUpdating ? (
              <View style={styles.qtyLoadingContainer}>
                <ActivityIndicator size="small" color={APP_CONFIG.PRIMARY_COLOR} />
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleUpdateQuantity(item.item_id, item.quantity, -1)}
                >
                  <Ionicons name={item.quantity === 1 ? "trash-outline" : "remove"} size={16} color={APP_CONFIG.PRIMARY_COLOR} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => handleUpdateQuantity(item.item_id, item.quantity, 1)}
                >
                  <Ionicons name="add" size={16} color={APP_CONFIG.PRIMARY_COLOR} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.itemTotal}>{'\u20B9'}{(item.unit_price * item.quantity).toFixed(0)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={() => setShowClearConfirm(true)}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Store Info */}
      <View style={styles.storeInfo}>
        <View style={[styles.storeIconContainer, { backgroundColor: APP_CONFIG.PRIMARY_COLOR + '15' }]}>
          <Ionicons name="restaurant" size={18} color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName}>{store?.name || 'Store'}</Text>
          <Text style={styles.storeItemCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
        </View>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id || item.item_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bill Summary */}
      <View style={styles.billCard}>
        <Text style={styles.billTitle}>Bill Details</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>{'\u20B9'}{subtotal.toFixed(0)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={styles.billValue}>{'\u20B9'}{deliveryFee}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Taxes (5%)</Text>
          <Text style={styles.billValue}>{'\u20B9'}{tax.toFixed(0)}</Text>
        </View>
        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={[styles.totalValue, { color: APP_CONFIG.PRIMARY_COLOR }]}>{'\u20B9'}{total.toFixed(0)}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
          onPress={handleCheckout}
          activeOpacity={0.9}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <View style={styles.checkoutAmtBadge}>
            <Text style={styles.checkoutAmtText}>{'\u20B9'}{total.toFixed(0)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Clear Cart Confirmation */}
      {showClearConfirm && (
        <View style={styles.overlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIconWrap}>
              <Ionicons name="trash" size={28} color="#EF4444" />
            </View>
            <Text style={styles.confirmTitle}>Clear Cart?</Text>
            <Text style={styles.confirmMessage}>All items will be removed from your cart.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setShowClearConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={handleClearCart}
                disabled={clearing}
              >
                {clearing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Clear Cart</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  clearText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },

  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
  browseBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  browseBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  storeInfo: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', margin: 16, padding: 14,
    borderRadius: 12, gap: 12,
  },
  storeIconContainer: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  storeName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  storeItemCount: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  listContainer: { paddingHorizontal: 16, paddingBottom: 8 },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  itemLeft: { flex: 1, paddingRight: 12 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  itemUnitPrice: { fontSize: 13, color: '#9CA3AF' },
  itemRight: { alignItems: 'flex-end' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10,
    marginBottom: 8,
  },
  qtyLoadingContainer: { paddingHorizontal: 24, paddingVertical: 8 },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 8 },
  qtyText: { fontSize: 15, fontWeight: '700', color: '#1F2937', minWidth: 28, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#1F2937' },

  billCard: {
    backgroundColor: '#fff', marginHorizontal: 16, padding: 18, borderRadius: 14,
    borderWidth: 1, borderColor: '#F3F4F6',
  },
  billTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 14 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: '#6B7280' },
  billValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  billDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  totalValue: { fontSize: 18, fontWeight: '700' },

  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  checkoutAmtBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  checkoutAmtText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Clear Confirm Modal
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  confirmModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 320, alignItems: 'center',
  },
  confirmIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  confirmMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#F3F4F6',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  confirmDelete: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#EF4444',
  },
  confirmDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
