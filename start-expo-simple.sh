#!/bin/bash

echo "Starting Expo development server for PrayOverUs..."
cd expo-app

# First try to install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Dependencies need to be installed. Please run:"
    echo "cd expo-app && npm install"
    echo ""
fi

echo "Starting Expo server..."
echo "📱 Download Expo Go app on your phone first!"
echo ""

# Start expo in local network mode (no tunnel/ngrok needed)
npx expo start --lan --non-interactive