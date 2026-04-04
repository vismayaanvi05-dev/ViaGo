# 🧪 Customer Mobile App - Complete Testing Guide

## 🚀 Quick Start (Fastest Way)

### **Option 1: Test on Your Physical Phone (Recommended)**

#### Step 1: Install Expo Go App
- **iOS**: Download "Expo Go" from App Store
- **Android**: Download "Expo Go" from Play Store

#### Step 2: Start the Mobile App
```bash
cd /app/mobile-app
yarn start
```

This will:
- Start the Metro bundler
- Display a QR code in terminal
- Open Expo DevTools in browser

#### Step 3: Scan QR Code
- **iOS**: Open Camera app → Point at QR code → Tap notification
- **Android**: Open Expo Go app → Tap "Scan QR Code" → Scan

#### Step 4: Wait for App to Load
- First load takes 30-60 seconds
- App will refresh automatically

---

### **Option 2: Test on Android Emulator**

#### Prerequisites
- Android Studio installed
- Android emulator set up

#### Steps
```bash
cd /app/mobile-app
yarn start
# Press 'a' when Metro bundler starts
```

---

### **Option 3: Test on iOS Simulator (Mac Only)**

#### Prerequisites
- Xcode installed
- iOS simulator set up

#### Steps
```bash
cd /app/mobile-app
yarn start
# Press 'i' when Metro bundler starts
```

---

## 📱 Complete Test Flow

### **1. Location Detection**

**What to expect:**
- First screen after splash
- "Enable Location" heading
- Two buttons: "Detect My Location" and "Enter Location Manually"

**How to test:**
1. Click "Detect My Location" → Should request GPS permission
2. OR click "Enter Location Manually" → Sets default to Bangalore

**✅ Success criteria:**
- Location detected successfully
- Moves to OTP Login screen

---

### **2. OTP Login Flow**

**What to expect:**
- 3-step authentication process

**Step 1: Phone Number**
- Enter 10-digit phone number
- Example: `9876543210`
- Click "Send OTP"

**Step 2: Verify OTP**
- **IMPORTANT**: OTP is mocked for testing
- Check backend logs to see the generated OTP:
```bash
tail -50 /var/log/supervisor/backend.out.log | grep -i otp
```
- OR use default test OTP: `123456`
- Enter OTP and click "Verify OTP"

**Step 3: Name (for new users)**
- If first time login, enter your name
- Click "Continue"

**✅ Success criteria:**
- Login successful
- Redirected to Home screen

---

### **3. Home Screen**

**What to expect:**
- Location display in header
- Search bar
- **Module Selector**: Food 🍔 / Grocery 🛒 / Laundry 🧺
- Store listing with distance, rating, delivery time

**How to test:**
1. **Switch modules**: Tap Food, Grocery, or Laundry buttons
2. **View stores**: Scroll through store list
3. **Pull to refresh**: Drag down to refresh stores
4. **Search**: Tap search bar → navigates to search screen

**✅ Success criteria:**
- Stores load based on selected module
- Distance calculated correctly
- Can switch between modules

---

### **4. Search**

**What to expect:**
- Search input at top
- Results appear as you type
- Shows both stores and items

**How to test:**
1. Type "pizza" or any item name
2. See search results (stores + items)
3. Tap any result → navigates to store details

**✅ Success criteria:**
- Search results appear in real-time
- Both stores and items shown
- Tapping result opens store

---

### **5. Store Details**

**What to expect:**
- Store logo, name, description
- Menu categories (for food)
- Items with prices
- "Add" button for each item

**How to test:**
1. View store information
2. Scroll through menu categories
3. Click "Add" on any item

**⚠️ Important: One Cart Per Store Rule**
- If cart has items from Store A
- And you try to add from Store B
- Alert appears: "Clear cart to continue?"
- Choose "Clear Cart" or "Cancel"

**✅ Success criteria:**
- Store details load correctly
- Can add items to cart
- One-store rule enforced

---

### **6. Cart**

**What to expect:**
- List of items in cart
- Quantity controls (+ / -)
- Store name at top
- Bill summary at bottom
- "Proceed to Checkout" button

**How to test:**
1. View cart items
2. **Increase quantity**: Tap "+" button
3. **Decrease quantity**: Tap "-" button (shows remove dialog at 0)
4. **Clear cart**: Tap "Clear Cart" button
5. Click "Proceed to Checkout"

**✅ Success criteria:**
- Quantity updates correctly
- Total price recalculates
- Can proceed to checkout

---

### **7. Checkout**

**What to expect:**
- Delivery address section
- Payment method selection
- Special instructions (optional)
- Bill summary
- "Place Order" button

**How to test:**

**Issue: No addresses saved yet**
You need to create an address via API first:

```bash
# Get auth token first (login via API)
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# Login
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"9876543210","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token', ''))")

# Create address
curl -X POST "$API_URL/api/customer/addresses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address_type": "home",
    "address_line": "123 Main Street",
    "landmark": "Near Park",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "lat": 12.9716,
    "lng": 77.5946,
    "is_default": true
  }'
```

After creating address:
1. Select delivery address (radio button)
2. Select payment method (COD by default)
3. Add special instructions (optional)
4. Click "Place Order"

**✅ Success criteria:**
- Order placed successfully
- Alert shows order number
- Option to track order

---

### **8. Order Tracking**

