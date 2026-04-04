import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/home/HomeScreen';
import DeliveryDetailsScreen from '../screens/delivery/DeliveryDetailsScreen';
import ActiveDeliveryScreen from '../screens/delivery/ActiveDeliveryScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="DeliveryDetails" 
      component={DeliveryDetailsScreen}
      options={{ title: 'Delivery Details' }}
    />
    <Stack.Screen 
      name="ActiveDelivery" 
      component={ActiveDeliveryScreen}
      options={{ title: 'Active Delivery' }}
    />
  </Stack.Navigator>
);

const HistoryStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HistoryMain" 
      component={HistoryScreen}
      options={{ title: 'Delivery History' }}
    />
  </Stack.Navigator>
);

const EarningsStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="EarningsMain" 
      component={EarningsScreen}
      options={{ title: 'Earnings' }}
    />
  </Stack.Navigator>
);

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
        tabBarActiveTintColor: '#EC4899',
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
        name="History" 
        component={HistoryStack}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📦</Text>,
        }}
      />
      <Tab.Screen 
        name="Earnings" 
        component={EarningsStack}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💰</Text>,
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
