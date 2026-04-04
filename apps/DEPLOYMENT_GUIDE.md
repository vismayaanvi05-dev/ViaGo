# HyperServe - Deployment Guide for All Applications

## 📦 Applications Overview

### 1. Tenant Admin Web App
**Directory**: `/apps/tenant-admin-web`
**Tech**: React + Vite
**Deploy to**: Vercel, Netlify, or any static host

### 2. Super Admin Web App
**Directory**: `/apps/super-admin-web`
**Tech**: React + Vite
**Deploy to**: Vercel, Netlify, or any static host

### 3. Customer Mobile App
**Directory**: `/apps/customer-mobile`
**Tech**: React Native + Expo
**Deploy to**: Google Play Store, Apple App Store

### 4. Delivery Mobile App
**Directory**: `/apps/delivery-mobile`
**Tech**: React Native + Expo
**Deploy to**: Google Play Store, Apple App Store

---

## 🌐 Web Apps Deployment (Tenant Admin & Super Admin)

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy Tenant Admin
cd /apps/tenant-admin-web
vercel

# Deploy Super Admin
cd /apps/super-admin-web
vercel
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy Tenant Admin
cd /apps/tenant-admin-web
yarn build
netlify deploy --prod --dir=dist

# Deploy Super Admin
cd /apps/super-admin-web
yarn build
netlify deploy --prod --dir=dist
```

### Option 3: Docker

```dockerfile
# Dockerfile (same for both web apps)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t tenant-admin .
docker run -p 3000:80 tenant-admin
```

---

## 📱 Mobile Apps Deployment (Customer & Delivery)

### Prerequisites

```bash
# Install Expo CLI
npm install -g expo-cli eas-cli

# Login to Expo
expo login
```

### Build for Android (Play Store)

```bash
cd /apps/customer-mobile  # or delivery-mobile

# Configure app.json with your details
# Set package name: com.yourcompany.customerapp

# Build APK for testing
eas build -p android --profile preview

# Build AAB for Play Store
eas build -p android --profile production

# Submit to Play Store
eas submit -p android
```

### Build for iOS (App Store)

```bash
# Build for iOS
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios
```

### Configure app.json

```json
{
  "expo": {
    "name": "HyperServe Customer",
    "slug": "hyperserve-customer",
    "version": "1.0.0",
    "android": {
      "package": "com.hyperserve.customer",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.hyperserve.customer",
      "buildNumber": "1.0.0"
    }
  }
}
```

---

## 🔐 Environment Variables

### Web Apps (.env)

```bash
# Tenant Admin & Super Admin
VITE_API_URL=https://api.hyperserve.com
```

### Mobile Apps (.env)

```bash
# Customer & Delivery Mobile
API_URL=https://api.hyperserve.com
```

---

## 📋 Pre-deployment Checklist

### For Web Apps:
- [ ] Update `.env` with production API URL
- [ ] Run `yarn build` to test build
- [ ] Test built app locally: `yarn preview`
- [ ] Update app name/branding
- [ ] Set up domain/subdomain

### For Mobile Apps:
- [ ] Update `app.json` with app details
- [ ] Set unique package names
- [ ] Add app icons (1024x1024 PNG)
- [ ] Add splash screens
- [ ] Configure API URL
- [ ] Test on real devices
- [ ] Create Play Store/App Store accounts
- [ ] Prepare store listings (descriptions, screenshots)
- [ ] Set up privacy policy URL

---

## 🚀 Quick Deploy Commands

### Tenant Admin Web
```bash
cd /apps/tenant-admin-web
yarn build
# Upload dist/ folder to your host
```

### Super Admin Web
```bash
cd /apps/super-admin-web
yarn build
# Upload dist/ folder to your host
```

### Customer Mobile (Android)
```bash
cd /apps/customer-mobile
eas build -p android --profile production
# Download AAB and upload to Play Console
```

### Delivery Mobile (Android)
```bash
cd /apps/delivery-mobile
eas build -p android --profile production
# Download AAB and upload to Play Console
```

---

## 🔗 Useful Links

- Vercel: https://vercel.com
- Netlify: https://netlify.com  
- Expo EAS: https://expo.dev/eas
- Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com

---

## 📞 Support

For deployment issues, contact your backend team or refer to platform documentation.
