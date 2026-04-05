# 📱 HyperServe - Play Store Publishing Guide

## Overview
This guide will help you publish both mobile apps to Google Play Store:
- **Customer App**: HyperServe (com.hyperserve.customer)
- **Delivery Partner App**: HyperServe Delivery (com.hyperserve.delivery)

---

## Prerequisites

### 1. Google Play Developer Account
- **Cost**: $25 USD (one-time fee)
- **Sign up**: https://play.google.com/console/signup
- **Verification**: Takes 24-48 hours

### 2. Expo Account
- **Free tier available**: https://expo.dev/signup
- **Login**: Run `eas login` in terminal

### 3. Required Assets (Per App)

#### App Icons:
- ✅ Already created (SVG placeholders)
- 🔄 **TODO**: Replace with professional PNG icons (1024x1024)

#### Screenshots (Required):
- **Minimum**: 2 screenshots per app
- **Recommended**: 4-8 screenshots
- **Dimensions**: 
  - Phone: 1080 x 1920 or 1080 x 2340
  - Tablet: 1920 x 1080 or 2560 x 1440
- **Format**: PNG or JPEG (max 8MB each)

#### Feature Graphic (Required):
- **Dimensions**: 1024 x 500 pixels
- **Format**: PNG or JPEG
- **Purpose**: Displayed at top of store listing

#### Privacy Policy (Required):
- **URL**: Must host your privacy policy online
- **Content**: Explain what data you collect and how it's used
- **Template**: https://www.privacypolicygenerator.info/

---

## Step 1: Build the Apps

### Quick Start:
```bash
bash /app/build_play_store.sh
```

### Manual Build Commands:

#### For Testing (APK):
```bash
# Customer App APK
cd /app/mobile-app
eas build --platform android --profile preview

# Delivery App APK
cd /app/delivery-app
eas build --platform android --profile preview
```

#### For Play Store (AAB):
```bash
# Customer App AAB
cd /app/mobile-app
eas build --platform android --profile production

# Delivery App AAB
cd /app/delivery-app
eas build --platform android --profile production
```

### Build Process:
1. **Initialize EAS** (first time only):
   ```bash
   cd /app/mobile-app && eas init
   cd /app/delivery-app && eas init
   ```

2. **Start Build**:
   - Builds run on EAS cloud servers
   - Takes 10-20 minutes per app
   - No local resources needed

3. **Monitor Build**:
   ```bash
   eas build:list
   ```

4. **Download Builds**:
   - EAS provides QR code and download URL
   - APK: Test on device directly
   - AAB: Upload to Play Store

---

## Step 2: Prepare Store Listings

### Customer App Store Listing:

**App Title** (max 50 chars):
```
HyperServe - Food & Grocery Delivery
```

**Short Description** (max 80 chars):
```
Order food, groceries & laundry. Fast hyperlocal delivery to your doorstep.
```

**Full Description** (max 4000 chars):
```
🛒 HyperServe - Your All-in-One Hyperlocal Delivery App

Order everything you need from local stores and get it delivered fast!

🍔 FOOD DELIVERY
Browse restaurants near you, order your favorite meals, and track delivery in real-time.

🛒 GROCERY SHOPPING  
Get fresh groceries from nearby stores delivered to your doorstep within minutes.

🧺 LAUNDRY SERVICE
Schedule pickup and delivery for your laundry - convenient and hassle-free.

✨ KEY FEATURES:
• Real-time order tracking
• Multiple payment options
• Browse by category (Food, Grocery, Laundry)
• Save favorite stores
• Order history
• Push notifications for order updates
• Secure email authentication

📍 HYPERLOCAL FOCUS:
We connect you with stores in your neighborhood for the fastest delivery times.

🔒 SAFE & SECURE:
- Email OTP authentication
- Secure payment processing
- Privacy-first approach

Download HyperServe now and experience the future of local delivery!
```

**App Category**:
- Primary: **Shopping**
- Secondary: **Food & Drink**

**Contact Info**:
- Email: your-support-email@example.com
- Website: your-website.com
- Privacy Policy URL: (required)

---

### Delivery Partner App Store Listing:

**App Title** (max 50 chars):
```
HyperServe Delivery Partner
```

**Short Description** (max 80 chars):
```
Earn by delivering food, groceries & more. Flexible hours, instant payouts.
```

**Full Description** (max 4000 chars):
```
🚚 HyperServe Delivery Partner - Start Earning Today!

Join our network of delivery partners and earn money on your schedule.

💰 EARN MORE:
• Competitive delivery fees
• Bonus opportunities
• Instant payout options
• Track your earnings in real-time

⏰ FLEXIBLE SCHEDULE:
• Work when you want
• Choose your delivery area
• Accept or decline orders

📱 EASY TO USE:
• Simple order acceptance
• Built-in navigation
• In-app support
• Real-time order updates

📊 TRACK PERFORMANCE:
• Daily/weekly/monthly earnings
• Delivery statistics
• Customer ratings
• Performance insights

🔒 SECURE & RELIABLE:
• Email OTP authentication
• Secure payment system
• 24/7 support

REQUIREMENTS:
• Valid ID
• Smartphone with internet
• Bike/scooter/car for delivery
• Must be 18 years or older

Download now and start your delivery partner journey with HyperServe!
```