**What to expect:**
- Order number and store name
- **Visual timeline** with status progression:
  - ✅ Order Placed
  - 📝 Confirmed
  - 🍳 Preparing
  - ✅ Ready
  - 🚚 Out for Delivery
  - 🎉 Delivered
- Order items list
- Delivery address
- Bill summary

**How to test:**
1. View order details
2. **Pull to refresh** → Updates order status
3. Status auto-refreshes every 10 seconds

**✅ Success criteria:**
- Timeline shows current status highlighted
- Order details displayed correctly
- Auto-refresh working

---

### **9. Orders List**

**What to expect:**
- List of all past orders
- Each order shows:
  - Order number
  - Store name with module icon
  - Status badge (colored)
  - Items count and total amount
  - Date

**How to test:**
1. Navigate to "Orders" tab (bottom navigation)
2. View order history
3. **Pull to refresh** to update
4. Tap any order → Opens tracking screen

**✅ Success criteria:**
- All orders listed
- Status colors correct
- Can view order details

---

### **10. Profile**

**What to expect:**
- User avatar with initial
- Name, phone, email
- Stats (Orders, Addresses, Reviews)
- Menu items (Manage Addresses, Notifications, etc.)
- Logout button

**How to test:**
1. Navigate to "Profile" tab
2. View user information
3. Click "Logout"
4. Confirm logout → Redirects to login

**✅ Success criteria:**
- Profile info displayed
- Logout works
- Redirected to login after logout

---

## 🧪 Test Scenarios

### **Scenario 1: New User First Order**

1. Open app → Location detection
2. Login with new phone number
3. Enter name
4. Select Food module
5. Browse stores
6. Open any store
7. Add items to cart
8. Create address (via API first)
9. Checkout → Place order
10. Track order in Orders tab

**Expected Result**: Complete order flow works end-to-end

---

### **Scenario 2: Multiple Store Conflict**

1. Login
2. Add items from Store A
3. Go back to home
4. Open Store B
5. Try to add item
6. **Alert appears**: "Clear cart to continue?"
7. Choose "Clear Cart"
8. Item added from Store B

**Expected Result**: One cart per store rule enforced

---

### **Scenario 3: Module Switching**

1. Login
2. Select Food → See food stores
3. Select Grocery → See grocery stores
4. Select Laundry → See laundry stores

**Expected Result**: Stores change based on module

---

## 🐛 Troubleshooting

### **Issue: "Cannot connect to server"**

**Solution:**
```bash
# Check if backend is running
curl https://hyperserve-food-mvp.preview.emergentagent.com/api/customer/config
```

If backend down, restart:
```bash
sudo supervisorctl restart backend
```

---

### **Issue: OTP not working**

**Solution:**
Check backend logs for OTP:
```bash
tail -50 /var/log/supervisor/backend.out.log | grep -i otp
```

Or use test OTP: `123456`

---

### **Issue: No stores showing**

**Possible causes:**
1. No stores in database for that module
2. All stores are inactive
3. Location not set correctly

**Solution:**
Check database:
```bash
# Login to mongo
mongosh

# Check stores
db.stores.find({is_active: true, is_accepting_orders: true}).pretty()
```

---

### **Issue: "Module not found" errors**

**Solution:**
```bash
cd /app/mobile-app
rm -rf node_modules
yarn install
yarn start --clear
```

---

### **Issue: App not loading after QR scan**

**Solution:**
1. Make sure phone and computer are on same network
2. Check if port 19000/19001 are open
3. Try running `yarn start --tunnel`

---

## 📊 Test Checklist

### **Basic Flow**
- [ ] App launches successfully
- [ ] Location detection works
- [ ] OTP login works
- [ ] Home screen loads
- [ ] Can see stores

### **Shopping Flow**
- [ ] Can switch modules
- [ ] Can open store details
- [ ] Can add items to cart
- [ ] Cart shows correct totals
- [ ] One-store rule works

### **Checkout Flow**
- [ ] Can select address
- [ ] Can select payment method
- [ ] Can place order
- [ ] Order confirmation shown

### **Post-Order**
- [ ] Order appears in history
- [ ] Can track order
- [ ] Status updates work
- [ ] Timeline visible

### **Profile**
- [ ] Profile info correct
- [ ] Logout works
- [ ] Can login again

---

## 🎥 Video Testing Tips

1. **Record your test**: Use screen recording to capture issues
2. **Test on multiple devices**: iOS and Android
3. **Test different screen sizes**: Small and large phones
4. **Test in different networks**: WiFi and mobile data

---

## 📱 Expected Behavior Summary

| Screen | Expected Behavior |
|--------|-------------------|
| Splash | Shows for 2-3 seconds |
| Location | GPS or manual selection |
| Login | 3-step OTP flow |
| Home | Module selector + stores |
| Search | Real-time results |
| Store Details | Dynamic based on module |
| Cart | One store rule enforced |
| Checkout | Address + payment selection |
| Orders | Order history with status |
| Tracking | Real-time timeline |
| Profile | User info + logout |

---

## ✅ Success Criteria

Your customer app is working correctly if:

1. ✅ Can login with OTP
2. ✅ Can browse stores by module
3. ✅ Can add items to cart
4. ✅ One cart per store rule works
5. ✅ Can place order
6. ✅ Can track order
7. ✅ Order history shows correctly
8. ✅ Can logout and login again

---

## 🚀 Ready to Test!

Start testing now:
```bash
cd /app/mobile-app
yarn start
```

Then scan QR code with Expo Go app! 📱✨
