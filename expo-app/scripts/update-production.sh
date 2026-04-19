#!/bin/bash
# Push OTA update to ALL users — only run when ready to release
# Usage: ./update-production.sh "describe what changed"
cd "$(dirname "$0")/.."
MESSAGE="${1:-release}"
npx eas update --branch production --message "$MESSAGE"
