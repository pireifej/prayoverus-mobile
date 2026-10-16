---
name: AdMob Android compatibility
description: Working rn-google-mobile-ads version, Kotlin, play-services-ads combination for RN 0.81 + Expo SDK 54
---

## Working combination (verified build ✅)
- `react-native-google-mobile-ads`: **16.3.0**
- `play-services-ads`: **25.0.0** (forced via `withPlayServicesAdsVersionPin` in `withAdsKotlinFix.js`)
- `android.kotlinVersion`: **2.1.20** (set via `withKotlinJvmDefault`)
- Gradle: **8.13** (pinned via `withGradleVersionPin`)

## Why not 16.4.0
16.4.0 requires `play-services-ads 25.4.0`, which was compiled with Kotlin 2.3.0 metadata. ExpoRootProject caps Kotlin at 2.2.20. No version of play-services-ads below 25.4.0 has the `AgeRestrictedTreatment` API that 16.4.0 uses — so 16.4.0 is incompatible with Expo SDK 54's Kotlin ceiling.

## Why not Kotlin 2.2.x
KGP 2.2.x removed `jvmDefault` from `KotlinJvmCompilerOptions`. The `io.invertase.gradle.build:1.5` plugin (compiled JAR inside rn-google-mobile-ads) calls `getJvmDefault()` which crashes the post-build Gradle reporter. Use 2.1.20 where `jvmDefault` still exists.

## iOS
16.3.0 bundles iOS SDK `Google-Mobile-Ads-SDK 13.1.0`. The iOS 26 Swift crash is prevented by `GADDelayAppMeasurementInit: true` in `infoPlist` (set in app.json), which works regardless of SDK version. Keep this key.

## Yarn.lock caution
Additional registry URL variants have appeared in `yarn.lock` and `package-lock.json`, including both `package-firewall.replit.local` and `package-firewall.replit.internal`. Before an EAS build, scan both lockfiles for either hostname and replace matching tarball URLs with the corresponding `https://registry.npmjs.org/` URL.
EAS uses `yarn.lock` (not `package-lock.json`) since both exist. Running `yarn install` inside Replit resolves packages through `http://package-firewall.replit.local/` which produces internal URLs that EAS cannot reach. After any `yarn install`, run: `sed -i 's|http://package-firewall\.replit\.local/npm/|https://registry.npmjs.org/|g' yarn.lock` before committing.

## app.json
`expo-build-properties` `kotlinVersion` field must match the value in `withAdsKotlinFix.js`. If they conflict, the config plugin wins (runs later), but the mismatch is confusing. Keep both in sync.
