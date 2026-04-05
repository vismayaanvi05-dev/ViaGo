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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, customerSignup, setAppMode, isAuthenticated, appMode } = useAuth();

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

  const handleLogin = async () => {
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');

    // Unified login — backend returns user role, we route accordingly
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      showError(result.error || 'Invalid credentials');
    }
    // Navigation happens via useEffect when isAuthenticated changes
  };

  const handleSignup = async () => {
    if (!name.trim()) { showError('Please enter your name'); return; }
    if (!validateEmail(email)) { showError('Please enter a valid email'); return; }
    if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setErrorMsg('');
    setAppMode('customer');
    const result = await customerSignup(email, password, name);
    setLoading(false);
    if (!result.success) {
      showError(result.error || 'Signup failed');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="flash" size={36} color="#fff" />
          </View>
          <Text style={styles.appName}>ViaGo</Text>
          <Text style={styles.subtitle}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </Text>
        </View>

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
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
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
              setMode(mode === 'login' ? 'signup' : 'login');
              setErrorMsg('');
            }}
          >
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Login'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>
            Customers and drivers use the same login. Your account type determines the experience you see.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 24, paddingBottom: 60 },
  logoContainer: { alignItems: 'center', marginBottom: 28, marginTop: 40 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginLeft: 4 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: 14, height: 52 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1F2937' },
  eyeBtn: { padding: 4 },
  primaryBtn: { borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B5CF6' },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchBtn: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: '#6B7280' },
  switchLink: { fontWeight: '600', color: '#8B5CF6' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  infoBox: {
    flexDirection: 'row', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    padding: 14, borderRadius: 14, marginTop: 24, alignItems: 'flex-start', gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 19 },
});