**App Category**:
- Primary: **Business**
- Secondary: **Productivity**

---

## Step 3: Create App in Play Console

### For Each App (Customer & Delivery):

1. **Go to Play Console**: https://play.google.com/console

2. **Create App**:
   - Click "Create app"
   - App name: (from listings above)
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

3. **Fill Required Sections**:

   #### App Access:
   - [ ] All functionality available without restrictions
   - [ ] OR list restricted features

   #### Ads:
   - [ ] No ads
   - [ ] OR contains ads

   #### Content Rating:
   - Fill questionnaire (takes 5 minutes)
   - Customer App likely: Everyone
   - Delivery App likely: Teen+

   #### Target Audience:
   - Customer App: 18+
   - Delivery App: 18+

   #### News App:
   - [ ] No, not a news app

   #### COVID-19 Tracing/Status:
   - [ ] No

   #### Data Safety:
   - List what data you collect:
     * Email address
     * Location (for delivery)
     * Order history
   - Explain how it's used and secured

   #### Government Apps:
   - [ ] No

4. **Store Listing**:
   - App name
   - Short description
   - Full description
   - App icon (512x512 PNG)
   - Feature graphic (1024x500)
   - Screenshots (minimum 2)
   - Category
   - Contact details
   - Privacy policy URL

5. **Upload AAB**:
   - Go to "Production" → "Create new release"
   - Upload your AAB file
   - Add release notes (what's new)
   - Review and rollout

---

## Step 4: Testing Before Submission

### Internal Testing:
```bash
# Build preview APK
bash /app/build_play_store.sh
# Choose option 3 (Both Apps - APK)
```

### Test Checklist:
- [ ] App installs successfully
- [ ] Email OTP login works
- [ ] All screens load correctly
- [ ] Location permissions work
- [ ] Orders can be placed (Customer App)
- [ ] Orders can be accepted (Delivery App)
- [ ] No crashes or errors
- [ ] Back button works correctly
- [ ] App can be backgrounded and resumed

---

## Step 5: Submit for Review

### Review Timeline:
- **Initial review**: 7-14 days
- **Updates**: 1-3 days (after first approval)

### Common Rejection Reasons:
1. **Missing privacy policy**
   - Solution: Host privacy policy and add URL

2. **Incomplete store listing**
   - Solution: Fill all required fields

3. **Insufficient screenshots**
   - Solution: Provide 4-8 screenshots showing key features

4. **Icon quality issues**
   - Solution: Use high-quality 1024x1024 PNG icons

5. **App crashes**
   - Solution: Test thoroughly before submission

---

## Build Profiles Explained

### Preview (APK):
- **Use case**: Testing, beta distribution
- **Build time**: 10-15 minutes
- **Output**: APK file (installable directly)
- **Signing**: Temporary certificate

### Production (AAB):
- **Use case**: Play Store submission
- **Build time**: 15-20 minutes
- **Output**: AAB (Android App Bundle)
- **Signing**: Google manages signing keys
- **Benefits**: 
  - Smaller download size
  - Device-optimized APKs
  - Required by Play Store

---

## Post-Submission

### After Approval:
1. **Staged Rollout**:
   - Start with 10% → 25% → 50% → 100%
   - Monitor crash reports

2. **Monitor**:
   - Play Console dashboard
   - User reviews
   - Crash analytics

3. **Updates**:
   - Increment `versionCode` in app.json
   - Build new AAB
   - Upload as update

---

## Useful Commands

```bash
# Login to Expo
eas login

# Check build status
eas build:list

# View specific build
eas build:view [BUILD_ID]

# Cancel a build
eas build:cancel [BUILD_ID]

# Configure project
eas build:configure

# Submit to Play Store (after initial setup)
eas submit --platform android
```

---

## Support & Resources

- **Expo EAS Docs**: https://docs.expo.dev/build/introduction/
- **Play Console Help**: https://support.google.com/googleplay/android-developer/
- **Play Store Guidelines**: https://play.google.com/about/developer-content-policy/

---

## Troubleshooting

### Build Fails:
```bash
# Clear cache and rebuild
cd /app/mobile-app
rm -rf node_modules
yarn install
eas build --platform android --profile preview --clear-cache
```

### "No space left on device":
- This error is from EAS servers, just retry

### "Gradle build failed":
- Check app.json for errors
- Verify package name is unique
- Check EAS build logs for details

---

## Cost Summary

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer Account | $25 | One-time |
| Expo Free Tier | $0 | Forever |
| EAS Build (first 30 builds/month) | $0 | Monthly |

**Total to start**: $25 USD

---

## Next Steps

1. ✅ Run `bash /app/build_play_store.sh`
2. ✅ Test APKs on device
3. ✅ Create Play Console account
4. ✅ Prepare screenshots and assets
5. ✅ Create privacy policy
6. ✅ Fill store listings
7. ✅ Upload AABs
8. ✅ Submit for review

Good luck with your Play Store submission! 🚀
