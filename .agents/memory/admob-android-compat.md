---
name: AdMob Android/iOS compatibility
description: Version constraints and patches needed for react-native-google-mobile-ads across platforms and RN versions
---

# AdMob compatibility notes

## Android constraint (AdMob 16.4.0 + Kotlin 2.3.0)
- AdMob 16.4.0 bundles `play-services-ads 25.4.0` compiled with Kotlin metadata 2.3.0.
- Building with Kotlin < 2.3.0 produces: "Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 2.3.0, expected version is 2.1.0."
- **Fix:** set `kotlinVersion: "2.3.0"` in app.json (expo-build-properties) and update KSP pin in `withAdsKotlinFix.js` to `"2.3.0-1.0.20"`.
- `withAdsKotlinFix.js` config plugin applies four Android patches:
  1. Pins Gradle to 8.13
  2. Sets `android.suppressUnsupportedCompileSdk=35`
  3. Pins KSP to `2.3.0-1.0.20`
  4. Patches `currentActivity` → `reactApplicationContext.currentActivity` in the Kotlin source (no-op if already fixed upstream)

**Why:** Each AdMob major version bump tends to pull in a newer play-services-ads compiled with a newer Kotlin metadata version. Always check the Kotlin version requirement when upgrading AdMob.

**How to apply:** When upgrading AdMob in future, check what `play-services-ads` version it bundles, find its Kotlin metadata version from the error log, and bump `kotlinVersion` + KSP pin to match.

## iOS constraint (iOS 26 crash — EXC_BREAKPOINT / _assertionFailure)
- v16.0.3 causes a Swift `_assertionFailure` crash on iOS 26 in a Swift concurrency cooperative queue at launch.
- **Fix:** upgrade to **16.4.0** + add `GADDelayAppMeasurementInit: true` to iOS infoPlist in app.json.
- `GADDelayAppMeasurementInit: true` defers AdMob's Swift async measurement task so it doesn't fire during `application:didFinishLaunchingWithOptions`.
- Applied in build 112 (v1.0.33).

**How to apply:** When updating AdMob in the future, keep `GADDelayAppMeasurementInit: true` in app.json infoPlist. The withAdsKotlinFix.js plugin can stay as-is — it no-ops if the source patch is already applied upstream.
