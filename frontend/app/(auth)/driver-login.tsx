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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { IS_DEV_MODE } from '@/src/config';
import { Ionicons } from '@expo/vector-icons';

const DRIVER_GREEN = '#10B981';

export default function DriverLoginScreen() {
  const router = useRouter();
  const { driverLogin, setAppMode, isAuthenticated, appMode } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleLogin = async () => {
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

        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: DRIVER_GREEN }]}>
            <Ionicons name="bicycle" size={36} color="#fff" />
          </View>

          <Text style={styles.title}>Driver Login</Text>
          <Text style={styles.subtitle}>Sign in with credentials from your admin</Text>

          {/* Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

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
              onPress={handleLogin}
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

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text style={styles.infoText}>
              Don't have credentials? Contact your admin to get login details.
            </Text>
          </View>
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
  eyeIcon: { padding: 16 },
  button: {
    paddingVertical: 16, borderRadius: 14, width: '100%', alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
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
});
