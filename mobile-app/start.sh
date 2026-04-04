#!/bin/bash

echo "🚀 HyperServe Customer App - Quick Start"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from /app/mobile-app directory"
    echo "Usage: cd /app/mobile-app && bash start.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

echo ""
echo "✅ Starting Expo development server..."
echo ""
echo "📱 How to test:"
echo "   1. Install 'Expo Go' app on your phone"
echo "   2. Scan the QR code that appears below"
echo "   3. Wait 30-60 seconds for app to load"
echo ""
echo "🔧 Controls:"
echo "   - Press 'a' for Android emulator"
echo "   - Press 'i' for iOS simulator (Mac only)"
echo "   - Press 'r' to reload app"
echo "   - Press 'q' to quit"
echo ""
echo "📄 Testing Guide: /app/mobile-app/TESTING_GUIDE.md"
echo ""
echo "Starting in 3 seconds..."
sleep 3

yarn start
