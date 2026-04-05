# Mobile Apps Deployment Guide

## 📱 Applications

### Customer App
- **Location**: `/app/mobile-app/`
- **Package**: `com.hyperserve.customer`
- **Platform**: React Native (Expo)

### Delivery Partner App
- **Location**: `/app/delivery-app/`
- **Package**: `com.hyperserve.delivery`
- **Platform**: React Native (Expo)

## 🔧 Configuration

### Backend URL
**Production**: `https://hyperserve-food-mvp.emergent.host`

Both mobile apps are configured to use the **same production backend** as the admin panel.

### Setup

1. Copy environment files:
```bash
cp mobile-app/.env.example mobile-app/.env
cp delivery-app/.env.example delivery-app/.env
```

2. Update backend URL in `.env` files if needed:
```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

## 🚀 Building for Production

### Prerequisites
- Expo account (free): https://expo.dev
- EAS CLI installed: `npm install -g eas-cli`
- Login: `eas login`

### Build APK (Direct Distribution)

```bash
# Customer App
cd mobile-app
eas build --platform android --profile production-apk

# Delivery App
cd delivery-app
eas build --platform android --profile production-apk
```

### Build AAB (Google Play Store)

```bash
# Customer App
cd mobile-app
eas build --platform android --profile production

# Delivery App
cd delivery-app
eas build --platform android --profile production
```

## 🔄 Architecture

```
┌─────────────────────────────────────┐
│   Production Backend                 │
│   (FastAPI + MongoDB)                │
└──────────────┬──────────────────────┘
               │
       ┌───────┼───────┐
       │       │       │
       ▼       ▼       ▼
    Admin  Customer Delivery
    Panel    App      App
```

**All three applications share:**
- ✅ Same backend API
- ✅ Same database
- ✅ Real-time synchronization

## 📊 API Endpoints Used

### Customer App
- `POST /api/auth/send-otp` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP
- `GET /api/customer/discover` - Browse stores
- `POST /api/customer/orders` - Place order
- `GET /api/customer/orders` - Order history

### Delivery App
- `POST /api/auth/login` - Login with email + password
- `GET /api/delivery/available` - Available orders
- `POST /api/delivery/accept/{orderId}` - Accept order
- `PUT /api/delivery/status/{orderId}` - Update delivery status
- `GET /api/delivery/history` - Delivery history

## 🔐 Authentication

### Customer App
- **Method**: OTP-based (Email)
- **Flow**: Email → OTP → Verify → JWT Token

### Delivery App
- **Method**: Email + Password OR OTP
- **Flow**: Email + Password → JWT Token
- **Alternative**: Email → OTP → Verify → JWT Token

## 📝 Notes

- `.env` files are gitignored for security
- Use `.env.example` as template
- Backend URL must match deployed admin panel
- All mobile API calls use HTTPS
- JWT tokens stored securely in AsyncStorage

## 🆘 Troubleshooting

**Issue**: "Network request failed"
- Check `EXPO_PUBLIC_BACKEND_URL` in `.env`
- Verify backend is accessible from mobile device
- Check CORS settings on backend

**Issue**: "Invalid credentials"
- Verify backend URL is correct
- Check if user exists in production database
- Test API endpoint directly with curl

## 📞 Support

For deployment issues, contact Emergent support or refer to:
- Expo documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
