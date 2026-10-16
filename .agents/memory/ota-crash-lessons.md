---
name: OTA Crash Lessons for PrayOverUs
description: Why OTAs crashed on 1.0.29 and what to watch for before pushing future OTAs
---

## Rule
Before pushing any OTA, audit ALL module-level code across every JS file in expo-app/ for code that runs at import time (outside functions/components).

Never publish an iOS OTA merely because it works in TestFlight when the TestFlight and public App Store binaries have different native layers but share the same runtime version.

**Why:** Native/runtime mismatches and module-level changes can cause silent native crashes on OTA load:
1. `Intl.DateTimeFormat()` call at the top of i18n.js (Hermes may not support Intl in all contexts)
2. `Platform` and `AsyncStorage` imported mid-file in App.js, AFTER module-level code that used `Platform` — Babel may not hoist properly in all Expo SDK 54 configurations
3. Hermes bytecode or native dependency mismatch when SDK/dependency versions change between native build and OTA
4. `ResponseType` imported from `expo-auth-session` — it exists internally but is NOT a public export, so it resolves to `undefined`; using `ResponseType.Token` crashes at render time. Always use the string `'token'` directly instead.
5. A republished update made from a dirty working tree can still differ from the TestFlight binary even when the runtime version matches; if a device crashes after downloading an OTA, publish an iOS-only rollback-to-embedded directive.
6. A fresh App Store install that opens once and then fails after relaunch is a strong signal that it downloaded an incompatible OTA after the first launch.

**How to apply:**
- Run: `grep -n "^[A-Za-z]" *.js | grep -v "import\|export\|const \|let \|var \|function \|class \|//"` to find suspicious module-level calls
- All top-level imports must be at the TOP of the file, before any executable statements
- Wrap any module-level calls (like `Intl.DateTimeFormat()`) in try-catch
- OTA is safe only for pure JS logic changes inside functions/components — never for new imports or module-level initialization
- The production channel serves every compatible iOS binary sharing that runtime, not only TestFlight. Give a native-changed binary a new runtime before using OTA, and wait until that binary is the public App Store version.
- New iOS store binaries use the dedicated `ios-production` channel; Android stays on `production`. Keep the old iOS `production` channel rolled back to embedded so legacy App Store binaries cannot receive new iOS OTAs.

## Android testing and update identity
Use the native version code, update ID, and embedded-versus-OTA launch flag together when verifying a tester's installation. Embedded bundles also have update IDs; the presence of an ID alone does not mean an OTA was loaded.

**Why:** An AAB can contain the new code while a tester reports a different running update. A shared visible version is insufficient to establish which binary Play installed, and must not be treated as proof an old OTA replaced the new binary.

**How to apply:** Inspect the exact built AAB's embedded manifest before attributing the problem to OTA selection. Android has a platform-specific runtime override to isolate new binaries from legacy updates while preserving the iOS runtime. Keep the checked-in Android runtime resource synchronized with that override because EAS skips prebuild for this native project. Do not change production update routing to troubleshoot one tester.

## OTA Rollback
- `eas update:delete <groupId> --non-interactive` — deletes specific OTA group
- `eas update:rollback` (no flags) — interactive rollback to embedded
- `--rollback-to-embedded-update` flag does NOT exist in eas-cli 20.x
- Deleting OTAs from server does NOT clear them from devices that already downloaded — users must delete + reinstall

## Version Management
- Do not infer the update runtime from the visible app version. Inspect the configured per-platform runtime and the native runtime embedded in the target binary; changing the app version alone does not retarget a statically configured runtime.
- Push OTA command: `cd expo-app && EAS_SKIP_AUTO_FINGERPRINT=1 npx eas update --branch production --message "..." --non-interactive`
- Recovery command: `eas update:roll-back-to-embedded --branch production --platform ios --runtime-version <binary-runtime> --message "..." --non-interactive`
