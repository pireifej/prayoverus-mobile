#!/bin/bash

echo "Updating Expo SDK to version 53 to match your Expo Go app..."
cd expo-app

# Update to SDK 53
npx expo install --fix

# Restart with tunnel
echo "Starting updated Expo app..."
npx expo start --tunnel --port 19009