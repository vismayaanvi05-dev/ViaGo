import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const authAPI = {
  sendOTP: (phone, role = 'customer') =>
    apiClient.post('/auth/send-otp', { phone, role }),
  
  verifyOTP: (phone, otp, role, name = null) =>
    apiClient.post('/auth/verify-otp', { phone, otp, role, name }),
  
  getCurrentUser: () =>
    apiClient.get('/auth/me'),
};

// ==================== CUSTOMER APIs ====================
export const customerAPI = {
  // Addresses
  getAddresses: () => apiClient.get('/customer/addresses'),
  createAddress: (data) => apiClient.post('/customer/addresses', data),
  updateAddress: (id, data) => apiClient.put(`/customer/addresses/${id}`, data),
  deleteAddress: (id) => apiClient.delete(`/customer/addresses/${id}`),
  
  // Browse
  getRestaurants: (params) => apiClient.get('/customer/restaurants', { params }),
  getRestaurant: (id) => apiClient.get(`/customer/restaurants/${id}`),
  
  // Orders
  placeOrder: (data) => apiClient.post('/customer/orders', data),
  getOrders: (params) => apiClient.get('/customer/orders', { params }),
  getOrder: (id) => apiClient.get(`/customer/orders/${id}`),
  
  // Reviews
  createReview: (data) => apiClient.post('/customer/reviews', data),
};

// ==================== TENANT ADMIN APIs ====================
export const tenantAdminAPI = {
  // Settings
  getSettings: () => apiClient.get('/tenant-admin/settings'),
  updateSettings: (data) => apiClient.put('/tenant-admin/settings', data),
  
  // Stores
  getStores: (params) => apiClient.get('/tenant-admin/stores', { params }),
  getStore: (id) => apiClient.get(`/tenant-admin/stores/${id}`),
  createStore: (data) => apiClient.post('/tenant-admin/stores', data),
  updateStore: (id, data) => apiClient.put(`/tenant-admin/stores/${id}`, data),
  deleteStore: (id) => apiClient.delete(`/tenant-admin/stores/${id}`),
  
  // Categories
  getCategories: (params) => apiClient.get('/tenant-admin/categories', { params }),
  createCategory: (data) => apiClient.post('/tenant-admin/categories', data),
  updateCategory: (id, data) => apiClient.put(`/tenant-admin/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/tenant-admin/categories/${id}`),
  
  // Items
  getItems: (params) => apiClient.get('/tenant-admin/items', { params }),
  getItem: (id) => apiClient.get(`/tenant-admin/items/${id}`),
  createItem: (data) => apiClient.post('/tenant-admin/items', data),
  updateItem: (id, data) => apiClient.put(`/tenant-admin/items/${id}`, data),
  deleteItem: (id) => apiClient.delete(`/tenant-admin/items/${id}`),
  
  // Variants
  getVariants: (itemId) => apiClient.get('/tenant-admin/variants', { params: { item_id: itemId } }),
  createVariant: (data) => apiClient.post('/tenant-admin/variants', data),
  updateVariant: (id, data) => apiClient.put(`/tenant-admin/variants/${id}`, data),
  deleteVariant: (id) => apiClient.delete(`/tenant-admin/variants/${id}`),
  
  // Add-ons
  getAddons: (itemId) => apiClient.get('/tenant-admin/addons', { params: { item_id: itemId } }),
  createAddon: (data) => apiClient.post('/tenant-admin/addons', data),
  updateAddon: (id, data) => apiClient.put(`/tenant-admin/addons/${id}`, data),
  deleteAddon: (id) => apiClient.delete(`/tenant-admin/addons/${id}`),
  
  // Orders
  getOrders: (params) => apiClient.get('/tenant-admin/orders', { params }),
  getOrder: (id) => apiClient.get(`/tenant-admin/orders/${id}`),
  updateOrderStatus: (id, status) => apiClient.put(`/tenant-admin/orders/${id}/status`, null, { params: { status } }),
  
  // Reports
  getSalesReport: (params) => apiClient.get('/tenant-admin/reports/sales', { params }),
  getWalletReport: () => apiClient.get('/tenant-admin/reports/wallet'),
};

// ==================== SUPER ADMIN APIs ====================
export const superAdminAPI = {
  // Tenants
  getTenants: (params) => apiClient.get('/super-admin/tenants', { params }),
  getTenant: (id) => apiClient.get(`/super-admin/tenants/${id}`),
  createTenant: (data) => apiClient.post('/super-admin/tenants', data),
  updateTenant: (id, data) => apiClient.put(`/super-admin/tenants/${id}`, data),
  deleteTenant: (id) => apiClient.delete(`/super-admin/tenants/${id}`),
  
  // Subscription Plans
  getPlans: (params) => apiClient.get('/super-admin/subscription-plans', { params }),
  createPlan: (data) => apiClient.post('/super-admin/subscription-plans', data),
  updatePlan: (id, data) => apiClient.put(`/super-admin/subscription-plans/${id}`, data),
  
  // Tenant Subscriptions
  getTenantSubscription: (tenantId) => apiClient.get(`/super-admin/tenant-subscriptions/${tenantId}`),
  assignSubscription: (data) => apiClient.post('/super-admin/tenant-subscriptions', data),
  
  // Analytics
  getDashboard: () => apiClient.get('/super-admin/analytics/dashboard'),
  getTenantsRevenue: (params) => apiClient.get('/super-admin/analytics/tenants-revenue', { params }),
  
  // Payouts
  getPayouts: (params) => apiClient.get('/super-admin/payouts', { params }),
  processPayout: (id, data) => apiClient.put(`/super-admin/payouts/${id}`, data),
};

// ==================== DELIVERY APIs ====================
export const deliveryAPI = {
  getAvailableOrders: (params) => apiClient.get('/delivery/available-orders', { params }),
  getMyDeliveries: (params) => apiClient.get('/delivery/my-deliveries', { params }),
  acceptDelivery: (id) => apiClient.post(`/delivery/accept/${id}`),
  updateStatus: (id, status, proofImage = null) => 
    apiClient.put(`/delivery/status/${id}`, null, { params: { status, proof_image: proofImage } }),
  getEarnings: () => apiClient.get('/delivery/earnings'),
};

export default apiClient;
