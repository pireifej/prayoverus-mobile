#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
PROJECT_DIR="${WORKSPACE_DIR}/expo-app"
EAS="${WORKSPACE_DIR}/node_modules/.bin/eas"

if [[ ! -x "${EAS}" ]]; then
  echo "EAS CLI not found at ${EAS}" >&2
  exit 1
fi

cd "${PROJECT_DIR}"

APP_VERSION="$(node -p "require('./app.json').expo.version")"
ANDROID_VERSION_CODE="$(node -p "require('./app.json').expo.android.versionCode")"

echo "Android production AAB only"
echo "App version: ${APP_VERSION}"
echo "Configured Android version code: ${ANDROID_VERSION_CODE}"
echo "The production EAS profile may auto-increment the version code."
echo "This script builds an AAB but does not submit it to Google Play."
echo

echo "Checking Expo authentication..."
"${EAS}" whoami

echo
echo "Starting Android production build..."
BUILD_JSON="$(mktemp)"
trap 'rm -f "${BUILD_JSON}"' EXIT

"${EAS}" build \
  --platform android \
  --profile production \
  --wait \
  --json \
  --non-interactive

echo
echo "Verifying the completed Android production artifact..."
node "${WORKSPACE_DIR}/scripts/verify-android-production-aab.mjs" \
  --build-json "${BUILD_JSON}"
