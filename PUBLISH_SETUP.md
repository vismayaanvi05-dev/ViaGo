# 🚀 One-Click Play Store Publishing Setup

## What This Does
This script provides **the closest thing to Emergent's deployment button** for Play Store publishing. It automates:
- ✅ Building production AABs
- ✅ Submitting to Play Store (with credentials)
- ✅ Status tracking
- ✅ Everything in one command

---

## Quick Start

### Option 1: Manual Upload (Easiest - Start Here)
No setup needed! Just build and manually upload:

```bash
bash /app/publish_to_playstore.sh
# Choose option 6 (Both Apps - Manual Upload)
```

**Process:**
1. Script builds AABs (15-20 mins)
2. Downloads AAB files from provided URLs
3. Manually upload to Play Console

**Time**: 20 mins build + 5 mins manual upload

---

### Option 2: Automated Submission (Advanced)
**One-time setup** enables fully automated publishing:

```bash
bash /app/publish_to_playstore.sh
# Choose option 7 (Setup credentials)
```

Follow the guided setup, then:

```bash
bash /app/publish_to_playstore.sh
# Choose option 3 (Both Apps - Auto-Submit)
```

**Process:**
1. Script builds AABs (15-20 mins)
2. Automatically submits to Play Store
3. Creates draft release in Play Console
4. You just review and publish

**Time**: 20 mins fully automated + 2 mins review

---

## Credential Setup (For Auto-Submit)

### Step 1: Create Service Account (5 mins)

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com
   - Create new project: "HyperServe Mobile"

2. **Enable API**:
   - Search: "Google Play Android Developer API"
   - Click "Enable"

3. **Create Service Account**:
   - IAM & Admin → Service Accounts
   - Click "Create Service Account"
   - Name: "hyperserve-publisher"
   - Role: "Service Account User"
   - Click "Create Key" → JSON
   - Download the JSON file

### Step 2: Link to Play Console (3 mins)

1. **Go to Play Console**:
   - https://play.google.com/console
   - Settings → API Access

2. **Link Service Account**:
   - Click "Link" next to your service account
   - Grant access to apps
   - Set permissions: "Release manager"

### Step 3: Save Credentials (1 min)

```bash
bash /app/publish_to_playstore.sh
# Choose option 7
# Provide path to downloaded JSON file
```

**Done!** Now you have one-click publishing.

---

## Publishing Workflows

### Workflow 1: First-Time Publishing

```bash
# 1. Build and test APK first
bash /app/build_play_store.sh
# Choose option 3 (APK for testing)

# 2. Test on device (scan QR, install, test)

# 3. Create Play Console apps (manual - one time)
# - https://play.google.com/console
# - Fill store listings, upload screenshots

# 4. Build production AAB
bash /app/publish_to_playstore.sh
# Choose option 6 (manual) or 3 (auto)

# 5. Upload to Play Console (if manual)
# 6. Submit for review
```

**Timeline**: First submission takes 7-14 days for Google review

---

### Workflow 2: Publishing Updates

```bash
# Update version in app.json files first:
# "version": "1.0.1"
# "versionCode": 2

# Then publish:
bash /app/publish_to_playstore.sh
# Choose option 3 (auto) or 6 (manual)
```

**Timeline**: Updates reviewed in 1-3 days

---

## Command Reference

### Main Publishing Script:
```bash
bash /app/publish_to_playstore.sh
```

**Options:**
- `1-3`: Auto-submit (requires credentials)
- `4-6`: Manual upload (no setup needed)
- `7`: Setup credentials
- `8`: Check status
- `9`: View requirements

### Direct EAS Commands:

**Build + Auto-Submit:**
```bash
cd /app/mobile-app
eas build --platform android --profile production
eas submit --platform android --latest
```

**Check Status:**
```bash
eas build:list      # Recent builds
eas submit:list     # Recent submissions
```

---

## Comparison to Emergent Deployment

| Feature | Emergent Deploy | This Script |
|---------|----------------|-------------|
| One-click button | ✅ Yes (UI button) | ✅ Yes (terminal command) |
| Automatic build | ✅ Yes | ✅ Yes |
| Automatic deployment | ✅ Yes | ✅ Yes (with setup) |
| Manual option | ❌ No | ✅ Yes |
| Setup required | ❌ No | ⚠️ One-time (optional) |
| Platform | Web apps | Mobile apps |

---

## Cost

| Item | Cost | Frequency |
|------|------|-----------|
| Google Play Developer | $25 | One-time |
| Expo Free Tier | $0 | Forever |
| EAS Build (30/month) | $0 | Monthly |
| Service Account | $0 | Free |

**Total**: $25 USD (one-time)

---

## Troubleshooting

### "No credentials found"
- Use option 7 to set up
- Or use manual upload (options 4-6)

### "Service account not linked"
- Go to Play Console → API Access
- Link your service account

### "Build failed"
```bash
# Clear cache and retry
eas build --platform android --profile production --clear-cache
```

### "Submit failed"
- Check Play Console for errors
- Ensure store listing is complete
- Verify service account has permissions

---

## Next Steps

**Choose your path:**

### Path A: Quick & Manual (Recommended for first time)
```bash
bash /app/publish_to_playstore.sh
# Option 6 → Manual upload
```

### Path B: Fully Automated (After you're comfortable)
```bash
bash /app/publish_to_playstore.sh
# Option 7 → Setup credentials
# Option 3 → Auto-publish both apps
```

---

## Support

**EAS Documentation:**
- Build: https://docs.expo.dev/build/introduction/
- Submit: https://docs.expo.dev/submit/introduction/

**Google Play:**
- Console: https://play.google.com/console
- Service Account Guide: https://github.com/expo/fyi/blob/main/creating-google-service-account.md

**Emergent Support:**
If you'd like Emergent to add a native "Publish to Play Store" button, contact support to share your feedback!

---

**Ready?** Run: `bash /app/publish_to_playstore.sh`
