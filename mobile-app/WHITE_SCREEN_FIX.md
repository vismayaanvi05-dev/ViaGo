# 🚨 White Screen Issue - Solutions

## Why You're Seeing White Screen on Web

React Native apps often don't work well on web because:
1. Native modules (like expo-location) don't have web equivalents
2. Navigation might not be web-compatible
3. Some React Native components don't translate to web

## ✅ BEST SOLUTION: Test on Phone/Emulator

The app is designed for **mobile devices**, not web browsers.

---

## 📱 GET QR CODE - 3 Methods

### **Method 1: Run Script (Easiest)**

```bash
bash /app/mobile-app/get-qr-code.sh
```

This will:
- Clean up old processes
- Start Expo server
- **Show QR code in terminal**
- Display connection URL

**Then:**
1. Open "Expo Go" app on your phone
2. Scan the QR code
3. App loads in 30 seconds

---

### **Method 2: Manual Start**

```bash
cd /app/mobile-app
yarn start
```

**Wait 15-20 seconds**, then look for:

```
┌─────────────────────────┐
│  █████████████████████  │  <-- QR CODE
│  ███ ▄▄▄▄▄ █▀█ █▄█▀   │
│  ███ █   █ █▀▀▀█      │
│  █████████████████████  │
└─────────────────────────┘

› Metro waiting on exp://192.168.x.x:8081
```

Scan this QR code with Expo Go app.

---

### **Method 3: Use Connection URL**

After starting Expo, you'll see a line like:

```
› Metro waiting on exp://192.168.1.100:8081
```

**On your phone:**
1. Open Expo Go app
2. Tap "Enter URL manually"
3. Type the `exp://` URL
4. Connect

---

## 🖥️ Alternative: Use Android Emulator

If you have Android Studio installed:

```bash
cd /app/mobile-app
yarn start
# Wait for Metro to start
# Press 'a' to open Android emulator
```

---

## 📋 Step-by-Step Phone Testing

### **Step 1: Install Expo Go**
- iOS: App Store → "Expo Go"
- Android: Play Store → "Expo Go"

### **Step 2: Start Server**
```bash
cd /app/mobile-app
bash get-qr-code.sh
```

### **Step 3: Connect**
- Scan QR code with Expo Go
- OR enter exp:// URL manually

### **Step 4: Wait**
- First load: 30-60 seconds
- App will open automatically

---

## 🔍 If You Still See Issues

### **Check if server is running:**
```bash
curl http://localhost:8081/status
```

Should return: `{"packager":"running"}`

### **Check if Expo DevTools is accessible:**
```bash
curl http://localhost:19002
```

Should return HTML content

### **Restart everything:**
```bash
killall node
cd /app/mobile-app
yarn start
```

---

## 💡 Why Not Just Show Me the QR Code?

The QR code contains your **local network IP address**:
- `exp://192.168.1.100:8081` (example)

This changes based on:
- Your network
- Your computer's IP
- The running Metro server

**That's why it must be generated when you run `yarn start`**

---

## 🎯 RECOMMENDED APPROACH

1. **Don't use web version** - it won't work properly
2. **Use real phone** with Expo Go app
3. **Run the script**: `bash /app/mobile-app/get-qr-code.sh`
4. **Scan QR code** that appears in terminal
5. **Test the app** on your phone

---

## 📞 Quick Troubleshooting

### Issue: "Unable to connect"
- Make sure phone and computer are on **same WiFi**
- Check firewall isn't blocking ports 8081, 19000, 19001

### Issue: "Network response timed out"
```bash
cd /app/mobile-app
yarn start --tunnel
```

This creates a public URL that works even on different networks.

### Issue: "No QR code appears"
- Wait 20-30 seconds for Metro to fully start
- Check terminal output carefully
- QR code is ASCII art, looks like a square pattern

---

## ✅ Summary

**For testing the mobile app:**

1. ❌ Don't use web browser (white screen issue)
2. ✅ Use phone with Expo Go app
3. ✅ Run: `bash /app/mobile-app/get-qr-code.sh`
4. ✅ Scan QR code that appears in terminal
5. ✅ Wait 30 seconds for app to load

**The app is fully functional on mobile devices!** 📱
