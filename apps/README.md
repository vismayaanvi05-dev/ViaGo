# HyperServe - Multi-Application Architecture

This directory contains 4 separate applications for the HyperServe platform:

## 📱 Mobile Applications (React Native - Expo)

### 1. Customer Mobile App (`customer-mobile/`)
- Food ordering application for customers
- Play Store ready
- Features: Browse restaurants, order food, track delivery

### 2. Delivery Partner Mobile App (`delivery-mobile/`)
- Delivery partner application
- Play Store ready
- Features: Accept orders, navigate, update delivery status

## 🖥️ Web Applications (React)

### 3. Tenant Admin Web Portal (`tenant-admin-web/`)
- Restaurant owner/vendor management portal
- Features: Menu management, order management, settings, reports

### 4. Super Admin Web Portal (`super-admin-web/`)
- Platform administration portal
- Features: Tenant management, subscription plans, analytics

## 🔗 Shared Backend
All applications connect to the same FastAPI backend at `/app/backend`

## 📦 Individual GitHub Repositories
Each application is designed to be uploaded as a separate GitHub repository with its own:
- package.json
- README.md
- .env.example
- Complete source code

## 🚀 Getting Started
Refer to individual README files in each application directory.
