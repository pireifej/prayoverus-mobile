---
name: Fingerprint mismatch requires binary rebuild
description: When Expo OTA reports "No compatible builds found for fingerprint", users on that platform stop receiving OTA updates and a new binary must be built and submitted.
---

# Fingerprint Mismatch → Binary Rebuild Required

## The rule
Any change to `app.json` plugins, native package installs, or Kotlin/SDK version bumps changes the Expo fingerprint. If a new binary is not submitted to the App Store / Play Store after such a change, all future OTAs will report "No compatible builds found" and silently fail to reach users on that platform.

**Why:** Expo matches OTA bundles to binaries by fingerprint. Stale binaries have a different fingerprint and are skipped.

**How to apply:** After any native-layer change, run `eas build --platform <ios|android> --profile production` and submit. Pure JS/asset OTAs are safe without a rebuild.

## Version bump gotcha
App Store requires `CFBundleShortVersionString` (expo `version` in app.json) to be higher than the last *approved* version — not just the last submitted one. Bump `version` in app.json before every new binary build to avoid ITMS-90062/90186 rejection.

## Play Store warnings (non-blocking)
Deprecated edge-to-edge APIs, ML Kit orientation restriction, and R8 optimization warnings come from third-party libraries (RN core, Google Ads, ML Kit) — not app code. They do not block approval. R8 can be enabled via `enableProguardInReleaseBuilds: true` in app.json but needs separate testing.
