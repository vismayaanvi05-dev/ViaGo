import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/src/contexts/CartContext';
import { customerAPI } from '@/src/services/api';
import { APP_CONFIG } from '@/src/config';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, store, subtotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ address_line: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAddresses();
      setAddresses(response.data);
      const defaultAddr = response.data.find((a: any) => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      else if (response.data.length > 0) setSelectedAddress(response.data[0].id);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address_line || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Error', 'Please fill all address fields');
      return;
    }
    try {
      const response = await customerAPI.createAddress({
        ...newAddress,
        state: newAddress.state || 'Maharashtra',
        is_default: addresses.length === 0,
        lat: 19.0760,
        lng: 72.8777,
      });
      await loadAddresses();
      setShowAddAddress(false);
      setNewAddress({ address_line: '', city: '', state: '', pincode: '' });
    } catch (error) {
      Alert.alert('Error', 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Select Address', 'Please select a delivery address');
      return;
    }

    try {
      setPlacing(true);
      const orderData = {
        store_id: store?.id,
        delivery_address_id: selectedAddress,
        items: cart?.items.map((item: any) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          variant_id: item.variant_id,
        })),
        payment_method: paymentMethod,
        delivery_type: 'instant',
        special_instructions: specialInstructions,
      };

      const response = await customerAPI.placeOrder(orderData);
      
      if (response.data.success) {
        await clearCart();
        Alert.alert(
          'Order Placed! 🎉',
          `Your order #${response.data.order_number} has been placed successfully!`,
          [{ text: 'View Orders', onPress: () => router.replace('/(customer)/orders') }]
        );
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  const deliveryFee = 30;
  const tax = subtotal * 0.05;
  const total = subtotal + deliveryFee + tax;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TouchableOpacity onPress={() => setShowAddAddress(!showAddAddress)}>
              <Ionicons name={showAddAddress ? 'close' : 'add'} size={24} color={APP_CONFIG.PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>
          
          {showAddAddress && (
            <View style={styles.addAddressForm}>
              <TextInput
                style={styles.input}
                placeholder="Address Line"
                value={newAddress.address_line}
                onChangeText={(text) => setNewAddress({ ...newAddress, address_line: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={newAddress.city}
                onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Pincode"
                keyboardType="number-pad"
                value={newAddress.pincode}
                onChangeText={(text) => setNewAddress({ ...newAddress, pincode: text })}
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddAddress}>
                <Text style={styles.addBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>
          )}

          {addresses.length === 0 ? (
            <Text style={styles.noAddressText}>No saved addresses. Add one above.</Text>
          ) : (
            addresses.map((address: any) => (
              <TouchableOpacity
                key={address.id}
                style={[styles.addressCard, selectedAddress === address.id && styles.selectedAddress]}
                onPress={() => setSelectedAddress(address.id)}
              >
                <View style={styles.radioButton}>
                  {selectedAddress === address.id && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>{address.address_type || 'Home'}</Text>
                  <Text style={styles.addressText}>{address.address_line}</Text>
                  <Text style={styles.addressText}>{address.city}, {address.pincode}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentCard, paymentMethod === 'cod' && styles.selectedPayment]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'cod' && <View style={styles.radioSelected} />}
            </View>
            <Ionicons name="cash-outline" size={24} color="#1F2937" />
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="E.g., Ring the bell twice"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax (5%)</Text>
            <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.placeOrderButton, (!selectedAddress || placing) && styles.disabledButton]}
        onPress={handlePlaceOrder}
        disabled={placing || !selectedAddress}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order • ₹{total.toFixed(2)}</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  addAddressForm: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 14 },
  addBtn: { backgroundColor: APP_CONFIG.PRIMARY_COLOR, padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600' },
  noAddressText: { fontSize: 14, color: '#6B7280' },
  addressCard: { flexDirection: 'row', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 8 },
  selectedAddress: { borderColor: APP_CONFIG.PRIMARY_COLOR, backgroundColor: '#F5F3FF' },
  radioButton: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: APP_CONFIG.PRIMARY_COLOR },
  addressInfo: { flex: 1 },
  addressType: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  addressText: { fontSize: 14, color: '#6B7280' },
  paymentCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, gap: 12 },
  selectedPayment: { borderColor: APP_CONFIG.PRIMARY_COLOR, backgroundColor: '#F5F3FF' },
  paymentText: { fontSize: 14, color: '#1F2937', flex: 1 },
  instructionsInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: '#6B7280' },
  billValue: { fontSize: 14, color: '#1F2937' },
  totalRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  totalLabel: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: APP_CONFIG.PRIMARY_COLOR },
  placeOrderButton: { backgroundColor: APP_CONFIG.PRIMARY_COLOR, margin: 16, padding: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
