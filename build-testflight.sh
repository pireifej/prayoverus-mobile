#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/expo-app"

echo "Starting production-profile iOS build..."
eas build --platform ios --profile production

echo "Submitting the latest completed iOS build to TestFlight..."
eas submit --platform ios --profile production --latest
