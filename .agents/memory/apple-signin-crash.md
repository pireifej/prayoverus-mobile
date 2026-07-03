---
name: Apple Sign-In entitlement crash
description: usesAppleSignIn + expo-apple-authentication OTA bundle causes crash if native binary lacks the entitlement
---

**Rule:** Never push an OTA that imports `expo-apple-authentication` unless the native binary in the App Store was built with `usesAppleSignIn: true` in app.json.

**Why:** iOS enforces entitlements at runtime. If the JS bundle tries to use Apple auth but the native binary doesn't declare the entitlement, the app crashes on launch (splash shows then disappears).

**How to apply:** When re-enabling Apple Sign-In, it must ship as a native build — not an OTA. Keep the import commented out in UserAuth.js until the native build is in the App Store. For 1.0.30: `usesAppleSignIn: true` is in app.json, import is ready, but must build with `eas build --clear-cache`.
