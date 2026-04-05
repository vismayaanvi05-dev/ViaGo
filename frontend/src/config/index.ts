// App type: 'customer' | 'driver' | undefined (both/dev mode)
export const APP_TYPE = process.env.EXPO_PUBLIC_APP_TYPE as 'customer' | 'driver' | undefined;
export const IS_CUSTOMER_APP = APP_TYPE === 'customer';
export const IS_DRIVER_APP = APP_TYPE === 'driver';
export const IS_DEV_MODE = !APP_TYPE; // Shows both apps when no type set

export const APP_CONFIG = {
  APP_NAME: IS_DRIVER_APP ? 'ViaGo Driver' : 'ViaGo',
  VERSION: '1.0.0',
  PRIMARY_COLOR: IS_DRIVER_APP ? '#10B981' : '#8B5CF6',
  SECONDARY_COLOR: IS_DRIVER_APP ? '#065F46' : '#6D28D9',
  BG_GRADIENT: IS_DRIVER_APP ? ['#064E3B', '#10B981'] : ['#1E1B4B', '#8B5CF6'],
};

export const SERVICE_TYPES = {
  food: {
    name: 'Food',
    icon: 'restaurant',
    color: '#EF4444',
  },
  grocery: {
    name: 'Grocery',
    icon: 'cart',
    color: '#10B981',
  },
  laundry: {
    name: 'Laundry',
    icon: 'shirt',
    color: '#3B82F6',
  },
};
