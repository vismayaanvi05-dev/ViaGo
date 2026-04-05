import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { APP_CONFIG } from '@/src/config';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sendOTP, verifyOTP, setUserRole, userRole, isAuthenticated } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState('');

  useEffect(() => {
    const role = params.role as 'customer' | 'delivery_partner';
    if (role) {
      setUserRole(role);
    }
  }, [params.role]);

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'delivery_partner') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/(customer)/home');
      }
    }
  }, [isAuthenticated, userRole]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await sendOTP(email);
    setLoading(false);

    if (result.success) {
      setShowOTP(result.otp || '');
      Alert.alert('OTP Sent', `Your OTP is: ${result.otp}\n(For testing - check console in production)`, [
        { text: 'OK', onPress: () => setStep(2) }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(email, otp, name || undefined);
    setLoading(false);

    if (!result.success) {
      if (result.error?.includes('Name required')) {
        setStep(3);
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    }
  };

  const handleSubmitName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    await handleVerifyOTP();
  };

  const isDeliveryPartner = userRole === 'delivery_partner';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDeliveryPartner ? '#10B981' : APP_CONFIG.PRIMARY_COLOR }]}>
          <Ionicons 
            name={isDeliveryPartner ? 'bicycle' : 'cart'} 
            size={48} 
            color="#fff" 
          />
        </View>
        <Text style={styles.title}>
          {isDeliveryPartner ? 'Delivery Partner' : 'Customer'} Login
        </Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Enter your email to continue'
            : step === 2
            ? 'Enter the OTP sent to your email'
            : 'Tell us your name'}
        </Text>

        {step === 1 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDeliveryPartner ? '#10B981' : APP_CONFIG.PRIMARY_COLOR }]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.emailDisplay}>{email}</Text>
            {showOTP ? <Text style={styles.otpHint}>OTP: {showOTP}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDeliveryPartner ? '#10B981' : APP_CONFIG.PRIMARY_COLOR }]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.linkText}>Change email</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendOTP}>
              <Text style={styles.linkText}>Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isDeliveryPartner ? '#10B981' : APP_CONFIG.PRIMARY_COLOR }]}
              onPress={handleSubmitName}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: APP_CONFIG.PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  emailDisplay: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  otpHint: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
