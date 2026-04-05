#!/bin/bash
# Build script for ViaGo separate apps
# Usage: ./build.sh customer|driver

APP_TYPE=$1

if [ "$APP_TYPE" != "customer" ] && [ "$APP_TYPE" != "driver" ]; then
  echo "Usage: ./build.sh customer|driver"
  echo ""
  echo "  customer  - Build ViaGo Customer App"
  echo "  driver    - Build ViaGo Driver App"
  exit 1
fi

echo "🔨 Building ViaGo ${APP_TYPE^} App..."
echo ""

# Set the app type
export EXPO_PUBLIC_APP_TYPE=$APP_TYPE

if [ "$APP_TYPE" == "customer" ]; then
  echo "📱 App Name: ViaGo"
  echo "📦 Bundle ID: com.viagodelivery.customer"
  echo "🎨 Theme: Purple (#8B5CF6)"
elif [ "$APP_TYPE" == "driver" ]; then
  echo "📱 App Name: ViaGo Driver"
  echo "📦 Bundle ID: com.viagodelivery.driver"
  echo "🎨 Theme: Green (#10B981)"
fi

echo ""
echo "Starting Expo build..."
echo ""

# For EAS Build (production):
# npx eas build --platform all --profile production

# For local development preview:
npx expo start --clear
