# HyperServe - Super Admin Portal

## 🔐 Platform Management Dashboard

Standalone web application for platform administrators to manage the entire HyperServe SaaS ecosystem.

## ✨ Features

- **Dashboard** - Platform-wide analytics and metrics
- **Tenant Management** - Create, manage, and monitor all tenants
- **Subscription Plans** - Configure pricing models (Subscription, Commission, Hybrid)
- **Tenant Subscriptions** - Assign and manage tenant subscriptions
- **Analytics** - Revenue tracking, order statistics, tenant performance
- **Payouts** - Manage vendor payouts (coming soon)

## 🚀 Getting Started

```bash
yarn install
cp .env.example .env
# Update .env with backend API URL
yarn dev
```

## 🔐 Authentication

- OTP-based phone authentication
- Role: `super_admin`
- Test Phone: 9999999999

## 📦 Deployment

```bash
yarn build
# Deploy dist/ to Vercel/Netlify
```
