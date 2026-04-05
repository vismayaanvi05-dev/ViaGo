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
import { APP_CONFIG } from '@/src/config';

export default function ProfileScreen() {
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
    { icon: 'location-outline', title: 'Saved Addresses', onPress: () => {} },
    { icon: 'card-outline', title: 'Payment Methods', onPress: () => {} },
    { icon: 'notifications-outline', title: 'Notifications', onPress: () => {} },
    { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
    { icon: 'information-circle-outline', title: 'About', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
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

      <Text style={styles.version}>Version {APP_CONFIG.VERSION}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  profileSection: { alignItems: 'center', padding: 24, backgroundColor: '#fff', marginBottom: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: APP_CONFIG.PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280' },
  menuSection: { backgroundColor: '#fff', marginBottom: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemText: { fontSize: 16, color: '#1F2937' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff', gap: 8 },
  logoutText: { fontSize: 16, color: '#EF4444', fontWeight: '600' },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 16 },
});
