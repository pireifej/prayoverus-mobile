#!/bin/bash
cd "$(dirname "$0")/expo-app"
eas build --platform ios --profile production --auto-submit
