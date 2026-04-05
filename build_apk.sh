#!/bin/bash

# HyperServe Mobile Apps - APK Build Script
# This script helps automate the APK building process

echo "============================================"
echo "🚀 HyperServe Mobile Apps - APK Builder"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found${NC}"
    echo "Installing EAS CLI..."
    npm install -g eas-cli
fi

echo -e "${GREEN}✅ EAS CLI installed: $(eas --version)${NC}"
echo ""

# Check if user is logged in
echo "📝 Checking Expo login status..."
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Expo${NC}"
    echo "Please login with your Expo account:"
    eas login
else
    echo -e "${GREEN}✅ Logged in as: $(eas whoami)${NC}"
fi

echo ""
echo "============================================"
echo "Select build option:"
echo "============================================"
echo "1. Build Customer App APK"
echo "2. Build Delivery Partner App APK"
echo "3. Build Both APKs (one after another)"
echo "4. Check build status"
echo "5. Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${YELLOW}📱 Building Customer App APK...${NC}"
        echo ""
        cd /app/mobile-app
        eas build -p android --profile preview
        ;;
    2)
        echo ""
        echo -e "${YELLOW}🚚 Building Delivery Partner App APK...${NC}"
        echo ""
        cd /app/delivery-app
        eas build -p android --profile preview
        ;;
    3)
        echo ""
        echo -e "${YELLOW}📱 Building Customer App APK...${NC}"
        echo ""
        cd /app/mobile-app
        eas build -p android --profile preview
        
        echo ""
        echo -e "${YELLOW}🚚 Building Delivery Partner App APK...${NC}"
        echo ""
        cd /app/delivery-app
        eas build -p android --profile preview
        ;;
    4)
        echo ""
        echo -e "${YELLOW}📊 Checking build status...${NC}"
        echo ""
        eas build:list
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo "============================================"
echo -e "${GREEN}✅ Build command executed!${NC}"
echo "============================================"
echo ""
echo "📝 Next Steps:"
echo "1. Wait for build to complete (~20 minutes)"
echo "2. Check build status: eas build:list"
echo "3. Or visit: https://expo.dev/accounts/[your-username]/builds"
echo "4. Download APK when ready"
echo "5. Install on Android device and test!"
echo ""
echo "📖 Full guide: /app/APK_BUILD_GUIDE.md"
echo ""
