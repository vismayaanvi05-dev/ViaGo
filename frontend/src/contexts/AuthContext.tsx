import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { customerAPI, deliveryAPI } from '../services/api';

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
  userRole: 'customer' | 'delivery_partner' | null;
  setUserRole: (role: 'customer' | 'delivery_partner') => void;
  sendOTP: (email: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOTP: (email: string, otp: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'customer' | 'delivery_partner' | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      const storedRole = await AsyncStorage.getItem('userRole');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      if (storedRole) {
        setUserRole(storedRole as 'customer' | 'delivery_partner');
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      const api = userRole === 'delivery_partner' ? deliveryAPI : customerAPI;
      const response = await api.sendOTP(email);
      return { success: true, otp: response.data.otp };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (email: string, otp: string, name?: string) => {
    try {
      const api = userRole === 'delivery_partner' ? deliveryAPI : customerAPI;
      const response = await api.verifyOTP(email, otp, name);
      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('authToken', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userRole', userRole || 'customer');
      
      setToken(access_token);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.detail || 'Invalid OTP' };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userRole');
      setToken(null);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (userData: any) => {
    try {
      if (userRole === 'delivery_partner') {
        await deliveryAPI.updateProfile(userData);
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
        userRole,
        setUserRole,
        sendOTP,
        verifyOTP,
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
