import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { APP_CONFIG, IS_DEV_MODE } from '@/src/config';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setAppMode('customer');
  }, []);

  useEffect(() => {
    if (isAuthenticated && appMode === 'customer') {
      router.replace('/(customer)/home');
    }
  }, [isAuthenticated, appMode]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    if (!validateEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await sendOTP(email);
      setLoading(false);

      if (result.success) {
        if (result.otp) {
          setDisplayOTP(result.otp);
        }
        setSuccessMsg(`Verification code sent to ${email}`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setStep('otp');
      } else {
        showError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      showError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await verifyOTP(email, otp, name || undefined);
      setLoading(false);

      if (result.success) {
        // Will auto-redirect via useEffect
      } else if (result.error?.includes('Name required')) {
        setStep('name');
      } else {
        showError(result.error || 'Invalid verification code');
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong. Please try again.');
    }
  };

  const handleSubmitName = async () => {
    if (!name.trim()) {
      showError('Please enter your name');
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
        {/* Header */}
        <View style={styles.header}>
          {IS_DEV_MODE ? (
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#1E293B" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.headerTitle}>Customer</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}>
            <Ionicons name="bag-handle" size={36} color="#fff" />
          </View>
          
          <Text style={styles.title}>
            {step === 'email' && 'Welcome'}
            {step === 'otp' && 'Verify Email'}
            {step === 'name' && 'Almost Done'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' && 'Sign in with your email to continue'}
            {step === 'otp' && `Enter the code sent to ${email}`}
            {step === 'name' && 'Tell us your name to get started'}
          </Text>

          {/* Error/Success Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          {step === 'email' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.form}>
              {displayOTP ? (
                <View style={styles.otpHintBox}>
                  <Text style={styles.otpHintLabel}>Your verification code</Text>
                  <Text style={styles.otpHintValue}>{displayOTP}</Text>
                  <Text style={styles.otpHintNote}>Sandbox mode - check email in production</Text>
                </View>
              ) : null}
              <View style={styles.inputContainer}>
                <Ionicons name="keypad-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleVerifyOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>
              <View style={styles.linkRow}>
                <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); setDisplayOTP(''); }}>
                  <Text style={[styles.linkText, { color: APP_CONFIG.PRIMARY_COLOR }]}>Change email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                  <Text style={[styles.linkText, { color: APP_CONFIG.PRIMARY_COLOR }]}>Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 'name' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: APP_CONFIG.PRIMARY_COLOR }]}
                onPress={handleSubmitName}
                disabled={loading}
                activeOpacity={0.85}
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
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, marginBottom: 14, backgroundColor: '#F8FAFC',
  },
  inputIcon: { paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, padding: 16, paddingLeft: 8, fontSize: 16, color: '#0F172A' },
  button: {
    paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  linkText: { fontSize: 14, fontWeight: '600' },
  otpHintBox: {
    backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 14,
    padding: 16, marginBottom: 16, alignItems: 'center',
  },
  otpHintLabel: { fontSize: 12, color: '#166534', marginBottom: 4 },
  otpHintValue: { fontSize: 28, fontWeight: '800', color: '#059669', letterSpacing: 6 },
  otpHintNote: { fontSize: 11, color: '#6B7280', marginTop: 6 },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA', padding: 12, borderRadius: 12, marginBottom: 16, width: '100%',
  },
  errorBannerText: { fontSize: 13, color: '#DC2626', flex: 1 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4',
    borderWidth: 1, borderColor: '#BBF7D0', padding: 12, borderRadius: 12, marginBottom: 16, width: '100%',
  },
  successBannerText: { fontSize: 13, color: '#059669', flex: 1 },
});
