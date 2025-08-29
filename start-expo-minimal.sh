#!/bin/bash

echo "Starting minimal PrayOverUs Expo app..."
cd expo-app

# Replace files with minimal versions
mv package-minimal.json package.json
mv babel-minimal.config.js babel.config.js

# Clear all caches
rm -rf .expo node_modules/.cache node_modules

# Install minimal dependencies
npm install

# Start with tunnel
npx expo start --tunnel --port 19012 --clear