#!/bin/bash

echo "Starting PrayOverUs Expo App (Local Network Mode)..."
echo ""
echo "📱 Make sure your phone and computer are on the same WiFi network"
echo "📱 Install Expo Go app on your phone first"
echo ""

cd expo-app

echo "Starting Expo server on local network..."
echo "QR code will appear below - scan with Expo Go app!"
echo ""

# Start expo in local mode without tunnel (no ngrok needed)
npx expo start --lan --port 19006