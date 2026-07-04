---
name: AdMob Android compatibility matrix
description: Which react-native-google-mobile-ads version works with RN 0.81 + Expo SDK 53 + Kotlin 2.2.20
---

**Rule:** Use react-native-google-mobile-ads **v16.0.3** with a config-plugin patch for `currentActivity`.

**Why:**
- v16.0.1–v16.0.2: `currentActivity` removed from `ReactContextBaseJavaModule` in RN 0.79+, causes compile error
- v16.1.0–v16.4.0: use play-services-ads 25.x compiled with newer Kotlin metadata; KGP 2.2.20 + Gradle 8.13 triggers `getJvmDefault()` NoSuchMethodError
- v16.0.3: uses play-services-ads 24.9.0 (older Kotlin metadata, no getJvmDefault issue) + needs currentActivity patch

**How to apply:**
- `package.json`: pin `"react-native-google-mobile-ads": "16.0.3"`
- `withAdsKotlinFix.js` config plugin runs `withCurrentActivityPatch` to replace `val activity = currentActivity` → `val activity = reactApplicationContext.currentActivity` in `ReactNativeGoogleMobileAdsFullScreenAdModule.kt` before Gradle compiles
- Gradle must be pinned to 8.13 via `withGradleVersionPin` (withDangerousMod using `__dirname`) since EAS pulls 8.14.3 by default which also breaks things
- `android.overrideVersionCheck=true` in gradle.properties (via withGradleProperties) bypasses AGP's Gradle 8.13 minimum check
- `withDangerousMod` must use `__dirname` not `config.modResults.projectRoot` — the latter is undefined in EAS prebuild
