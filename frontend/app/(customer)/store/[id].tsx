import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerAPI } from '@/src/services/api';
import { useCart } from '@/src/contexts/CartContext';
import { APP_CONFIG, MODULES } from '@/src/config';

export default function StoreDetailsScreen() {
  const { id, module } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart, clearCart, store: cartStore, itemCount } = useCart();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreDetails();
  }, [id]);

  const loadStoreDetails = async () => {
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
  };

  const handleAddToCart = async (itemId: string, itemName: string) => {
    if (cartStore && cartStore.id !== id) {
      Alert.alert(
        'Different Store',
        `Your cart contains items from ${cartStore.name}. Clear cart to add items from ${store.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Cart',
            style: 'destructive',
            onPress: async () => {
              await clearCart();
              await addItemToCart(itemId, itemName);
            },
          },
        ]
      );
    } else {
      await addItemToCart(itemId, itemName);
    }
  };

  const addItemToCart = async (itemId: string, itemName: string) => {
    const result = await addToCart(id as string, itemId, 1);
    
    if (result.success) {
      Alert.alert('Added!', `${itemName} added to cart`, [
        { text: 'Continue Shopping' },
        { text: 'View Cart', onPress: () => router.push('/(customer)/cart') },
      ]);
    } else if (result.conflict) {
      Alert.alert('Error', result.message);
    } else {
      Alert.alert('Error', result.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={APP_CONFIG.PRIMARY_COLOR} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  const moduleColor = MODULES[(module as string)?.toUpperCase() as keyof typeof MODULES]?.color || APP_CONFIG.PRIMARY_COLOR;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{store.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        <View style={styles.storeHeader}>
          <View style={[styles.storeLogo, { backgroundColor: moduleColor }]}>
            <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
          </View>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description}</Text>
          <View style={styles.storeMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.metricText}>{store.rating || 'New'}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time" size={16} color="#6B7280" />
              <Text style={styles.metricText}>{store.average_prep_time_minutes} mins</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="wallet" size={16} color="#6B7280" />
              <Text style={styles.metricText}>Min ₹{store.minimum_order_value}</Text>
            </View>
          </View>
        </View>

        {store.categories?.map((category: any) => (
          <View key={category.id} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.name}</Text>
            {category.items?.map((item: any) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    {item.is_veg !== null && (
                      <View style={[styles.vegIndicator, { borderColor: item.is_veg ? '#10B981' : '#EF4444' }]}>
                        <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#10B981' : '#EF4444' }]} />
                      </View>
                    )}
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
                  <Text style={styles.itemPrice}>₹{item.base_price}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: moduleColor }]}
                  onPress={() => handleAddToCart(item.id, item.name)}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {itemCount > 0 && (
        <TouchableOpacity
          style={[styles.viewCartButton, { backgroundColor: moduleColor }]}
          onPress={() => router.push('/(customer)/cart')}
        >
          <Text style={styles.viewCartText}>{itemCount} item(s) in cart</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      )}
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  storeHeader: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  storeLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  storeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  storeMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categorySection: {
    marginTop: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.PRIMARY_COLOR,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  viewCartButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  viewCartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
