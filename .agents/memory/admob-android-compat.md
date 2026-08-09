---
name: AdMob Android/iOS compatibility
description: Version constraints and patches needed for react-native-google-mobile-ads across platforms and RN versions
---

# AdMob compatibility notes

## Android constraint (RN 0.81 + Kotlin 2.1.20)
- v16.0.3 was originally pinned due to Kotlin 2.2.20 compatibility issues.
- app.json now uses Kotlin **2.1.20** (not 2.2.20 — memory was recorded inaccurately).
- `withAdsKotlinFix.js` config plugin applies four Android patches:
  1. Pins Gradle to 8.13
  2. Sets `android.suppressUnsupportedCompileSdk=35`
  3. Pins KSP to `2.0.21-1.0.25`
  4. Patches `currentActivity` → `reactApplicationContext.currentActivity` in the Kotlin source (no-op if already fixed in newer versions)

**Why:** The plugin handles the "no patch needed" case gracefully, so upgrading AdMob is safe even if the Kotlin patch no longer applies.

## iOS constraint (iOS 26 crash — EXC_BREAKPOINT / _assertionFailure)
- v16.0.3 causes a Swift `_assertionFailure` crash on iOS 26 in a Swift concurrency cooperative queue at launch.
- **Fix:** upgrade to **16.4.0** + add `GADDelayAppMeasurementInit: true` to iOS infoPlist in app.json.
- `GADDelayAppMeasurementInit: true` defers AdMob's Swift async measurement task so it doesn't fire during `application:didFinishLaunchingWithOptions`.
- Applied in build 112 (v1.0.33).

**How to apply:** When updating AdMob in the future, keep `GADDelayAppMeasurementInit: true` in app.json infoPlist. The withAdsKotlinFix.js plugin can stay as-is — it no-ops if the source patch is already applied upstream.
