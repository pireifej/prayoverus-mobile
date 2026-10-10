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
"${EAS}" build \
  --platform android \
  --profile production \
  --non-interactive

echo
echo "Download the AAB from the EAS build page, then upload it to Google Play Internal testing."
