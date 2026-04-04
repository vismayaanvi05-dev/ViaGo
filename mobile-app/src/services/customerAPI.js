import apiClient from './api';

export const customerAPI = {
  // App Config
  getConfig: (lat, lng) => 
    apiClient.get('/customer/config', { params: { lat, lng } }),

  // Store Discovery
  getStores: (lat, lng, module, search) =>
    apiClient.get('/customer/stores', { params: { lat, lng, module, search, limit: 20 } }),

  // Search
  search: (query, lat, lng, module) =>
    apiClient.get('/customer/search', { params: { q: query, lat, lng, module } }),

  // Store Details
  getRestaurant: (storeId) =>
    apiClient.get(`/customer/restaurants/${storeId}`),

  getGroceryStore: (storeId) =>
    apiClient.get(`/customer/stores/${storeId}/grocery`),

  getLaundryStore: (storeId) =>
    apiClient.get(`/customer/stores/${storeId}/laundry`),

  // Profile
  getProfile: () =>
    apiClient.get('/customer/profile'),

  updateProfile: (data) =>
    apiClient.put('/customer/profile', data),

  // Cart
  addToCart: (data) =>
    apiClient.post('/customer/cart/add', data),

  getCart: () =>
    apiClient.get('/customer/cart'),

  updateCartItem: (data) =>
    apiClient.put('/customer/cart/update', data),

  removeFromCart: (itemId) =>
    apiClient.delete('/customer/cart/remove', { params: { item_id: itemId } }),

  clearCart: () =>
    apiClient.delete('/customer/cart/clear'),

  // Coupons
  getCoupons: (storeId, module) =>
    apiClient.get('/customer/coupons', { params: { store_id: storeId, module } }),

  applyCoupon: (couponCode) =>
    apiClient.post('/customer/cart/apply-coupon', { coupon_code: couponCode }),

  // Addresses
  getAddresses: () =>
    apiClient.get('/customer/addresses'),

  createAddress: (data) =>
    apiClient.post('/customer/addresses', data),

  updateAddress: (id, data) =>
    apiClient.put(`/customer/addresses/${id}`, data),

  deleteAddress: (id) =>
    apiClient.delete(`/customer/addresses/${id}`),

  // Orders
  placeOrder: (data) =>
    apiClient.post('/customer/orders', data),

  getOrders: (skip = 0, limit = 20) =>
    apiClient.get('/customer/orders', { params: { skip, limit } }),

  getOrderDetails: (orderId) =>
    apiClient.get(`/customer/orders/${orderId}`),

  // Reviews
  submitReview: (data) =>
    apiClient.post('/customer/reviews', data),

  // Auth
  sendOTP: (phone) =>
    apiClient.post('/auth/send-otp', { phone, role: 'customer' }),

  verifyOTP: (phone, otp, name) =>
    apiClient.post('/auth/verify-otp', { phone, otp, role: 'customer', name }),
};
