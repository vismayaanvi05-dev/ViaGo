#!/bin/bash

# HyperServe - One-Click Play Store Publisher
# This script automates as much as possible of the Play Store publishing process

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🚀 HyperServe - One-Click Play Store Publisher         ║"
echo "║   (Automated Build + Submit)                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not found. Installing...${NC}"
    npm install -g eas-cli
fi

# Check login
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please login to Expo:${NC}"
    eas login
fi

EXPO_USER=$(eas whoami)
echo -e "${GREEN}✅ Logged in as: $EXPO_USER${NC}"
echo ""

# Check for Google Play credentials
echo -e "${CYAN}📋 Play Store Credentials Check...${NC}"
echo ""

if [ -f "/app/google-play-credentials.json" ]; then
    echo -e "${GREEN}✅ Google Play credentials found${NC}"
    HAS_CREDENTIALS=true
else
    echo -e "${YELLOW}⚠️  No Google Play credentials found${NC}"
    echo ""
    echo "To enable automated submission, you need:"
    echo "  1. Create a Google Cloud Service Account"
    echo "  2. Download the JSON key"
    echo "  3. Save as: /app/google-play-credentials.json"
    echo ""
    echo "📖 Guide: https://github.com/expo/fyi/blob/main/creating-google-service-account.md"
    echo ""
    HAS_CREDENTIALS=false
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "Select Publishing Option:"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ "$HAS_CREDENTIALS" = true ]; then
    echo "🎯 AUTOMATED PUBLISHING (with credentials):"
    echo "  1. Customer App → Build + Auto-Submit to Play Store"
    echo "  2. Delivery App → Build + Auto-Submit to Play Store"
    echo "  3. Both Apps → Build + Auto-Submit to Play Store"
    echo ""
fi

echo "📦 MANUAL PUBLISHING (download AAB files):"
echo "  4. Customer App → Build AAB (manual upload)"
echo "  5. Delivery App → Build AAB (manual upload)"
echo "  6. Both Apps → Build AAB (manual upload)"
echo ""
echo "🔧 SETUP & INFO:"
echo "  7. Setup Google Play credentials"
echo "  8. Check build/submit status"
echo "  9. View Play Store requirements"
echo "  0. Exit"
echo ""

read -p "Enter choice (0-9): " choice

