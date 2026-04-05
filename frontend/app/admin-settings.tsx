import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { adminAPI } from '@/src/services/api';

const ADMIN_COLOR = '#7C3AED';

export default function AdminSettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await adminAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await adminAPI.updateSettings(settings);
      if (response.data.success) {
        setSettings(response.data.settings);
        showToast('Settings saved successfully');
      }
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ADMIN_COLOR} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Settings</Text>
        <TouchableOpacity
          style={[styles.saveHeaderBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="apps" size={20} color={ADMIN_COLOR} />
            <Text style={styles.sectionTitle}>App Information</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>App Name</Text>
            <TextInput
              style={styles.input}
              value={settings?.app_name || ''}
              onChangeText={(v) => updateField('app_name', v)}
              placeholder="Your app name"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>About Us</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings?.about_us || ''}
              onChangeText={(v) => updateField('about_us', v)}
              placeholder="Brief description of your business"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Help Center */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={20} color={ADMIN_COLOR} />
            <Text style={styles.sectionTitle}>Help Center</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Help Center URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={settings?.help_center_url || ''}
              onChangeText={(v) => updateField('help_center_url', v)}
              placeholder="https://help.yourapp.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Help Content (if no URL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings?.help_center_content || ''}
              onChangeText={(v) => updateField('help_center_content', v)}
              placeholder="Provide help instructions for your customers"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Contact Us */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble" size={20} color={ADMIN_COLOR} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Support Email</Text>
            <TextInput
              style={styles.input}
              value={settings?.contact_email || ''}
              onChangeText={(v) => updateField('contact_email', v)}
              placeholder="support@yourapp.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Support Phone</Text>
            <TextInput
              style={styles.input}
              value={settings?.contact_phone || ''}
              onChangeText={(v) => updateField('contact_phone', v)}
              placeholder="+91 9876543210"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Business Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings?.contact_address || ''}
              onChangeText={(v) => updateField('contact_address', v)}
              placeholder="Your business address"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={ADMIN_COLOR} />
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Terms URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={settings?.terms_conditions_url || ''}
              onChangeText={(v) => updateField('terms_conditions_url', v)}
              placeholder="https://yourapp.com/terms"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Terms Content (if no URL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings?.terms_conditions_content || ''}
              onChangeText={(v) => updateField('terms_conditions_content', v)}
              placeholder="Your terms and conditions"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
            />
          </View>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color={ADMIN_COLOR} />
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Privacy Policy URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={settings?.privacy_policy_url || ''}
              onChangeText={(v) => updateField('privacy_policy_url', v)}
              placeholder="https://yourapp.com/privacy"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Privacy Policy Content (if no URL)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settings?.privacy_policy_content || ''}
              onChangeText={(v) => updateField('privacy_policy_content', v)}
              placeholder="Your privacy policy"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save All Settings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Ionicons
            name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color="#fff"
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center' },
  saveHeaderBtn: {
    backgroundColor: ADMIN_COLOR, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
  },
  saveHeaderText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  content: { flex: 1 },
  section: {
    backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18,
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    minHeight: 80, textAlignVertical: 'top', paddingTop: 12,
  },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: ADMIN_COLOR, marginHorizontal: 16, marginTop: 24,
    paddingVertical: 16, borderRadius: 14, gap: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toast: {
    position: 'absolute', top: 60, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, gap: 8, elevation: 6,
  },
  toastSuccess: { backgroundColor: '#10B981' },
  toastError: { backgroundColor: '#EF4444' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
});
