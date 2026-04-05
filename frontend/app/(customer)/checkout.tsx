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
  KeyboardAvoidingView,
  Platform,
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
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [newAddress, setNewAddress] = useState({ 
    address_type: 'home',
    address_line: '', 
    city: '', 
    state: 'Maharashtra', 
    pincode: '',
    phone: '',
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAddresses();
      setAddresses(response.data || []);
      const defaultAddr = response.data?.find((a: any) => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
      else if (response.data?.length > 0) setSelectedAddress(response.data[0].id);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address_line || !newAddress.city || !newAddress.pincode || !newAddress.phone) {
      setOrderError('Please fill all address fields including phone number');
      return;
    }
    try {
      await customerAPI.createAddress({
        ...newAddress,
        is_default: addresses.length === 0,
        lat: 19.0760,
        lng: 72.8777,
      });
      await loadAddresses();
      setShowAddAddress(false);
      setNewAddress({ address_type: 'home', address_line: '', city: '', state: 'Maharashtra', pincode: '', phone: '' });
      setOrderError('');
    } catch (error) {
      setOrderError('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError('Please select a delivery address');
      return;
    }
    if (!cart?.items?.length) {
      setOrderError('Your cart is empty');
      return;
    }
    setOrderError('');

    try {
      setPlacing(true);
      const orderData = {
        store_id: store?.id,
        delivery_address_id: selectedAddress,
        items: cart.items.map((item: any) => ({
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
        router.replace('/(customer)/orders');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      setOrderError(error.response?.data?.detail || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Delivery Address Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="location" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Delivery Address</Text>
              </View>
              <TouchableOpacity 
                style={styles.addNewBtn}
                onPress={() => setShowAddAddress(!showAddAddress)}
              >
                <Ionicons name={showAddAddress ? 'close' : 'add'} size={20} color={APP_CONFIG.PRIMARY_COLOR} />
                <Text style={styles.addNewText}>{showAddAddress ? 'Cancel' : 'Add New'}</Text>
              </TouchableOpacity>
            </View>
            
            {showAddAddress && (
              <View style={styles.addAddressForm}>
                <View style={styles.addressTypeRow}>
                  {['home', 'work', 'other'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.addressTypeBtn,
                        newAddress.address_type === type && styles.addressTypeBtnActive
                      ]}
                      onPress={() => setNewAddress({ ...newAddress, address_type: type })}
                    >
                      <Ionicons 
                        name={type === 'home' ? 'home' : type === 'work' ? 'briefcase' : 'location'} 
                        size={16} 
                        color={newAddress.address_type === type ? '#fff' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.addressTypeText,
                        newAddress.address_type === type && styles.addressTypeTextActive
                      ]}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Full Address"
                  value={newAddress.address_line}
                  onChangeText={(text) => setNewAddress({ ...newAddress, address_line: text })}
                />
                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="City"
                    value={newAddress.city}
                    onChangeText={(text) => setNewAddress({ ...newAddress, city: text })}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Pincode"
                    keyboardType="number-pad"
                    value={newAddress.pincode}
                    onChangeText={(text) => setNewAddress({ ...newAddress, pincode: text })}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  value={newAddress.phone}
                  onChangeText={(text) => setNewAddress({ ...newAddress, phone: text })}
                />
                <TouchableOpacity style={styles.saveAddressBtn} onPress={handleAddAddress}>
                  <Text style={styles.saveAddressBtnText}>Save Address</Text>
                </TouchableOpacity>
              </View>
            )}

            {addresses.length === 0 && !showAddAddress ? (
              <View style={styles.noAddress}>
                <Ionicons name="location-outline" size={40} color="#D1D5DB" />
                <Text style={styles.noAddressText}>No saved addresses</Text>
                <Text style={styles.noAddressSubtext}>Add an address to continue</Text>
              </View>
            ) : (
              addresses.map((address: any) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress === address.id && styles.addressCardSelected
                  ]}
                  onPress={() => setSelectedAddress(address.id)}
                >
                  <View style={[
                    styles.radioCircle,
                    selectedAddress === address.id && styles.radioCircleSelected
                  ]}>
                    {selectedAddress === address.id && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.addressContent}>
                    <View style={styles.addressTypeTag}>
                      <Ionicons 
                        name={address.address_type === 'home' ? 'home' : address.address_type === 'work' ? 'briefcase' : 'location'} 
                        size={12} 
                        color="#6B7280" 
                      />
                      <Text style={styles.addressTypeTagText}>
                        {address.address_type?.toUpperCase() || 'HOME'}
                      </Text>
                    </View>
                    <Text style={styles.addressText}>{address.address_line}</Text>
                    <Text style={styles.addressCity}>{address.city}, {address.pincode}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="wallet" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Payment Method</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cod' && styles.paymentOptionSelected
              ]}
              onPress={() => setPaymentMethod('cod')}
            >
              <View style={[
                styles.radioCircle,
                paymentMethod === 'cod' && styles.radioCircleSelected
              ]}>
                {paymentMethod === 'cod' && <View style={styles.radioDot} />}
              </View>
              <Ionicons name="cash-outline" size={24} color="#1F2937" />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtitle}>Pay when your order arrives</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="chatbubble-ellipses" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Special Instructions</Text>
            </View>
            <TextInput
              style={styles.instructionsInput}
              placeholder="E.g., Ring the doorbell twice, leave at door..."
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Bill Summary */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="receipt" size={20} color={APP_CONFIG.PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Bill Summary</Text>
            </View>
            <View style={styles.billCard}>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee</Text>
                <Text style={styles.billValue}>₹{deliveryFee}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Taxes & Charges</Text>
                <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
              </View>
              <View style={styles.billDivider} />
              <View style={styles.billRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Place Order Button */}
        <View style={styles.bottomBar}>
          {orderError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{orderError}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              (!selectedAddress || placing) && styles.placeOrderBtnDisabled
            ]}
            onPress={handlePlaceOrder}
            disabled={placing || !selectedAddress}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.placeOrderText}>Place Order</Text>
                <View style={styles.placeOrderAmount}>
                  <Text style={styles.placeOrderAmountText}>{'\u20B9'}{total.toFixed(0)}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  section: { backgroundColor: '#fff', marginTop: 8, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  addNewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addNewText: { fontSize: 14, color: APP_CONFIG.PRIMARY_COLOR, fontWeight: '500' },
  addAddressForm: { marginBottom: 16 },
  addressTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addressTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  addressTypeBtnActive: { backgroundColor: APP_CONFIG.PRIMARY_COLOR },
  addressTypeText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  addressTypeTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  saveAddressBtn: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveAddressBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  noAddress: { alignItems: 'center', paddingVertical: 30 },
  noAddressText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginTop: 12 },
  noAddressSubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  addressCardSelected: { borderColor: APP_CONFIG.PRIMARY_COLOR, backgroundColor: APP_CONFIG.PRIMARY_COLOR + '08' },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioCircleSelected: { borderColor: APP_CONFIG.PRIMARY_COLOR },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: APP_CONFIG.PRIMARY_COLOR },
  addressContent: { flex: 1 },
  addressTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  addressTypeTagText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  addressText: { fontSize: 14, color: '#1F2937', marginBottom: 4, lineHeight: 20 },
  addressCity: { fontSize: 13, color: '#6B7280' },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    gap: 12,
  },
  paymentOptionSelected: { borderColor: APP_CONFIG.PRIMARY_COLOR, backgroundColor: APP_CONFIG.PRIMARY_COLOR + '08' },
  paymentInfo: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  paymentSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  billCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 14, color: '#6B7280' },
  billValue: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
  billDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  totalValue: { fontSize: 18, fontWeight: '700', color: APP_CONFIG.PRIMARY_COLOR },
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    padding: 16,
    borderRadius: 14,
  },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  placeOrderAmount: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  placeOrderAmountText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  errorBannerText: { fontSize: 13, color: '#EF4444', fontWeight: '500', flex: 1 },
});
