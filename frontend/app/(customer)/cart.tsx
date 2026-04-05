import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/src/contexts/CartContext';
import { APP_CONFIG } from '@/src/config';

export default function CartScreen() {
  const router = useRouter();
  const {
    cart,
    store,
    subtotal,
    itemCount,
    loading,
    loadCart,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
      ]);
    } else {
      await updateQuantity(itemId, newQty);
    }
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleCheckout = () => {
    if (!cart || itemCount === 0) {
      Alert.alert('Empty Cart', 'Add items to cart before checkout');
      return;
    }
    router.push('/(customer)/checkout');
  };

  const deliveryFee = 30;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
      </SafeAreaView>
    );
  }

  if (!cart || itemCount === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from restaurants to get started</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/(customer)/home')}
          >
            <Ionicons name="restaurant" size={20} color="#fff" />
            <Text style={styles.browseButtonText}>Browse Restaurants</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemPrice}>₹{item.unit_price} each</Text>
      </View>
      <View style={styles.itemRight}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item.item_id, item.quantity, -1)}
          >
            <Ionicons name="remove" size={18} color={APP_CONFIG.PRIMARY_COLOR} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => handleUpdateQuantity(item.item_id, item.quantity, 1)}
          >
            <Ionicons name="add" size={18} color={APP_CONFIG.PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
        <Text style={styles.itemTotal}>₹{item.unit_price * item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Store Info */}
      <View style={styles.storeInfo}>
        <View style={styles.storeIcon}>
          <Ionicons name="restaurant" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
        </View>
        <View style={styles.storeDetails}>
          <Text style={styles.storeName}>{store?.name || 'Restaurant'}</Text>
          <Text style={styles.storeItems}>{itemCount} item(s)</Text>
        </View>
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bill Summary */}
      <View style={styles.billContainer}>
        <Text style={styles.billTitle}>Bill Details</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={styles.billValue}>₹{deliveryFee}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Taxes (5%)</Text>
          <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
        </View>
        <View style={styles.billDivider} />
        <View style={styles.billRow}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        <View style={styles.checkoutAmount}>
          <Text style={styles.checkoutAmountText}>₹{total.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  clearText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 32, textAlign: 'center' },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeDetails: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  storeItems: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  listContainer: { padding: 16 },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemLeft: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  itemPrice: { fontSize: 13, color: '#6B7280' },
  itemRight: { alignItems: 'flex-end' },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  qtyBtn: { padding: 8 },
  qtyText: { fontSize: 15, fontWeight: '600', color: '#1F2937', minWidth: 30, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  billContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
  },
  billTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#6B7280' },
  billValue: { fontSize: 14, color: '#1F2937' },
  billDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  totalValue: { fontSize: 18, fontWeight: '700', color: APP_CONFIG.PRIMARY_COLOR },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  checkoutAmount: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  checkoutAmountText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
