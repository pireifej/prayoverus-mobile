#!/usr/bin/env bash
set -euo pipefail

if (( $# > 1 )); then
  echo "Usage: $0 [build message]" >&2
  exit 2
fi

BUILD_MESSAGE="${1:-iOS TestFlight build}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/../expo-app"
WORKSPACE_DIR="${SCRIPT_DIR}/.."
EAS=(env -u EXPO_TOKEN "${WORKSPACE_DIR}/node_modules/.bin/eas")

cd "${PROJECT_DIR}"

APP_VERSION="$(node -p "require('./app.json').expo.version")"
RUNTIME_VERSION="$(node -p "require('./app.json').expo.runtimeVersion")"

echo "iOS TestFlight only"
echo "App version: ${APP_VERSION}"
echo "Runtime version: ${RUNTIME_VERSION}"
echo
echo "This script will:"
echo "  1. Build an iOS production binary"
echo "  2. Submit that iOS binary to App Store Connect for TestFlight"
echo
echo "This script will NOT:"
echo "  - build or submit Android"
echo "  - publish an OTA update"
echo "  - release anything to the App Store"
echo
echo "Make sure ${APP_VERSION} is higher than the last approved App Store version."
echo "The app version is intentionally not changed automatically."
echo

echo "Checking Expo login..."
if ! "${EAS[@]}" whoami; then
  echo "No local EAS login found. Enter your Expo credentials when prompted."
  "${EAS[@]}" login
fi

echo
echo "Building iOS production binary for TestFlight..."
"${EAS[@]}" build \
  --platform ios \
  --profile ios-production \
  --auto-submit-with-profile ios-production \
  --message "${BUILD_MESSAGE}" \
  --non-interactive \
  --wait

echo
echo "The new iOS build was handed directly to App Store Connect for TestFlight."
echo "It was not released to the public App Store."