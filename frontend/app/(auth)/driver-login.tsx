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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { IS_DEV_MODE } from '@/src/config';
import { Ionicons } from '@expo/vector-icons';

const DRIVER_GREEN = '#10B981';

export default function DriverLoginScreen() {
  const router = useRouter();
  const { driverLogin, sendOTP, verifyOTP, setAppMode, isAuthenticated, appMode } = useAuth();
  
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'email' | 'otp' | 'name'>('email');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setAppMode('driver');
  }, []);

  useEffect(() => {
    if (isAuthenticated && appMode === 'driver') {
      router.replace('/(delivery)/home');
    }
  }, [isAuthenticated, appMode]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // ===== PASSWORD LOGIN =====
  const handlePasswordLogin = async () => {
    if (!email.trim()) {
      showError('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      showError('Please enter your password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await driverLogin(email, password);
      setLoading(false);
      if (!result.success) {
        showError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong. Please try again.');
    }
  };

  // ===== OTP LOGIN =====
  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await sendOTP(email);
      setLoading(false);
      if (result.success) {
        if (result.email_sent) {
          setSuccessMsg(`Code sent to ${email}`);
          setTimeout(() => setSuccessMsg(''), 4000);
          setStep('otp');
        } else {
          showError('Could not deliver email. Please try password login.');
        }
      } else {
        showError(result.error || 'Failed to send OTP');
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length < 6) {
      showError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const result = await verifyOTP(email, otp, name || undefined);
      setLoading(false);
      if (result.success) {
        // Navigation handled by useEffect
      } else {
        if (result.error?.includes('Name required')) {
          setStep('name');
        } else {
          showError(result.error || 'Verification failed');
        }
      }
    } catch (error) {
      setLoading(false);
      showError('Something went wrong');
    }
  };

  const handleSubmitName = () => {
    if (!name.trim()) {
      showError('Please enter your name');
      return;
    }
    handleVerifyOTP();
  };

  const switchMode = (mode: 'password' | 'otp') => {
    setLoginMode(mode);
    setErrorMsg('');
    setSuccessMsg('');
    setStep('email');
    setOtp('');
    setName('');
    setPassword('');
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
          <Text style={styles.headerTitle}>Driver</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: DRIVER_GREEN }]}>
            <Ionicons name="bicycle" size={36} color="#fff" />
          </View>

          <Text style={styles.title}>Driver Login</Text>
          <Text style={styles.subtitle}>
            {loginMode === 'password'
              ? 'Sign in with credentials from your admin'
              : step === 'email'
              ? 'Enter your email to get a verification code'
              : step === 'otp'
              ? `Enter the code sent to ${email}`
              : 'Tell us your name'}
          </Text>

          {/* Login Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, loginMode === 'password' && styles.toggleButtonActive]}
              onPress={() => switchMode('password')}
            >
              <Ionicons name="lock-closed-outline" size={14} color={loginMode === 'password' ? '#fff' : '#64748B'} />
              <Text style={[styles.toggleText, loginMode === 'password' && styles.toggleTextActive]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, loginMode === 'otp' && styles.toggleButtonActive]}
              onPress={() => switchMode('otp')}
            >
              <Ionicons name="keypad-outline" size={14} color={loginMode === 'otp' ? '#fff' : '#64748B'} />
              <Text style={[styles.toggleText, loginMode === 'otp' && styles.toggleTextActive]}>OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Success Banner */}
          {successMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.successBannerText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* ====== PASSWORD MODE ====== */}
          {loginMode === 'password' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: DRIVER_GREEN }]}
                onPress={handlePasswordLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ====== OTP MODE ====== */}
          {loginMode === 'otp' && step === 'email' && (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
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
                style={[styles.button, { backgroundColor: DRIVER_GREEN }]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {loginMode === 'otp' && step === 'otp' && (
            <View style={styles.form}>
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
                style={[styles.button, { backgroundColor: DRIVER_GREEN }]}
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

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                <TouchableOpacity onPress={() => { setStep('email'); setOtp(''); }}>
                  <Text style={styles.linkText}>Change email</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSendOTP}>
                  <Text style={styles.linkText}>Resend code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loginMode === 'otp' && step === 'name' && (
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
                style={[styles.button, { backgroundColor: DRIVER_GREEN }]}
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

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.infoText}>
              {loginMode === 'password'
                ? "Don't have credentials? Contact your admin to get login details."
                : 'Use the email registered by your admin to receive a verification code.'}
            </Text>
          </View>
        </ScrollView>
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
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  toggleContainer: {
    flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12,
    padding: 4, marginBottom: 24, width: '100%',
  },
  toggleButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  toggleButtonActive: { backgroundColor: DRIVER_GREEN },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  toggleTextActive: { color: '#fff' },
  form: { width: '100%' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, marginBottom: 14, backgroundColor: '#F8FAFC',
  },
  inputIcon: { paddingLeft: 16, paddingRight: 4 },
  input: { flex: 1, padding: 16, paddingLeft: 8, fontSize: 16, color: '#0F172A' },
  eyeIcon: { padding: 16 },
  button: {
    paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkText: { fontSize: 14, fontWeight: '600', color: DRIVER_GREEN },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    padding: 14, borderRadius: 14, marginTop: 28, alignItems: 'flex-start', gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
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
