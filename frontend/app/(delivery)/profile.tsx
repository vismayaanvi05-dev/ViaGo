import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';

const DRIVER_COLOR = '#10B981';

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

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', title: 'Edit Profile', onPress: () => {} },
        { icon: 'car-outline', title: 'Vehicle Details', onPress: () => {} },
        { icon: 'document-text-outline', title: 'Documents', onPress: () => {} },
        { icon: 'card-outline', title: 'Bank Details', onPress: () => {} },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: 'notifications-outline', title: 'Notifications', onPress: () => {} },
        { icon: 'language-outline', title: 'Language', onPress: () => {} },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', title: 'Help & Support', onPress: () => {} },
        { icon: 'chatbubble-outline', title: 'Contact Us', onPress: () => {} },
        { icon: 'shield-checkmark-outline', title: 'Privacy Policy', onPress: () => {} },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'D'}
              </Text>
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Delivery Partner'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="bicycle" size={14} color={DRIVER_COLOR} />
            <Text style={styles.roleBadgeText}>Delivery Partner</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>4.8</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0%</Text>
              <Text style={styles.statLabel}>Accept Rate</Text>
            </View>
          </View>
        </View>

        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.menuItem,
                    itemIndex < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 30,
    marginBottom: 8,
  },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: DRIVER_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: DRIVER_COLOR },
  userName: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 24,
  },
  roleBadgeText: { fontSize: 13, fontWeight: '600', color: '#065F46' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  menuSection: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  menuCard: { backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: { fontSize: 15, color: '#EF4444', fontWeight: '600' },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 13 },
});
