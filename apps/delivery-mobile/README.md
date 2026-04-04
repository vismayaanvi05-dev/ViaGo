# HyperServe Delivery Partner Mobile App

## 📱 Delivery Partner Application

React Native Expo app for delivery partners to accept and complete deliveries.

## ✨ Features

- View available delivery orders
- Accept delivery requests
- GPS navigation to restaurant and customer
- Update delivery status (picked up, in transit, delivered)
- Capture proof of delivery photo
- Track earnings
- Order history
- OTP-based authentication

## 🚀 Getting Started

```bash
cd /app/apps/delivery-mobile
yarn install
cp .env.example .env
# Update API URL
expo start
```

## 📦 Build for Production

```bash
# Android
eas build -p android --profile production
eas submit -p android

# iOS
eas build -p ios --profile production
eas submit -p ios
```

## 📱 Permissions

- Location (GPS tracking for navigation)
- Camera (proof of delivery photos)

## 🔐 Authentication

- OTP-based phone authentication
- Role: `delivery`
- Test Phone: 9333333333
