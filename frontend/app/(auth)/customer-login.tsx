import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CustomerLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOTP, verifyOTP, customerLogin, customerSignup, setAppMode } = useAuth();

  // Auth mode: 'password' (default, reliable) or 'otp'
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  // Steps for OTP: 'email' -> 'otp' -> 'name'
  const [otpStep, setOtpStep] = useState<'email' | 'otp' | 'name'>('email');
  // Steps for password: 'login' -> 'signup'
  const [passwordStep, setPasswordStep] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { setAppMode('customer'); }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // ===== PASSWORD AUTH =====
  const handlePasswordLogin = async () => {
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');
    const result = await customerLogin(email, password);
    setLoading(false);
    if (result.success) {
      router.replace('/(customer)/home');
    } else {
      if (result.error?.includes('OTP login')) {
        showError('This account uses OTP login. Switch to OTP mode.');
      } else {
        showError(result.error || 'Login failed');
      }
    }
  };

  const handlePasswordSignup = async () => {
    if (!name.trim()) { showError('Please enter your name'); return; }
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');
    const result = await customerSignup(email, password, name);
    setLoading(false);
    if (result.success) {
      router.replace('/(customer)/home');
    } else {
      showError(result.error || 'Signup failed');
    }
  };

  // ===== OTP AUTH =====
  const handleSendOTP = async () => {
    if (!validateEmail(email)) { showError('Please enter a valid email address'); return; }
    setLoading(true);
    setErrorMsg('');
    const result = await sendOTP(email);
    setLoading(false);
    if (result.success) {
      if (result.email_sent) {
        setSuccessMsg(`Verification code sent to ${email}`);
        setTimeout(() => setSuccessMsg(''), 4000);
        setOtpStep('otp');
      } else {
        showError('Could not deliver email. Please check your email or use Password login.');
      }
    } else {
      showError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) { showError('Please enter 6-digit code'); return; }
    setLoading(true);
    setErrorMsg('');
    const result = await verifyOTP(email, otp, name || undefined);
    setLoading(false);
    if (result.success) {
      router.replace('/(customer)/home');
    } else {
      if (result.error?.includes('name')) {
        setOtpStep('name');
      } else {
        showError(result.error || 'Invalid OTP');
      }
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) { showError('Please enter your name'); return; }
    setLoading(true);
    const result = await verifyOTP(email, otp, name);
    setLoading(false);
    if (result.success) {
      router.replace('/(customer)/home');
    } else {
      showError(result.error || 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="bag-handle" size={36} color="#fff" />
            </View>
            <Text style={styles.appName}>ViaGo</Text>
            <Text style={styles.subtitle}>Customer Login</Text>
          </View>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, authMode === 'password' && styles.modeBtnActive]}
            onPress={() => { setAuthMode('password'); setErrorMsg(''); }}
          >
            <Ionicons name="lock-closed" size={16} color={authMode === 'password' ? '#fff' : '#8B5CF6'} />
            <Text style={[styles.modeBtnText, authMode === 'password' && styles.modeBtnTextActive]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, authMode === 'otp' && styles.modeBtnActive]}
            onPress={() => { setAuthMode('otp'); setOtpStep('email'); setErrorMsg(''); }}
          >
            <Ionicons name="mail" size={16} color={authMode === 'otp' ? '#fff' : '#8B5CF6'} />
            <Text style={[styles.modeBtnText, authMode === 'otp' && styles.modeBtnTextActive]}>Email OTP</Text>
          </TouchableOpacity>
        </View>

        {/* Error / Success Banners */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}
        {successMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* ===== PASSWORD MODE ===== */}
        {authMode === 'password' && (
          <View style={styles.form}>
            {passwordStep === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter password (min 6 chars)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={passwordStep === 'login' ? handlePasswordLogin : handlePasswordSignup}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {passwordStep === 'login' ? 'Login' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => {
                setPasswordStep(passwordStep === 'login' ? 'signup' : 'login');
                setErrorMsg('');
              }}
            >
              <Text style={styles.switchText}>
                {passwordStep === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Text style={styles.switchLink}>{passwordStep === 'login' ? 'Sign Up' : 'Login'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== OTP MODE ===== */}
        {authMode === 'otp' && otpStep === 'email' && (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send OTP</Text>}
            </TouchableOpacity>
          </View>
        )}

        {authMode === 'otp' && otpStep === 'otp' && (
          <View style={styles.form}>
            <Text style={styles.otpInfo}>Enter the 6-digit code sent to {email}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="keypad-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setOtpStep('email'); setOtp(''); }} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                <Text style={styles.switchLink}>Change email</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {authMode === 'otp' && otpStep === 'name' && (
          <View style={styles.form}>
            <Text style={styles.otpInfo}>Almost done! Enter your name to complete registration.</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleNameSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Complete Signup</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  logoContainer: { alignItems: 'center' },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  modeBtnActive: { backgroundColor: '#8B5CF6' },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#8B5CF6' },
  modeBtnTextActive: { color: '#fff' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1F2937' },
  eyeBtn: { padding: 4 },
  primaryBtn: { backgroundColor: '#8B5CF6', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: '#6B7280' },
  switchLink: { color: '#8B5CF6', fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', borderRadius: 12, padding: 12, marginBottom: 12 },
  successText: { fontSize: 13, color: '#059669', flex: 1 },
  otpInfo: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 8 },
});
