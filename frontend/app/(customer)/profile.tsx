import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/contexts/AuthContext';
import { APP_CONFIG } from '@/src/config';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    const result = await updateUser({ name: editName, phone: editPhone });
    setSaving(false);
    if (result.success) {
      setShowEditProfile(false);
      showToast('Profile updated');
    } else {
      showToast(result.error || 'Failed to update');
    }
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline' as const, title: 'Edit Profile', onPress: () => setShowEditProfile(true) },
        { icon: 'location-outline' as const, title: 'Saved Addresses', onPress: () => router.push('/(customer)/checkout') },
        { icon: 'receipt-outline' as const, title: 'Order History', onPress: () => router.push('/(customer)/orders') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: 'notifications-outline' as const, title: 'Notifications', onPress: () => showToast('Coming soon') },
        { icon: 'language-outline' as const, title: 'Language', onPress: () => showToast('Coming soon') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline' as const, title: 'Help Center', onPress: () => showToast('Coming soon') },
        { icon: 'chatbubble-outline' as const, title: 'Contact Us', onPress: () => showToast('Coming soon') },
        { icon: 'document-text-outline' as const, title: 'Terms & Conditions', onPress: () => showToast('Coming soon') },
        { icon: 'shield-checkmark-outline' as const, title: 'Privacy Policy', onPress: () => showToast('Coming soon') },
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
          <View style={styles.memberBadge}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.memberText}>Customer</Text>
          </View>
        </View>

        {menuSections.map((section, si) => (
          <View key={si} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[styles.menuItem, ii < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.6}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconContainer}>
                      <Ionicons name={item.icon} size={20} color="#6B7280" />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutConfirm(true)}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version {APP_CONFIG.VERSION}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Logout Confirmation */}
      <Modal visible={showLogoutConfirm} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={[styles.modalIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="log-out-outline" size={28} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Logout?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalActions}>
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

      {/* Edit Profile */}
      <Modal visible={showEditProfile} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.editModal}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View style={styles.toast}>
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937' },
  profileCard: {
    alignItems: 'center', backgroundColor: '#fff',
    paddingVertical: 30, marginBottom: 8,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: APP_CONFIG.PRIMARY_COLOR,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  userPhone: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, gap: 6, marginTop: 8,
  },
  memberText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  menuSection: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  menuCard: { backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 20,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconContainer: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  menuItemText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16,
    paddingVertical: 14, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  logoutText: { fontSize: 15, color: '#EF4444', fontWeight: '600' },
  version: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 13 },

  // Overlay & Modals
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
    zIndex: 999,
  },
  modal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: '100%', maxWidth: 320, alignItems: 'center',
  },
  modalIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#F3F4F6',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#EF4444',
  },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Edit Profile Modal
  editModal: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 360,
  },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
  },
  editTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937',
  },
  saveBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Toast
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#10B981', paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, elevation: 6,
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
