#!/usr/bin/env bash
set -euo pipefail

if (( $# > 1 )); then
  echo "Usage: $0 [update message]" >&2
  exit 2
fi

UPDATE_MESSAGE="${1:-Android production OTA update}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/../expo-app"
WORKSPACE_DIR="${SCRIPT_DIR}/.."
EAS=(env -u EXPO_TOKEN "${WORKSPACE_DIR}/node_modules/.bin/eas")

cd "${PROJECT_DIR}"

echo "Checking Expo login..."
if ! "${EAS[@]}" whoami; then
  echo "No local EAS login found. Enter your Expo credentials when prompted."
  "${EAS[@]}" login
fi

APP_VERSION="$(node -p "require('./app.json').expo.version")"
UPDATE_LOG="$(mktemp)"
trap 'rm -f "${UPDATE_LOG}"' EXIT

echo "Expected Profile label: production-${APP_VERSION} · update <8-character Android update ID>"
echo "Publishing Android OTA update to the EAS production channel..."
if ! "${EAS[@]}" update \
    --channel production \
    --platform android \
    --message "${UPDATE_MESSAGE}" | tee "${UPDATE_LOG}"; then
  echo "Android OTA publish failed." >&2
  exit 1
fi

ANDROID_UPDATE_ID="$(sed -nE 's/^[[:space:]]*Android update ID[[:space:]]+([^[:space:]]+).*/\1/p' "${UPDATE_LOG}" | tail -n 1)"
if [[ -n "${ANDROID_UPDATE_ID}" ]]; then
  echo
  echo "Profile label to expect: production-${APP_VERSION} · update ${ANDROID_UPDATE_ID:0:8}"
else
  echo
  echo "Update published, but EAS did not return an Android update ID in the expected format."
  echo "Expected format: production-${APP_VERSION} · update <8-character Android update ID>"
fi