import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = ({ route }) => {
  const { settings } = route.params || {};

  const handleContact = (type) => {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="headset-outline" size={48} color="#8B5CF6" />
          <Text style={styles.title}>How can we help?</Text>
          <Text style={styles.subtitle}>
            Get in touch with our support team
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>

          {settings?.support_email && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContact('email')}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{settings.support_email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {settings?.support_phone && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContact('phone')}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="call" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{settings.support_phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {settings?.support_website && (
            <TouchableOpacity
              style={styles.contactCard}
              onPress={() => handleContact('website')}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="globe" size={24} color="#8B5CF6" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Website</Text>
                <Text style={styles.contactValue}>{settings.support_website}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {settings?.support_hours && (
          <View style={styles.hoursCard}>
            <Ionicons name="time-outline" size={24} color="#8B5CF6" />
            <View style={styles.hoursInfo}>
              <Text style={styles.hoursLabel}>Support Hours</Text>
              <Text style={styles.hoursValue}>{settings.support_hours}</Text>
            </View>
          </View>
        )}

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Quick Tip</Text>
            <Text style={styles.tipText}>
              For faster response, include your order number when contacting support.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  hoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  hoursInfo: {
    marginLeft: 12,
    flex: 1,
  },
  hoursLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  hoursValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  tipContent: {
    marginLeft: 12,
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
});

export default HelpSupportScreen;
