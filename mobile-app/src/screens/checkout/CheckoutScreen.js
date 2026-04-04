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
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { customerAPI } from '../../services/customerAPI';
import { APP_CONFIG } from '../../config';

const CheckoutScreen = ({ navigation }) => {
  const { cart, store, subtotal, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAddresses();
      setAddresses(response.data);
      const defaultAddr = response.data.find((a) => a.is_default);
      if (defaultAddr) setSelectedAddress(defaultAddr.id);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
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
        store_id: store.id,
        delivery_address_id: selectedAddress,
        items: cart.items.map((item) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          variant_id: item.variant_id,
        })),
        payment_method: paymentMethod,
        delivery_type: 'instant',
        special_instructions: specialInstructions,
        coupon_code: cart.applied_coupon?.code,
      };

      const response = await customerAPI.placeOrder(orderData);
      
      if (response.data.success) {
        await clearCart();
        Alert.alert(
          'Order Placed',
          `Your order #${response.data.order_number} has been placed successfully!`,
          [
            {
              text: 'Track Order',
              onPress: () => navigation.navigate('Orders', {
                screen: 'OrderTracking',
                params: { orderId: response.data.order_id },
              }),
            },
          ]
        );
      }
    } catch (error) {
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

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <Text style={styles.noAddressText}>No saved addresses</Text>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddress === address.id && styles.selectedAddress,
                ]}
                onPress={() => setSelectedAddress(address.id)}
              >
                <View style={styles.radioButton}>
                  {selectedAddress === address.id && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressType}>{address.address_type}</Text>
                  <Text style={styles.addressText}>{address.address_line}</Text>
                  <Text style={styles.addressText}>
                    {address.city}, {address.state} - {address.pincode}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'cod' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('cod')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'cod' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.paymentText}>Cash on Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.paymentCard,
              paymentMethod === 'online' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('online')}
          >
            <View style={styles.radioButton}>
              {paymentMethod === 'online' && <View style={styles.radioSelected} />}
            </View>
            <Text style={styles.paymentText}>Online Payment (Coming Soon)</Text>
          </TouchableOpacity>
        </View>

        {/* Special Instructions */}
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

        {/* Bill Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>
          {cart?.applied_coupon && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, styles.discountText]}>Discount</Text>
              <Text style={[styles.billValue, styles.discountText]}>
                -₹{cart.applied_coupon.discount_amount}
              </Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹0</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              ₹{subtotal - (cart?.applied_coupon?.discount_amount || 0)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
        disabled={placing || !selectedAddress}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

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
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  noAddressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  addressCard: {
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedAddress: {
    borderColor: APP_CONFIG.PRIMARY_COLOR,
    backgroundColor: '#F5F3FF',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
  },
  addressInfo: {
    flex: 1,
  },
  addressType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPayment: {
    borderColor: APP_CONFIG.PRIMARY_COLOR,
    backgroundColor: '#F5F3FF',
  },
  paymentText: {
    fontSize: 14,
    color: '#1F2937',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
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
  discountText: {
    color: '#10B981',
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
  placeOrderButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CheckoutScreen;
