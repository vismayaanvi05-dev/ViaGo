import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';

const G = '#10B981';

export default function DriverProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await logout();
    router.replace('/');
  };

  const stats = [
    { label: 'Total Rides', value: '0', icon: 'bicycle', color: G },
    { label: 'Rating', value: '5.0', icon: 'star', color: '#F59E0B' },
    { label: 'Experience', value: 'New', icon: 'ribbon', color: '#8B5CF6' },
  ];

  const menuItems = [
    { icon: 'car-outline', title: 'Vehicle Details', subtitle: 'Manage your vehicle info' },
    { icon: 'document-text-outline', title: 'Documents', subtitle: 'License, insurance & more' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Manage your alerts' },
    { icon: 'help-circle-outline', title: 'Help & Support', subtitle: 'FAQ and assistance' },
    { icon: 'shield-checkmark-outline', title: 'Safety', subtitle: 'Emergency contacts & safety tools' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.driverBadge}>
            <Ionicons name="bicycle" size={14} color="#065F46" />
            <Text style={styles.badgeText}>Delivery Partner</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15' }]}>
                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={20} color="#64748B" />
                </View>
                <View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogoutConfirm(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ViaGo Driver v1.0.0</Text>
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalMsg}>Are you sure you want to logout?</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLogout}>
                <Text style={styles.modalConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },

  profileCard: {
    alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, marginBottom: 8,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 24, backgroundColor: G,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  driverBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#D1FAE5', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#065F46' },

  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center',
  },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },

  menuSection: { marginHorizontal: 16, marginTop: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 16, borderRadius: 14, marginBottom: 6,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIconContainer: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  menuSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#FECACA', gap: 8,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center',
    justifyContent: 'center', padding: 24,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%',
    maxWidth: 320, alignItems: 'center',
  },
  modalIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEE2E2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  modalMsg: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 22 },
  modalBtns: { flexDirection: 'row', gap: 10, width: '100%' },
  modalCancel: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modalConfirm: {
    flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#EF4444',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
