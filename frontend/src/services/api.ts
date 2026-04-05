import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'https://hyperserve-food-mvp.emergent.host';

  
  // const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
  //               process.env.EXPO_PUBLIC_BACKEND_URL || 
  //               'https://intelligent-chandrasekhar-2.preview.emergentagent.com';

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Customer APIs
export const customerAPI = {
  // Auth - OTP based
  sendOTP: (email: string) => apiClient.post('/auth/send-otp', { email, role: 'customer' }),
  verifyOTP: (email: string, otp: string, name?: string) => apiClient.post('/auth/verify-otp', { email, otp, role: 'customer', name }),
  
  // Auth - Password based
  signup: (email: string, password: string, name: string) => apiClient.post('/auth/customer/signup', { email, password, name }),
  login: (email: string, password: string) => apiClient.post('/auth/customer/login', { email, password }),
  
  // App
  getConfig: (lat: number, lng: number, city?: string) => 
    apiClient.get('/customer/config', { params: { lat, lng, city } }),
  getStores: (lat: number, lng: number, module?: string, search?: string, city?: string) =>
    apiClient.get('/customer/stores', { params: { lat, lng, module, search, city, limit: 20 } }),
  search: (query: string, lat: number, lng: number, module?: string, city?: string) =>
    apiClient.get('/customer/search', { params: { q: query, lat, lng, module, city } }),
  getRestaurant: (storeId: string) =>
    apiClient.get(`/customer/restaurants/${storeId}`),
  getProfile: () => apiClient.get('/customer/profile'),
  updateProfile: (data: any) => apiClient.put('/customer/profile', data),
  addToCart: (data: any) => apiClient.post('/customer/cart/add', data),
  getCart: () => apiClient.get('/customer/cart'),
  updateCartItem: (data: any) => apiClient.put('/customer/cart/update', data),
  removeFromCart: (itemId: string) => apiClient.delete('/customer/cart/remove', { params: { item_id: itemId } }),
  clearCart: () => apiClient.delete('/customer/cart/clear'),
  getAddresses: () => apiClient.get('/customer/addresses'),
  createAddress: (data: any) => apiClient.post('/customer/addresses', data),
  deleteAddress: (id: string) => apiClient.delete(`/customer/addresses/${id}`),
  updateAddress: (id: string, data: any) => apiClient.put(`/customer/addresses/${id}`, data),
  placeOrder: (data: any) => apiClient.post('/customer/orders', data),
  getOrders: (skip?: number, limit?: number) => apiClient.get('/customer/orders', { params: { skip, limit } }),
  getOrderDetails: (orderId: string) => apiClient.get(`/customer/orders/${orderId}`),
  getOrder: (orderId: string) => apiClient.get(`/customer/orders/${orderId}`),
  // Ratings
  submitRating: (data: any) => apiClient.post('/customer/ratings', data),
  getStoreRatings: (storeId: string) => apiClient.get(`/customer/ratings/${storeId}`),
  // Coupons
  getCoupons: (city?: string, lat?: number, lng?: number) => apiClient.get('/customer/coupons', { params: { city, lat, lng } }),
  validateCoupon: (code: string, subtotal: number) =>
    apiClient.post('/customer/coupons/validate', { code, subtotal }),
  // Wallet
  getWallet: () => apiClient.get('/customer/wallet'),
  topupWallet: (amount: number) => apiClient.post('/customer/wallet/topup', { amount }),
  // Add-ons & Variants
  getItemAddons: (itemId: string) => apiClient.get(`/customer/items/${itemId}/addons`),
  // Delivery Slots (Grocery)
  getDeliverySlots: (storeId: string) => apiClient.get(`/customer/delivery-slots?store_id=${storeId}`),
  // Laundry Services
  getLaundryServices: (storeId: string) => apiClient.get(`/customer/laundry-services?store_id=${storeId}`),
  
  // Direct Grocery Browse (no store needed)
  getGrocery: (city?: string, search?: string, lat?: number, lng?: number) =>
    apiClient.get('/customer/grocery', { params: { city, search, lat, lng } }),
  
  // Direct Laundry Browse (no store needed)
  getLaundry: (city?: string, search?: string, lat?: number, lng?: number) =>
    apiClient.get('/customer/laundry', { params: { city, search, lat, lng } }),
};

// Driver APIs (Password-based auth - credentials set by admin)
export const driverAPI = {
  // Auth - Password based (credentials set by tenant admin)
  login: (email: string, password: string) => apiClient.post('/auth/driver/login', { email, password }),
  
  // Driver operations
  getProfile: () => apiClient.get('/delivery/profile'),
  updateProfile: (data: any) => apiClient.put('/delivery/profile', data),
  getAvailableDeliveries: (lat: number, lng: number, radius?: number, module?: string) =>
    apiClient.get('/delivery/available', { params: { lat, lng, radius_km: radius || 10, module } }),
  acceptDelivery: (orderId: string) => apiClient.post(`/delivery/accept/${orderId}`),
  rejectDelivery: (orderId: string, reason: string) => apiClient.post(`/delivery/reject/${orderId}`, { reason }),
  getAssignedDeliveries: () => apiClient.get('/delivery/assigned'),
  updateDeliveryStatus: (orderId: string, status: string, proof?: any) =>
    apiClient.put(`/delivery/status/${orderId}`, { status, ...proof }),
  getDeliveryHistory: (skip?: number, limit?: number) => apiClient.get('/delivery/history', { params: { skip, limit } }),
  getEarnings: (period?: string) => apiClient.get('/delivery/earnings', { params: { period } }),
  updateLocation: (lat: number, lng: number) => apiClient.put('/delivery/location', { lat, lng }),
};

// Alias for delivery screens
export const deliveryAPI = driverAPI;

// Admin APIs for managing drivers
export const adminAPI = {
  createDriver: (data: any) => apiClient.post('/auth/admin/drivers', data),
  listDrivers: () => apiClient.get('/auth/admin/drivers'),
  getDriver: (id: string) => apiClient.get(`/auth/admin/drivers/${id}`),
  updateDriver: (id: string, data: any) => apiClient.put(`/auth/admin/drivers/${id}`, data),
  deleteDriver: (id: string) => apiClient.delete(`/auth/admin/drivers/${id}`),
  getSettings: () => apiClient.get('/admin/settings'),
  updateSettings: (data: any) => apiClient.put('/admin/settings', data),
};
