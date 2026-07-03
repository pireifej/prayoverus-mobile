---
name: OTA breaks native-only features
description: OTA updates importing native modules crash users on App Store binaries that lack the native counterpart
---

**Rule:** If an OTA update was previously pushed that broke users on version X, push a counter-OTA by temporarily setting app.json version to X and pushing a fixed bundle, then restore the version.

**Why:** runtimeVersion policy is appVersion — OTAs only apply to matching versions. A broken OTA for 1.0.27 can only be fixed by another OTA targeting 1.0.27.

**How to apply:**
1. Temporarily set `"version": "X.X.X"` in app.json
2. Ensure the breaking import is disabled
3. Run: `EAS_SKIP_AUTO_FINGERPRINT=1 npx eas update --branch production --message "..." --non-interactive`
4. Restore version in app.json immediately after
