#!/bin/bash

echo "🚀 HyperServe Mobile App - Getting QR Code"
echo "=========================================="
echo ""

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "expo start" 2>/dev/null
pkill -f metro 2>/dev/null
sleep 2

cd /app/mobile-app || exit 1

echo ""
echo "📱 Starting Expo Development Server..."
echo "⏳ This will take 15-20 seconds..."
echo ""
echo "📋 What you'll see:"
echo "   1. Metro Bundler starting"
echo "   2. QR Code in ASCII art"
echo "   3. Connection URL (exp://...)"
echo ""
echo "📱 How to use:"
echo "   - Install 'Expo Go' app on your phone"
echo "   - Scan the QR code below with the app"
echo "   - OR use the exp:// URL shown below"
echo ""
echo "Starting in 3 seconds..."
sleep 3
echo ""
echo "════════════════════════════════════════"
echo ""

# Start expo and keep it in foreground
yarn start

# This script will keep running until you press Ctrl+C
