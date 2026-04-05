import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CustomerLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { customerLogin, customerSignup, driverLogin, setAppMode, isAuthenticated, appMode } = useAuth();

  // 'customer' or 'driver' tab
  const [activeTab, setActiveTab] = useState<'customer' | 'driver'>('customer');
  // 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (appMode === 'driver') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/(customer)/home');
      }
    }
  }, [isAuthenticated, appMode]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setErrorMsg('');
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');

    if (activeTab === 'driver') {
      setAppMode('driver');
      const result = await driverLogin(email, password);
      setLoading(false);
      if (!result.success) {
        showError(result.error || 'Invalid driver credentials. Contact your admin.');
      }
    } else {
      setAppMode('customer');
      const result = await customerLogin(email, password);
      setLoading(false);
      if (!result.success) {
        showError(result.error || 'Login failed');
      }
    }
  };

  const handleSignup = async () => {
    // Signup is always customer registration
    if (!name.trim()) { showError('Please enter your name'); return; }
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');
    setAppMode('customer');
    const result = await customerSignup(email, password, name);
    setLoading(false);
    if (result.success) {
      router.replace('/(customer)/home');
    } else {
      showError(result.error || 'Signup failed');
    }
  };

  const switchTab = (tab: 'customer' | 'driver') => {
    setActiveTab(tab);
    setMode('login');
    resetForm();
  };

  const isDriverTab = activeTab === 'driver';
  const accentColor = isDriverTab ? '#10B981' : '#8B5CF6';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logoCircle, { backgroundColor: accentColor }]}>
            <Ionicons name={isDriverTab ? 'bicycle' : 'bag-handle'} size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>ViaGo</Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' ? 'Create your account' : isDriverTab ? 'Driver Login' : 'Customer Login'}
          </Text>
        </View>

        {/* Customer / Driver Tab Toggle */}
        {mode === 'login' && (
          <View style={styles.tabToggle}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'customer' && { backgroundColor: '#8B5CF6' }]}
              onPress={() => switchTab('customer')}
            >
              <Ionicons name="bag-handle" size={16} color={activeTab === 'customer' ? '#fff' : '#8B5CF6'} />
              <Text style={[styles.tabText, activeTab === 'customer' && { color: '#fff' }]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'driver' && { backgroundColor: '#10B981' }]}
              onPress={() => switchTab('driver')}
            >
              <Ionicons name="bicycle" size={16} color={activeTab === 'driver' ? '#fff' : '#10B981'} />
              <Text style={[styles.tabText, activeTab === 'driver' && { color: '#fff' }]}>Driver</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Banner */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {mode === 'signup' && (
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
            style={[styles.primaryBtn, { backgroundColor: accentColor }, loading && styles.btnDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === 'login' ? 'Login' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => {
              if (mode === 'login') {
                // Signup is always customer registration
                setMode('signup');
                setActiveTab('customer');
                setErrorMsg('');
              } else {
                setMode('login');
                setErrorMsg('');
              }
            }}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Text style={[styles.switchLink, { color: accentColor }]}>
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info box for drivers */}
        {activeTab === 'driver' && mode === 'login' && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.infoText}>
              Driver credentials are provided by your tenant admin. Contact them if you don't have login details.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 60 },
  logoContainer: { alignItems: 'center', marginBottom: 24, marginTop: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  tabToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1F2937' },
  eyeBtn: { padding: 4 },
  primaryBtn: { borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: '#6B7280' },
  switchLink: { fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    padding: 14, borderRadius: 14, marginTop: 20, alignItems: 'flex-start', gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
});
