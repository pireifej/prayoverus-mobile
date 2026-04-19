#!/bin/bash
# Build production iOS app for App Store submission
# Requires Apple Developer account ($99/year)
cd "$(dirname "$0")/.."
npx eas build --platform ios
