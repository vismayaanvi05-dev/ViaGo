#!/bin/bash

# Script to create 4 separate applications from the monolithic frontend

echo "🚀 Creating separate applications for HyperServe..."

# Create base directories
mkdir -p /app/apps/{tenant-admin-web,super-admin-web,customer-mobile,delivery-mobile}

echo "✅ Directories created"

# ==================== TENANT ADMIN WEB ====================
echo "📦 Setting up Tenant Admin Web..."

cd /app/apps/tenant-admin-web

# Copy tenant-admin specific pages
mkdir -p src/pages src/components/ui src/contexts src/api src/hooks src/lib
cp -r /app/frontend/src/pages/tenant-admin/* src/pages/ 2>/dev/null || true
cp -r /app/frontend/src/components/ui/* src/components/ui/ 2>/dev/null || true
cp /app/frontend/src/components/ProtectedRoute.js src/components/ 2>/dev/null || true
cp /app/frontend/src/contexts/AuthContext.js src/contexts/ 2>/dev/null || true
cp /app/frontend/src/api/client.js src/api/ 2>/dev/null || true
cp /app/frontend/src/hooks/use-toast.js src/hooks/ 2>/dev/null || true
cp /app/frontend/src/lib/utils.js src/lib/ 2>/dev/null || true

# Copy Login page (shared)
cp /app/frontend/src/pages/Login.js src/pages/

echo "✅ Tenant Admin files copied"

# ==================== SUPER ADMIN WEB ====================
echo "📦 Setting up Super Admin Web..."

cd /app/apps/super-admin-web

mkdir -p src/pages src/components/ui src/contexts src/api src/hooks src/lib
cp -r /app/frontend/src/pages/super-admin/* src/pages/ 2>/dev/null || true
cp -r /app/frontend/src/components/ui/* src/components/ui/ 2>/dev/null || true
cp /app/frontend/src/components/ProtectedRoute.js src/components/ 2>/dev/null || true
cp /app/frontend/src/contexts/AuthContext.js src/contexts/ 2>/dev/null || true
cp /app/frontend/src/api/client.js src/api/ 2>/dev/null || true
cp /app/frontend/src/hooks/use-toast.js src/hooks/ 2>/dev/null || true
cp /app/frontend/src/lib/utils.js src/lib/ 2>/dev/null || true
cp /app/frontend/src/pages/Login.js src/pages/

echo "✅ Super Admin files copied"

# ==================== CUSTOMER MOBILE ====================
echo "📱 Setting up Customer Mobile..."

cd /app/apps/customer-mobile

mkdir -p src/screens src/components src/contexts src/api src/navigation
cp -r /app/frontend/src/pages/customer/* src/screens/ 2>/dev/null || true
cp /app/frontend/src/contexts/AuthContext.js src/contexts/ 2>/dev/null || true
cp /app/frontend/src/api/client.js src/api/ 2>/dev/null || true

echo "✅ Customer Mobile files copied"

# ==================== DELIVERY MOBILE ====================
echo "📱 Setting up Delivery Mobile..."

cd /app/apps/delivery-mobile

mkdir -p src/screens src/components src/contexts src/api src/navigation

echo "✅ Delivery Mobile structure created"

echo ""
echo "🎉 All application structures created!"
echo ""
echo "Next steps:"
echo "1. Configure each application"
echo "2. Set up package.json for each"
echo "3. Create README files"
echo "4. Set up build scripts"
