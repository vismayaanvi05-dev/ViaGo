import React from 'react';
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
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      Alert.alert('Remove Item', 'Remove this item from cart?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeItem(itemId) },
      ]);
    } else {
      await updateQuantity(itemId, newQuantity);
    }
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleCheckout = () => {
    if (!cart || itemCount === 0) {
      Alert.alert('Empty Cart', 'Add items to cart before checkout');
      return;
    }
    router.push('/(customer)/checkout');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  if (!cart || itemCount === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySubtitle}>Add items to get started</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push('/(customer)/home')}
        >
          <Text style={styles.browseButtonText}>Browse Stores</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemPrice}>₹{item.unit_price}</Text>
      </View>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.item_id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => handleUpdateQuantity(item.item_id, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <Text style={styles.itemTotal}>₹{item.unit_price * item.quantity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.storeHeader}>
        <Text style={styles.storeLabel}>Items from</Text>
        <Text style={styles.storeName}>{store?.name || 'Store'}</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart.items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      <View style={styles.billContainer}>
        <Text style={styles.billTitle}>Bill Summary</Text>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total</Text>
          <Text style={styles.billValue}>₹{subtotal}</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Delivery Fee</Text>
          <Text style={styles.billValue}>₹30</Text>
        </View>
        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Tax (5%)</Text>
          <Text style={styles.billValue}>₹{(subtotal * 0.05).toFixed(2)}</Text>
        </View>
        <View style={[styles.billRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>To Pay</Text>
          <Text style={styles.totalValue}>₹{(subtotal + 30 + subtotal * 0.05).toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
        <Text style={styles.checkoutButtonText}>
          Proceed to Checkout ({itemCount} items)
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  browseButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: '#6B7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 12,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  billContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.PRIMARY_COLOR,
  },
  checkoutButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
