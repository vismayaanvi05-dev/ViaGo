# 📱 HyperServe Mobile Apps - APK Build Guide

## 🎯 Overview

This guide explains how to build production-ready APK files for both Customer and Delivery Partner mobile applications.

---

## 📦 **Build Options**

### **Option 1: EAS Build (Recommended) ☁️**
- Cloud-based build service by Expo
- Requires Expo account (free)
- Builds APK in cloud (10-30 mins)
- Professional, production-ready APKs

### **Option 2: Local Build 🖥️**
- Build APK locally using Expo
- Faster but requires more setup
- Needs Android SDK installed

---

## 🚀 **Option 1: EAS Build (Cloud)**

### **Prerequisites:**
1. **Expo Account** - Sign up at https://expo.dev
2. **EAS CLI** - Already installed ✅
3. **Login to EAS**

### **Step 1: Login to EAS**
```bash
eas login
# Enter your Expo username and password
```

### **Step 2: Configure Projects**
```bash
# Customer App
cd /app/mobile-app
eas build:configure

# Delivery Partner App
cd /app/delivery-app
eas build:configure
```

### **Step 3: Build Customer App APK**
```bash
cd /app/mobile-app
eas build -p android --profile preview
```

**What happens:**
- Code is uploaded to Expo servers
- APK is built in the cloud
- Build takes ~10-20 minutes
- Download link provided when complete

### **Step 4: Build Delivery Partner App APK**
```bash
cd /app/delivery-app
eas build -p android --profile preview
```

### **Step 5: Download APKs**
- EAS will provide download links
- Or check: https://expo.dev/accounts/[your-username]/projects
- Download both APKs to your device

---

## 🖥️ **Option 2: Local APK Build**

### **Prerequisites:**
- Android SDK installed
- Java JDK 11+
- Expo CLI

### **Build Commands:**

#### **Customer App:**
```bash
cd /app/mobile-app
npx expo export --platform android
npx expo run:android --variant release
```

#### **Delivery Partner App:**
```bash
cd /app/delivery-app
npx expo export --platform android
npx expo run:android --variant release
```

**Note:** Local builds require Android Studio and emulator setup, which may not be available in all environments.

---

## ⚙️ **Configuration Files Created**

### **Customer App - `/app/mobile-app/eas.json`**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### **Delivery Partner App - `/app/delivery-app/eas.json`**
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 📋 **App Configuration Summary**

### **Customer App (`app.json`)**
- **App Name:** HyperServe
- **Package:** com.hyperserve.customer
- **Version:** 1.0.0
- **Permissions:** Location (Fine & Coarse)
- **Primary Color:** #8B5CF6 (Purple)

### **Delivery Partner App (`app.json`)**
- **App Name:** HyperServe Delivery
- **Package:** com.hyperserve.delivery
- **Version:** 1.0.0
- **Permissions:** Location (Fine & Coarse)
- **Primary Color:** #EC4899 (Pink)

---

## 🔑 **Important Notes**

### **1. API Configuration**
Both apps are configured to use:
```javascript
BASE_URL: 'https://hyperserve-food-mvp.preview.emergentagent.com/api'
```

**For Production:** Update this URL in:
- `/app/mobile-app/src/config/index.js`
- `/app/delivery-app/src/config/index.js`

### **2. App Icons & Splash Screens**
Default Expo assets are used. For production:
- Replace `/app/mobile-app/assets/icon.png` (1024x1024)
- Replace `/app/mobile-app/assets/splash.png` (1284x2778)
- Replace `/app/delivery-app/assets/icon.png` (1024x1024)
- Replace `/app/delivery-app/assets/splash.png` (1284x2778)

### **3. Build Profiles**
- **preview:** For testing, creates APK for internal distribution
- **production:** For Play Store submission, creates AAB by default

### **4. OTP Configuration**
Currently OTP is **MOCKED** for testing. For production:
- Integrate real SMS gateway (Twilio, Firebase, etc.)
- Update `/app/backend/routes/auth.py`

---

## 📥 **Expected Build Output**

### **Customer App APK:**
- File: `hyperserve-customer-[hash].apk`
- Size: ~50-80 MB
- Screens: 11
- Features: Store browsing, Cart, Checkout, Tracking

### **Delivery Partner App APK:**
- File: `hyperserve-delivery-[hash].apk`
- Size: ~40-60 MB
- Screens: 9
- Features: Available deliveries, Accept/Reject, Tracking, Earnings

---

## 🧪 **Testing APKs**

### **Installation:**
1. Download APK to Android device
2. Enable "Install from Unknown Sources" in Settings
3. Tap APK file to install
4. Grant Location permissions when prompted

### **Test Flow:**

#### **Customer App:**
1. Open app → Allow location
2. Login with phone: +919876543210
3. Browse stores by module
4. Add items to cart
5. Checkout with address
6. Track order

#### **Delivery Partner App:**
1. Open app → Allow location
2. Login with phone: +919876543211
3. View available deliveries
4. Accept delivery
5. Update status (Picked Up → Out for Delivery → Delivered)
6. Check earnings

---

## 🚨 **Troubleshooting**

### **"Build Failed" Error:**
- Check `eas.json` configuration
- Ensure app.json has valid package names
- Verify Expo account has build credits

### **"Module Not Found" Error:**
- Run `yarn install` in app directory
- Ensure all dependencies in package.json

### **APK Won't Install:**
- Check Android version (minimum Android 5.0)
- Ensure "Install from Unknown Sources" is enabled
- Try clearing app data if updating

---

## 🎯 **Quick Start (Recommended)**

**For fastest APK creation, use EAS Build:**

```bash
# 1. Login to Expo
eas login

# 2. Build Customer App
cd /app/mobile-app && eas build -p android --profile preview

# 3. Build Delivery Partner App
cd /app/delivery-app && eas build -p android --profile preview

# 4. Wait for builds to complete (~20 mins each)
# 5. Download APKs from provided links
# 6. Install on Android device and test!
```

---

## 📊 **Build Status**

- ✅ EAS CLI Installed (v18.5.0)
- ✅ eas.json created for both apps
- ✅ app.json configured with proper package names
- ✅ All dependencies installed
- ✅ Code linted and error-free
- ⏳ Ready to build APKs!

---

## 🔗 **Useful Links**

- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Expo Account:** https://expo.dev/accounts
- **Build Dashboard:** https://expo.dev/builds
- **Troubleshooting:** https://docs.expo.dev/build-reference/troubleshooting/

---

## ✨ **Summary**

Both mobile apps are **fully configured and ready for APK generation**. 

**Recommended approach:**
1. Use EAS Build (cloud) for hassle-free APK creation
2. Sign up for free Expo account
3. Run `eas build` commands
4. Download and install APKs
5. Test on real Android devices

**Total build time:** ~40 minutes (20 mins per app)

**Result:** Two production-ready APKs for Customer and Delivery Partner applications! 🎉
