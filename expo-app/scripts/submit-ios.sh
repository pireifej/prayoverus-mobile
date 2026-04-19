#!/bin/bash
# Submit latest iOS build to Apple App Store
# Run build-ios-production.sh first
cd "$(dirname "$0")/.."
npx eas submit --platform ios
