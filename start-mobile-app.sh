#!/bin/bash

echo "Starting PrayOverUs Mobile App..."
echo ""
echo "📱 First install Expo Go on your phone:"
echo "   iOS: App Store -> Expo Go"
echo "   Android: Google Play -> Expo Go"
echo ""

cd expo-app

# Install dependencies if needed
npx expo install

# Start the Expo development server
echo "Starting Expo server with QR code..."
npx expo start --port 19008 --lan