#!/usr/bin/env bash
set -euo pipefail

if (( $# > 1 )); then
  echo "Usage: $0 [build message]" >&2
  exit 2
fi

BUILD_MESSAGE="${1:-Android production build}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}/../expo-app"
EAS=(env -u EXPO_TOKEN npx eas-cli@latest)

cd "${PROJECT_DIR}"

if ! "${EAS[@]}" whoami >/dev/null 2>&1; then
  echo "No local EAS login found. Enter your Expo credentials when prompted."
  "${EAS[@]}" login
fi

echo "Building and submitting Android to Google Play Production..."
"${EAS[@]}" build \
  --platform android \
  --profile production \
  --message "${BUILD_MESSAGE}" \
  --auto-submit