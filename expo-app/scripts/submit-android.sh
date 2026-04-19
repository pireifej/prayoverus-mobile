#!/bin/bash
# Submit latest Android build to Google Play Store
# Run build-android-production.sh first
cd "$(dirname "$0")/.."
npx eas submit --platform android
