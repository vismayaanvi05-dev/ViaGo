import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/delivery/app-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSupport = (type) => {
    if (!settings) return;

    switch (type) {
      case 'email':
        if (settings.support_email) {
          Linking.openURL(`mailto:${settings.support_email}`);
        }
        break;
      case 'phone':
        if (settings.support_phone) {
          Linking.openURL(`tel:${settings.support_phone}`);
        }
        break;
      case 'website':
        if (settings.support_website) {
          Linking.openURL(settings.support_website);
        }
        break;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const menuItems = [
    {
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      onPress: () => navigation.navigate('PrivacyPolicy', { content: settings?.privacy_policy }),
      disabled: !settings?.privacy_policy,
    },
    {
      title: 'Terms & Conditions',
      icon: 'document-text-outline',
      onPress: () => navigation.navigate('TermsConditions', { content: settings?.terms_and_conditions }),
      disabled: !settings?.terms_and_conditions,
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => navigation.navigate('HelpSupport', { settings }),
      disabled: false,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        {menuItems.slice(0, 2).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, item.disabled && styles.menuItemDisabled]}
            onPress={item.onPress}
            disabled={item.disabled}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={24} color={item.disabled ? '#9CA3AF' : '#8B5CF6'} />
              <Text style={[styles.menuItemText, item.disabled && styles.menuItemTextDisabled]}>
                {item.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={menuItems[2].onPress}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name={menuItems[2].icon} size={24} color="#8B5CF6" />
            <Text style={styles.menuItemText}>{menuItems[2].title}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {settings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          {settings.support_email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactSupport('email')}
            >
              <Ionicons name="mail-outline" size={20} color="#8B5CF6" />
              <Text style={styles.contactText}>{settings.support_email}</Text>
            </TouchableOpacity>
          )}
          {settings.support_phone && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleContactSupport('phone')}
            >
              <Ionicons name="call-outline" size={20} color="#8B5CF6" />
              <Text style={styles.contactText}>{settings.support_phone}</Text>
            </TouchableOpacity>
          )}
          {settings.support_hours && (
            <View style={styles.contactItem}>
              <Ionicons name="time-outline" size={20} color="#8B5CF6" />
              <Text style={styles.contactText}>{settings.support_hours}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>HyperServe v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuItemTextDisabled: {
    color: '#9CA3AF',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default SettingsScreen;
