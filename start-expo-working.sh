#!/bin/bash

echo "🙏 Starting PrayOverUs Expo Mobile App..."
echo ""
echo "📱 Make sure you have Expo Go installed on your phone:"
echo "   • iOS: Download from App Store"
echo "   • Android: Download from Google Play Store"
echo ""

cd expo-app

echo "Starting Expo development server..."
echo "🔍 QR code will appear below - scan it with Expo Go app!"
echo ""

# Start expo with CI mode to avoid prompts, on port 19006 to avoid conflicts
CI=1 npx expo start --port 19006 --lan