const IS_CUSTOMER = process.env.EXPO_PUBLIC_APP_TYPE === 'customer';
const IS_DRIVER = process.env.EXPO_PUBLIC_APP_TYPE === 'driver';

// Base config from app.json
const baseConfig = require('./app.json').expo;

const customerOverrides = {
  name: 'ViaGo',
  slug: 'viago-customer',
  scheme: 'viago-customer',
  ios: {
    ...baseConfig.ios,
    bundleIdentifier: 'com.viagodelivery.customer',
  },
  android: {
    ...baseConfig.android,
    package: 'com.viagodelivery.customer',
  },
};

const driverOverrides = {
  name: 'ViaGo Driver',
  slug: 'viago-driver',
  scheme: 'viago-driver',
  ios: {
    ...baseConfig.ios,
    bundleIdentifier: 'com.viagodelivery.driver',
  },
  android: {
    ...baseConfig.android,
    package: 'com.viagodelivery.driver',
  },
};

module.exports = () => {
  let config = { ...baseConfig };

  if (IS_CUSTOMER) {
    config = { ...config, ...customerOverrides };
  } else if (IS_DRIVER) {
    config = { ...config, ...driverOverrides };
  } else {
    // Development mode - both apps available
    config.name = 'ViaGo';
    config.slug = 'viago';
    config.scheme = 'viago';
  }

  return config;
};
