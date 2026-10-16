#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <completed-EAS-build-id>" >&2
  exit 2
fi

exec node "${SCRIPT_DIR}/verify-android-production-aab.mjs" --build-id "$1"
