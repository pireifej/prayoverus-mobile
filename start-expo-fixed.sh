#!/bin/bash

echo "Starting PrayOverUs with fixed configuration..."
cd expo-app

# Clear cache and restart
rm -rf .expo node_modules/.cache

# Start fresh
npx expo start --tunnel --port 19009 --clear