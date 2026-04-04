# HyperServe Customer Mobile App

## 📱 Food Ordering Mobile Application

React Native Expo app for customers to browse restaurants and order food.

## ✨ Features

- Browse nearby restaurants
- View restaurant menus
- Add items to cart
- Place orders
- Track order status
- View order history
- Manage delivery addresses
- OTP-based authentication

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Studio

### Installation

```bash
cd /app/apps/customer-mobile
yarn install

# Copy environment variables
cp .env.example .env

# Update API URL in .env
API_URL=https://your-backend-api.com

# Start development server
expo start
```

### Run on Device

```bash
# iOS
expo start --ios

# Android
expo start --android

# Or scan QR code with Expo Go app
```

## 📦 Build for Production

### Android (Play Store)

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build APK for testing
eas build -p android --profile preview

# Build AAB for Play Store
eas build -p android --profile production

# Submit to Play Store
eas submit -p android
```

### iOS (App Store)

```bash
# Build for iOS
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios
```

## 📝 Configuration

### Update app.json

1. Change `expo.name` and `expo.slug`
2. Update `android.package` (e.g., `com.yourcompany.customer`)
3. Update `ios.bundleIdentifier`
4. Add your own icon and splash screen

### Environment Variables (.env)

```
API_URL=https://your-backend-api.com
```

## 📱 App Structure

```
src/
├── screens/      # App screens
│   ├── LoginScreen.js
│   ├── RestaurantsScreen.js
│   ├── MenuScreen.js
│   ├── CartScreen.js
│   ├── CheckoutScreen.js
│   └── OrdersScreen.js
├── navigation/   # Navigation setup
├── contexts/     # Auth context
├── api/          # API client
└── components/   # Reusable components
```

## 🔐 Authentication

- OTP-based phone authentication
- Role: `customer`
- AsyncStorage for token persistence

## 🆘 Support

For issues, open a GitHub issue or contact support.
