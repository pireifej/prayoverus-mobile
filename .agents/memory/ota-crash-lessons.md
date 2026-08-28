---
name: OTA Crash Lessons for PrayOverUs
description: Why OTAs crashed on 1.0.29 and what to watch for before pushing future OTAs
---

## Rule
Before pushing any OTA, audit ALL module-level code across every JS file in expo-app/ for code that runs at import time (outside functions/components).

**Why:** Native/runtime mismatches and module-level changes can cause silent native crashes on OTA load:
1. `Intl.DateTimeFormat()` call at the top of i18n.js (Hermes may not support Intl in all contexts)
2. `Platform` and `AsyncStorage` imported mid-file in App.js, AFTER module-level code that used `Platform` — Babel may not hoist properly in all Expo SDK 54 configurations
3. Hermes bytecode or native dependency mismatch when SDK/dependency versions change between native build and OTA
4. `ResponseType` imported from `expo-auth-session` — it exists internally but is NOT a public export, so it resolves to `undefined`; using `ResponseType.Token` crashes at render time. Always use the string `'token'` directly instead.
5. A republished update made from a dirty working tree can still differ from the TestFlight binary even when the runtime version matches; if a device crashes after downloading an OTA, publish an iOS-only rollback-to-embedded directive.

**How to apply:**
- Run: `grep -n "^[A-Za-z]" *.js | grep -v "import\|export\|const \|let \|var \|function \|class \|//"` to find suspicious module-level calls
- All top-level imports must be at the TOP of the file, before any executable statements
- Wrap any module-level calls (like `Intl.DateTimeFormat()`) in try-catch
- OTA is safe only for pure JS logic changes inside functions/components — never for new imports or module-level initialization

## OTA Rollback
- `eas update:delete <groupId> --non-interactive` — deletes specific OTA group
- `eas update:rollback` (no flags) — interactive rollback to embedded
- `--rollback-to-embedded-update` flag does NOT exist in eas-cli 20.x
- Deleting OTAs from server does NOT clear them from devices that already downloaded — users must delete + reinstall

## Version Management
- Always restore app.json `version` to the target (e.g. "1.0.30") after pushing OTAs (which temporarily need the binary's version like "1.0.29")
- `runtimeVersion.policy: "appVersion"` — OTA matches binary by version string only, no fingerprint
- Push OTA command: `cd expo-app && EAS_SKIP_AUTO_FINGERPRINT=1 npx eas update --branch production --message "..." --non-interactive`
- Recovery command: `eas update:roll-back-to-embedded --branch production --platform ios --runtime-version <binary-runtime> --message "..." --non-interactive`
