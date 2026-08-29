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

echo "Publishing Android OTA update to the EAS production channel..."
"${EAS[@]}" update \
  --channel production \
  --platform android \
  --message "${UPDATE_MESSAGE}"