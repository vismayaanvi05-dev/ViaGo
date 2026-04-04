import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

// Screens
import HomeScreen from '../screens/home/HomeScreen';
import StoreListScreen from '../screens/store/StoreListScreen';
import StoreDetailsScreen from '../screens/store/StoreDetailsScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SearchScreen from '../screens/home/SearchScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="StoreList" 
      component={StoreListScreen}
      options={{ title: 'Stores' }}
    />
    <Stack.Screen 
      name="StoreDetails" 
      component={StoreDetailsScreen}
      options={{ title: 'Store Details' }}
    />
    <Stack.Screen 
      name="Search" 
      component={SearchScreen}
      options={{ title: 'Search' }}
    />
  </Stack.Navigator>
);

// Cart Stack
const CartStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CartMain" 
      component={CartScreen}
      options={{ title: 'Cart' }}
    />
    <Stack.Screen 
      name="Checkout" 
      component={CheckoutScreen}
      options={{ title: 'Checkout' }}
    />
  </Stack.Navigator>
);

// Orders Stack
const OrdersStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="OrdersMain" 
      component={OrdersScreen}
      options={{ title: 'My Orders' }}
    />
    <Stack.Screen 
      name="OrderTracking" 
      component={OrderTrackingScreen}
      options={{ title: 'Track Order' }}
    />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartStack}
        options={{
          tabBarLabel: 'Cart',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🛒</Text>,
        }}
      />
      <Tab.Screen 
        name="Orders" 
        component={OrdersStack}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📦</Text>,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
