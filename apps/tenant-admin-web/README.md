# HyperServe - Tenant Admin Portal

## 🍽️ Restaurant/Vendor Management Portal

Standalone web application for restaurant owners and vendors to manage their food delivery operations.

## ✨ Features

- **Dashboard** - Sales overview, order statistics, revenue tracking
- **Settings Management**
  - Delivery charge configuration (flat/distance-based)
  - Tax settings
  - Default admin markup percentage
- **Store Management** - Restaurant profile, timings, location
- **Menu Builder**
  - Categories, items, variants, add-ons
  - **Item-level admin markup** (profit margin per item)
- **Order Management** - View orders, update status, track deliveries
- **Reports** - Sales reports, financial analytics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Yarn or npm

### Installation

```bash
# Install dependencies
yarn install

# Copy environment variables
cp .env.example .env

# Update .env with your backend API URL
VITE_API_URL=https://your-backend-api.com

# Start development server
yarn dev
```

### Build for Production

```bash
yarn build
```

Output will be in `dist/` directory.

## 🔐 Authentication

- OTP-based phone authentication
- Role: `tenant_admin`
- JWT token-based authorization

## 🌐 Deployment

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
netlify deploy --prod
```

### Docker
```bash
docker build -t tenant-admin .
docker run -p 3000:3000 tenant-admin
```

## 📁 Project Structure

```
src/
├── pages/          # Page components
│   ├── Dashboard.js
│   ├── Settings.js
│   ├── MenuBuilder.js
│   ├── Orders.js
│   └── Stores.js
├── components/     # Reusable UI components
│   └── ui/        # Shadcn UI components
├── contexts/      # React contexts (Auth)
├── api/           # API client
├── hooks/         # Custom React hooks
└── lib/           # Utility functions
```

## 🔗 API Integration

This app connects to the HyperServe backend API.

**Required API Endpoints:**
- POST `/api/auth/send-otp`
- POST `/api/auth/verify-otp`
- GET `/api/tenant-admin/settings`
- PUT `/api/tenant-admin/settings`
- GET `/api/tenant-admin/stores`
- GET `/api/tenant-admin/items`
- GET `/api/tenant-admin/orders`

See `/app/backend/API_DOCUMENTATION.md` for complete API docs.

## 📱 Screenshots

- Dashboard with sales analytics
- Menu Builder with admin markup field
- Order management interface
- Settings panel for delivery & tax

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License

## 🆘 Support

For issues and questions, please open a GitHub issue.
