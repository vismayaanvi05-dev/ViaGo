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
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { APP_CONFIG } from '@/src/config';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerLoginScreen() {
  const router = useRouter();
  const { sendOTP, verifyOTP, setAppMode, isAuthenticated, appMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'name'>('email');
  const [loading, setLoading] = useState(false);
  const [displayOTP, setDisplayOTP] = useState('');

  useEffect(() => {
    setAppMode('customer');
  }, []);

  useEffect(() => {
    if (isAuthenticated && appMode === 'customer') {
      router.replace('/(customer)/home');
    }
  }, [isAuthenticated, appMode]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(email);
      setLoading(false);

      if (result.success) {
        setDisplayOTP(result.otp || '');
        setStep('otp');
        Alert.alert(
          'OTP Sent! ✉️', 
          `Your verification code is: ${result.otp}\n\n(For testing - In production, check your email)`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(email, otp, name || undefined);
      setLoading(false);

      if (result.success) {
        // Will auto-redirect via useEffect
      } else if (result.error?.includes('Name required')) {
        setStep('name');
      } else {
        Alert.alert('Error', result.error || 'Invalid OTP');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleSubmitName = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your name');
      return;
    }
    await handleVerifyOTP();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
            <Ionicons name="cart" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>Customer Login</Text>
          <Text style={styles.subtitle}>
            {step === 'email' && 'Enter your email to get started'}
            {step === 'otp' && 'Enter the verification code'}
            {step === 'name' && 'Welcome! Tell us your name'}
          </Text>

          {step === 'email' && (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.form}>
              <Text style={styles.emailDisplay}>📧 {email}</Text>
              {displayOTP ? (
                <View style={styles.otpHintBox}>
                  <Text style={styles.otpHintLabel}>Your OTP:</Text>
                  <Text style={styles.otpHintValue}>{displayOTP}</Text>
                </View>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleVerifyOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); }}>
                  <Text style={styles.linkText}>Change email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                  <Text style={styles.linkText}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'name' && (
            <View style={styles.form}>
              <Text style={styles.newUserText}>🎉 Creating your account...</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Full Name"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleSubmitName}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  form: {
    width: '100%',
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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  linkText: {
    color: APP_CONFIG.PRIMARY_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },
  emailDisplay: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  otpHintBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  otpHintLabel: {
    fontSize: 12,
    color: '#065F46',
    marginBottom: 4,
  },
  otpHintValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    letterSpacing: 4,
  },
  newUserText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});
