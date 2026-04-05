import apiClient from './api';

export const deliveryAPI = {
  // Auth
  sendOTP: (email) =>
    apiClient.post('/auth/send-otp', { email, role: 'delivery_partner' }),

  verifyOTP: (email, otp, name) =>
    apiClient.post('/auth/verify-otp', { email, otp, role: 'delivery_partner', name }),

  // Profile
  getProfile: () =>
    apiClient.get('/delivery/profile'),

  updateProfile: (data) =>
    apiClient.put('/delivery/profile', data),

  // Available Deliveries
  getAvailableDeliveries: (lat, lng, radius, module) =>
    apiClient.get('/delivery/available', { params: { lat, lng, radius_km: radius, module } }),

  // Accept/Reject
  acceptDelivery: (orderId) =>
    apiClient.post(`/delivery/accept/${orderId}`),

  rejectDelivery: (orderId, reason) =>
    apiClient.post(`/delivery/reject/${orderId}`, { reason }),

  // Assigned Deliveries
  getAssignedDeliveries: () =>
    apiClient.get('/delivery/assigned'),

  // Update Status
  updateDeliveryStatus: (orderId, status, proof) =>
    apiClient.put(`/delivery/status/${orderId}`, { status, ...proof }),

  // History
  getDeliveryHistory: (skip, limit) =>
    apiClient.get('/delivery/history', { params: { skip, limit } }),

  // Earnings
  getEarnings: (period) =>
    apiClient.get('/delivery/earnings', { params: { period } }),

  // Location
  updateLocation: (lat, lng) =>
    apiClient.put('/delivery/location', { lat, lng }),
};
