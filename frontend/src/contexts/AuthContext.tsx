import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerAPI, driverAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  profile_photo?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  appMode: 'customer' | 'driver' | null;
  setAppMode: (mode: 'customer' | 'driver') => Promise<void>;
  // Customer OTP auth
  sendOTP: (email: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOTP: (email: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  // Driver password auth
  driverLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [appMode, setAppModeState] = useState<'customer' | 'driver' | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedMode = await AsyncStorage.getItem('appMode');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      if (storedMode) {
        setAppModeState(storedMode as 'customer' | 'driver');
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAppMode = async (mode: 'customer' | 'driver') => {
    setAppModeState(mode);
    await AsyncStorage.setItem('appMode', mode);
  };

  // Customer OTP authentication
  const sendOTP = async (email: string) => {
    try {
      const response = await customerAPI.sendOTP(email);
      return { 
        success: true, 
        email_sent: response.data.email_sent !== false,
        otp: response.data.otp,
        message: response.data.message
      };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (email: string, otp: string, name?: string) => {
    try {
      const response = await customerAPI.verifyOTP(email, otp, name);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('appMode', 'customer');
      
      setToken(access_token);
      setUser(userData);
      setAppModeState('customer');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Invalid OTP' };
    }
  };

  // Driver password authentication
  const driverLogin = async (email: string, password: string) => {
    try {
      const response = await driverAPI.login(email, password);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('appMode', 'driver');
      
      setToken(access_token);
      setUser(userData);
      setAppModeState('driver');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Invalid credentials' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('appMode');
      setToken(null);
      setUser(null);
      setAppModeState(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (userData: any) => {
    try {
      if (appMode === 'driver') {
        await driverAPI.updateProfile(userData);
      } else {
        await customerAPI.updateProfile(userData);
      }
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser as User);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to update profile' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        appMode,
        setAppMode,
        sendOTP,
        verifyOTP,
        driverLogin,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
