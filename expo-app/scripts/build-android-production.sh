#!/bin/bash
# Build production Android app for Google Play Store submission
cd "$(dirname "$0")/.."
npx eas build --platform android
