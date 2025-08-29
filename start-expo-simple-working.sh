#!/bin/bash

echo "Starting simplified PrayOverUs app..."
cd expo-app

# Clear cache completely
rm -rf .expo node_modules/.cache

# Start with minimal configuration
npx expo start --tunnel --port 19011 --clear