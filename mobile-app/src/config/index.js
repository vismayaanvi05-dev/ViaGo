// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_BACKEND_URL + '/api',
  TIMEOUT: 30000,
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'HyperServe',
  VERSION: '1.0.0',
  PRIMARY_COLOR: '#8B5CF6',
  SECONDARY_COLOR: '#EC4899',
};

// Module Configuration
export const MODULES = {
  FOOD: {
    id: 'food',
    name: 'Food',
    icon: '🍔',
    color: '#EF4444',
  },
  GROCERY: {
    id: 'grocery',
    name: 'Grocery',
    icon: '🛒',
    color: '#10B981',
  },
  LAUNDRY: {
    id: 'laundry',
    name: 'Laundry',
    icon: '🧺',
    color: '#3B82F6',
  },
};
