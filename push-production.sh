#!/bin/bash
cd ~/workspace/expo-app
eas update --channel production --message "${1:-OTA update}"
