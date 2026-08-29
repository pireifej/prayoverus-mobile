#!/usr/bin/env bash
set -euo pipefail

if (( $# > 1 )); then
  echo "Usage: $0 [update message]" >&2
  exit 2
fi

UPDATE_MESSAGE="${1:-iOS production OTA update}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/../expo-app"
WORKSPACE_DIR="${SCRIPT_DIR}/.."
EAS=(env -u EXPO_TOKEN "${WORKSPACE_DIR}/node_modules/.bin/eas")

cd "${PROJECT_DIR}"

APP_VERSION="$(node -p "require('./app.json').expo.version")"
RUNTIME_VERSION="$(node -p "require('./app.json').expo.runtimeVersion")"
UPDATE_LOG="$(mktemp)"
trap 'rm -f "${UPDATE_LOG}"' EXIT

echo "Checking Expo login..."
if ! "${EAS[@]}" whoami; then
  echo "No local EAS login found. Enter your Expo credentials when prompted."
  "${EAS[@]}" login
fi

echo
echo "Publishing iOS-only OTA update to the isolated ios-production channel..."
echo "App version: ${APP_VERSION}"
echo "Runtime version: ${RUNTIME_VERSION}"
echo "Message: ${UPDATE_MESSAGE}"
echo
echo "This targets compatible iOS builds using the ios-production channel."
echo "It does not build Android, publish Android, or create a new binary."

if ! "${EAS[@]}" update \
    --channel ios-production \
    --platform ios \
    --message "${UPDATE_MESSAGE}" | tee "${UPDATE_LOG}"; then
  echo "iOS OTA publish failed." >&2
  exit 1
fi

IOS_UPDATE_ID="$(sed -nE 's/^[[:space:]]*iOS update ID[[:space:]]+([^[:space:]]+).*/\1/p' "${UPDATE_LOG}" | tail -n 1)"
if [[ -n "${IOS_UPDATE_ID}" ]]; then
  echo
  echo "iOS OTA published successfully."
  echo "Profile label to expect: production-${APP_VERSION} · update ${IOS_UPDATE_ID:0:8}"
else
  echo
  echo "iOS OTA published successfully, but EAS did not return an iOS update ID in the expected format."
fi