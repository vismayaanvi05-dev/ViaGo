#!/bin/bash

# HyperServe - Play Store Publishing Script
# Builds both APK (for testing) and AAB (for Play Store)

set -e

echo "============================================"
echo "📱 HyperServe Play Store Build Script"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found${NC}"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

echo -e "${GREEN}✅ EAS CLI: $(eas --version)${NC}"
echo ""

# Check Expo login
echo "📝 Checking Expo account..."
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo "Please login with your Expo account:"
    echo "(Create free account at: https://expo.dev/signup)"
    eas login
    echo ""
else
    EXPO_USER=$(eas whoami)
    echo -e "${GREEN}✅ Logged in as: $EXPO_USER${NC}"
    echo ""
fi

# Main menu
echo "============================================"
echo "Select Build Option:"
echo "============================================"
echo ""
echo "📦 Quick Testing Builds (APK - Faster)"
echo "  1. Customer App - APK (for testing)"
echo "  2. Delivery App - APK (for testing)"
echo "  3. Both Apps - APK (for testing)"
echo ""
echo "🏪 Play Store Builds (AAB - Production)"
echo "  4. Customer App - AAB (for Play Store)"
echo "  5. Delivery App - AAB (for Play Store)"
echo "  6. Both Apps - AAB (for Play Store)"
echo ""
echo "🚀 Complete Build (APK + AAB for both apps)"
echo "  7. Build Everything (APK + AAB for both)"
echo ""
echo "📊 Other Options"
echo "  8. Check build status"
echo "  9. Configure EAS projects"
echo "  0. Exit"
echo ""
read -p "Enter your choice (0-9): " choice

case $choice in
    1)
        echo -e "${BLUE}📱 Building Customer App APK...${NC}"
        cd /app/mobile-app
        eas build --platform android --profile preview --non-interactive
        ;;
    2)
        echo -e "${BLUE}🚚 Building Delivery App APK...${NC}"
        cd /app/delivery-app
        eas build --platform android --profile preview --non-interactive
        ;;
    3)
        echo -e "${BLUE}📱🚚 Building Both Apps - APK...${NC}"
        echo ""
        echo "Building Customer App..."
        cd /app/mobile-app
        eas build --platform android --profile preview --non-interactive
        echo ""
        echo "Building Delivery App..."
        cd /app/delivery-app
        eas build --platform android --profile preview --non-interactive
        ;;
    4)
        echo -e "${BLUE}📱 Building Customer App AAB (Play Store)...${NC}"
        cd /app/mobile-app
        eas build --platform android --profile production --non-interactive
        ;;
    5)
        echo -e "${BLUE}🚚 Building Delivery App AAB (Play Store)...${NC}"
        cd /app/delivery-app
        eas build --platform android --profile production --non-interactive
        ;;
    6)
        echo -e "${BLUE}📱🚚 Building Both Apps - AAB (Play Store)...${NC}"
        echo ""
        echo "Building Customer App AAB..."
        cd /app/mobile-app
        eas build --platform android --profile production --non-interactive
        echo ""
        echo "Building Delivery App AAB..."
        cd /app/delivery-app
        eas build --platform android --profile production --non-interactive
        ;;
    7)
        echo -e "${BLUE}🚀 Building Everything (APK + AAB for both apps)...${NC}"
        echo ""
        echo "Step 1/4: Customer App APK..."
        cd /app/mobile-app
        eas build --platform android --profile preview --non-interactive
        echo ""
        echo "Step 2/4: Customer App AAB..."
        eas build --platform android --profile production --non-interactive
        echo ""
        echo "Step 3/4: Delivery App APK..."
        cd /app/delivery-app
        eas build --platform android --profile preview --non-interactive
        echo ""
        echo "Step 4/4: Delivery App AAB..."
        eas build --platform android --profile production --non-interactive
        ;;
    8)
        echo -e "${BLUE}📊 Checking build status...${NC}"
        eas build:list --limit 10
        ;;
    9)
        echo -e "${BLUE}⚙️  Configuring EAS projects...${NC}"
        echo ""
        echo "Configuring Customer App..."
        cd /app/mobile-app
        eas init --id hyperserve-customer || eas build:configure
        echo ""
        echo "Configuring Delivery App..."
        cd /app/delivery-app
        eas init --id hyperserve-delivery || eas build:configure
        echo ""
        echo -e "${GREEN}✅ Configuration complete!${NC}"
        ;;
    0)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo -e "${GREEN}✅ Build command completed!${NC}"
echo "============================================"
echo ""
echo "📝 Next Steps:"
echo "  • Builds are processed on EAS servers (takes 10-20 minutes)"
echo "  • Check status: eas build:list"
echo "  • Download APK: Scan QR code or use provided URL"
echo "  • Download AAB: Use for Play Store upload"
echo ""
echo "🏪 Play Store Submission:"
echo "  1. Go to: https://play.google.com/console"
echo "  2. Create new app or select existing"
echo "  3. Upload the AAB file"
echo "  4. Fill in store listing, screenshots, etc."
echo "  5. Submit for review"
echo ""