case $choice in
    1)
        if [ "$HAS_CREDENTIALS" = false ]; then
            echo -e "${RED}❌ Credentials required for auto-submit${NC}"
            exit 1
        fi
        echo -e "${BLUE}🚀 Publishing Customer App...${NC}"
        cd /app/mobile-app
        echo "Step 1/2: Building production AAB..."
        eas build --platform android --profile production --non-interactive
        echo ""
        echo "Step 2/2: Submitting to Play Store..."
        eas submit --platform android --latest
        ;;
    
    2)
        if [ "$HAS_CREDENTIALS" = false ]; then
            echo -e "${RED}❌ Credentials required for auto-submit${NC}"
            exit 1
        fi
        echo -e "${BLUE}🚀 Publishing Delivery App...${NC}"
        cd /app/delivery-app
        echo "Step 1/2: Building production AAB..."
        eas build --platform android --profile production --non-interactive
        echo ""
        echo "Step 2/2: Submitting to Play Store..."
        eas submit --platform android --latest
        ;;
    
    3)
        if [ "$HAS_CREDENTIALS" = false ]; then
            echo -e "${RED}❌ Credentials required for auto-submit${NC}"
            exit 1
        fi
        echo -e "${BLUE}🚀 Publishing Both Apps...${NC}"
        
        echo ""
        echo "═══ Customer App ═══"
        cd /app/mobile-app
        echo "Building..."
        eas build --platform android --profile production --non-interactive
        echo "Submitting..."
        eas submit --platform android --latest
        
        echo ""
        echo "═══ Delivery App ═══"
        cd /app/delivery-app
        echo "Building..."
        eas build --platform android --profile production --non-interactive
        echo "Submitting..."
        eas submit --platform android --latest
        ;;
    
    4)
        echo -e "${BLUE}📦 Building Customer App AAB...${NC}"
        cd /app/mobile-app
        eas build --platform android --profile production --non-interactive
        echo ""
        echo -e "${GREEN}✅ Build started!${NC}"
        echo "Download AAB from the URL provided above"
        echo "Then manually upload to: https://play.google.com/console"
        ;;
    
    5)
        echo -e "${BLUE}📦 Building Delivery App AAB...${NC}"
        cd /app/delivery-app
        eas build --platform android --profile production --non-interactive
        echo ""
        echo -e "${GREEN}✅ Build started!${NC}"
        echo "Download AAB from the URL provided above"
        echo "Then manually upload to: https://play.google.com/console"
        ;;
    
    6)
        echo -e "${BLUE}📦 Building Both Apps (AAB)...${NC}"
        
        echo ""
        echo "═══ Customer App ═══"
        cd /app/mobile-app
        eas build --platform android --profile production --non-interactive
        
        echo ""
        echo "═══ Delivery App ═══"
        cd /app/delivery-app
        eas build --platform android --profile production --non-interactive
        
        echo ""
        echo -e "${GREEN}✅ Builds started!${NC}"
        echo "Download AABs from the URLs provided above"
        echo "Then manually upload to: https://play.google.com/console"
        ;;
    
    7)
        echo -e "${CYAN}🔧 Google Play Credentials Setup${NC}"
        echo ""
        echo "To enable automated Play Store publishing:"
        echo ""
        echo "1. Go to Google Cloud Console:"
        echo "   https://console.cloud.google.com"
        echo ""
        echo "2. Create a Service Account:"
        echo "   • Create new project (or select existing)"
        echo "   • Enable Google Play Android Developer API"
        echo "   • Create Service Account"
        echo "   • Grant 'Service Account User' role"
        echo ""
        echo "3. Create JSON key:"
        echo "   • Go to Service Account → Keys"
        echo "   • Add Key → Create New Key → JSON"
        echo "   • Download the JSON file"
        echo ""
        echo "4. Link to Play Console:"
        echo "   • Go to: https://play.google.com/console"
        echo "   • Settings → API Access"
        echo "   • Link the service account"
        echo "   • Grant permissions (Release manager)"
        echo ""
        echo "5. Save credentials:"
        read -p "   Path to your JSON file: " JSON_PATH
        
        if [ -f "$JSON_PATH" ]; then
            cp "$JSON_PATH" /app/google-play-credentials.json
            echo -e "${GREEN}✅ Credentials saved!${NC}"
            echo ""
            echo "Now run this script again and choose options 1-3"
        else
            echo -e "${RED}❌ File not found: $JSON_PATH${NC}"
        fi
        ;;
    
    8)
        echo -e "${CYAN}📊 Status Check${NC}"
        echo ""
        echo "Recent Builds:"
        eas build:list --limit 5
        echo ""
        echo "Recent Submissions:"
        eas submit:list --limit 5
        ;;
    
    9)
        echo -e "${CYAN}📱 Play Store Requirements${NC}"
        echo ""
        echo "Before publishing, ensure you have:"
        echo ""
        echo "Required (one-time):"
        echo "  [ ] Google Play Developer account (\$25)"
        echo "  [ ] Privacy Policy URL"
        echo "  [ ] App icons (1024x1024 PNG)"
        echo ""
        echo "Required (per app):"
        echo "  [ ] App name and descriptions"
        echo "  [ ] Screenshots (2-8 images)"
        echo "  [ ] Feature graphic (1024x500)"
        echo "  [ ] Content rating completed"
        echo "  [ ] Target audience selected"
        echo "  [ ] Data safety form filled"
        echo ""
        echo "📖 Full guide: /app/PLAY_STORE_GUIDE.md"
        echo "🌐 Play Console: https://play.google.com/console"
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
echo "════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Operation Complete!${NC}"
echo "════════════════════════════════════════════════════════════"
echo ""

if [ "$choice" -ge 4 ] && [ "$choice" -le 6 ]; then
    echo "📝 Next Steps:"
    echo "  1. Wait for builds to complete (15-20 mins)"
    echo "  2. Download AAB files from provided URLs"
    echo "  3. Go to: https://play.google.com/console"
    echo "  4. Upload AAB to your app's Production track"
    echo "  5. Fill in release notes"
    echo "  6. Review and rollout"
    echo ""
elif [ "$choice" -ge 1 ] && [ "$choice" -le 3 ]; then
    echo "📝 Next Steps:"
    echo "  1. Wait for builds to complete (15-20 mins)"
    echo "  2. Automatic submission will follow"
    echo "  3. Check Play Console for review status"
    echo "  4. Monitor: https://play.google.com/console"
    echo ""
    echo "⏱️  Review Timeline:"
    echo "  • First submission: 7-14 days"
    echo "  • Updates: 1-3 days"
fi
