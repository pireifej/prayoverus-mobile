#!/bin/bash

echo "🙏 Starting PrayOverUs Expo Mobile App..."
echo ""
echo "This will start the Expo development server and show a QR code"
echo "that you can scan with your phone to preview the app!"
echo ""
echo "📱 Make sure you have Expo Go installed on your phone:"
echo "   • iOS: Download from App Store"
echo "   • Android: Download from Google Play Store"
echo ""

cd expo-app

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing Expo dependencies..."
    npm install
fi

echo "Starting Expo development server..."
echo ""
echo "🔍 A QR code will appear below - scan it with your camera (iOS) or Expo Go app (Android)"
echo ""

# Start expo with tunnel for better connectivity
npx expo start --tunnel