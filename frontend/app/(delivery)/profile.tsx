import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';

export default function DeliveryProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', onPress: () => {} },
    { icon: 'car-outline', title: 'Vehicle Details', onPress: () => {} },
    { icon: 'document-text-outline', title: 'Documents', onPress: () => {} },
    { icon: 'card-outline', title: 'Bank Details', onPress: () => {} },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'D'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.badge}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.badgeText}>Delivery Partner</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#6B7280" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  profileSection: { alignItems: 'center', padding: 24, backgroundColor: '#fff', marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  menuSection: { backgroundColor: '#fff', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { fontSize: 16, color: '#1F2937' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff', gap: 8 },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 16 },
});
