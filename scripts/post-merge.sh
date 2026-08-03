#!/bin/bash
set -e

# Post-merge setup for Pray Over Us
# Runs automatically after every task merge.
# Must be idempotent and non-interactive.

echo "▶ Installing root dependencies..."
npm install --legacy-peer-deps

echo "✅ Post-merge setup complete."
