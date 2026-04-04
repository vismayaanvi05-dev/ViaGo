import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { customerAPI } from '../../services/customerAPI';
import { useCart } from '../../context/CartContext';
import { APP_CONFIG } from '../../config';

const StoreDetailsScreen = ({ route, navigation }) => {
  const { storeId, module } = route.params;
  const { addToCart, clearCart, store: cartStore } = useCart();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreDetails();
  }, []);

  const loadStoreDetails = async () => {
    try {
      setLoading(true);
      let response;
      
      if (module === 'food' || module === 'restaurant') {
        response = await customerAPI.getRestaurant(storeId);
      } else if (module === 'grocery') {
        response = await customerAPI.getGroceryStore(storeId);
      } else if (module === 'laundry') {
        response = await customerAPI.getLaundryStore(storeId);
      }
      
      setStore(response.data);
    } catch (error) {
      console.error('Error loading store:', error);
      Alert.alert('Error', 'Failed to load store details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (itemId, quantity = 1) => {
    // Check if cart has items from different store
    if (cartStore && cartStore.id !== storeId) {
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
              await addItemToCart(itemId, quantity);
            },
          },
        ]
      );
    } else {
      await addItemToCart(itemId, quantity);
    }
  };

  const addItemToCart = async (itemId, quantity) => {
    const result = await addToCart(storeId, itemId, quantity);
    
    if (result.success) {
      Alert.alert('Success', 'Item added to cart', [
        { text: 'Continue Shopping' },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart') },
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

  const renderFoodMenu = () => (
    <ScrollView>
      <View style={styles.storeHeader}>
        <View style={styles.storeLogo}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeDescription}>{store.description}</Text>
        <View style={styles.storeMetrics}>
          <Text style={styles.metric}>⭐ {store.average_rating || 'New'}</Text>
          <Text style={styles.metric}>• {store.average_prep_time_minutes} mins</Text>
          <Text style={styles.metric}>• Min order ₹{store.minimum_order_value}</Text>
        </View>
      </View>

      {store.categories?.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {category.items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemPrice}>₹{item.base_price}</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item.id)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderGroceryStore = () => (
    <ScrollView>
      <View style={styles.storeHeader}>
        <View style={styles.storeLogo}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeDescription}>Grocery Store</Text>
      </View>

      {store.categories?.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {category.items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.base_price}/{item.unit_type || 'unit'}</Text>
                {item.in_stock ? (
                  <Text style={styles.stockText}>In Stock</Text>
                ) : (
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                )}
              </View>
              {item.in_stock && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(item.id)}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  const renderLaundryStore = () => (
    <ScrollView>
      <View style={styles.storeHeader}>
        <View style={styles.storeLogo}>
          <Text style={styles.storeLogoText}>{store.name.charAt(0)}</Text>
        </View>
        <Text style={styles.storeName}>{store.name}</Text>
        <Text style={styles.storeDescription}>Laundry Services</Text>
      </View>

      {store.categories?.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {category.items?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.pricing?.map((price, index) => (
                  <Text key={index} style={styles.pricingText}>
                    {price.service_type}: ₹{price.price}
                  </Text>
                ))}
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item.id)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );

  // Render appropriate view based on module
  let content;
  if (module === 'food' || module === 'restaurant') {
    content = renderFoodMenu();
  } else if (module === 'grocery') {
    content = renderGroceryStore();
  } else if (module === 'laundry') {
    content = renderLaundryStore();
  }

  return <View style={styles.container}>{content}</View>;
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
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
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
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
  },
  storeMetrics: {
    flexDirection: 'row',
  },
  metric: {
    fontSize: 12,
    color: '#6B7280',
    marginHorizontal: 8,
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
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
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
  pricingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  outOfStockText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default StoreDetailsScreen;
