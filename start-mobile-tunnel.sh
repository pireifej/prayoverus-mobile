#!/bin/bash

echo "Starting PrayOverUs Mobile App with Tunnel..."
echo ""
echo "This will create a tunnel connection so your phone can access the app"
echo "from anywhere, not just your local network."
echo ""

cd expo-app

# Start Expo with tunnel mode for external access
echo "Starting Expo server with tunnel (this may take a moment)..."
npx expo start --tunnel --port 19009