#!/bin/bash
# Push OTA update to your preview test build only (safe, doesn't affect real users)
# Usage: ./update-preview.sh "optional message"
cd "$(dirname "$0")/.."
MESSAGE="${1:-test}"
npx eas update --branch preview --message "$MESSAGE"
