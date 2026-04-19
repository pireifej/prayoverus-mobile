#!/bin/bash
# Build a preview APK for Android (~15 min, one-time per fingerprint change)
# Install the resulting .apk on your test device
# After that, use update-preview.sh for all future changes
cd "$(dirname "$0")/.."
npx eas build --profile preview --platform android
