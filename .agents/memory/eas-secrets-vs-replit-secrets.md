---
name: EAS secrets vs Replit secrets
description: EXPO_PUBLIC_* vars must be added as EAS secrets or they bake in as empty strings in production binaries
---

# EAS Build Secrets Are Separate From Replit Secrets

## The Rule
Replit environment secrets are NOT passed to EAS cloud builds. Every `EXPO_PUBLIC_*` variable used in JS code must be explicitly added as an EAS secret via `eas secret:create` or `eas env:create`.

**Why:** EAS builds run on EAS cloud servers, not on Replit. The Replit shell environment is never forwarded. If a secret is missing, `process.env.EXPO_PUBLIC_FOO` is `undefined`, which falls back to `''` — silently.

## What Was Missing
`EXPO_PUBLIC_API_AUTH` was not in EAS secrets. Every EAS binary build sent `Authorization: Basic ` (empty), causing the backend to return 401 on all API calls. The app appeared to work because OTA updates pushed from Replit (where the secret IS available) overwrote the bundle with one that had the correct secret baked in.

## How to Apply
Before every EAS build, verify all `EXPO_PUBLIC_*` vars are in EAS secrets:
```bash
cd expo-app && eas secret:list
```
To add a missing secret from the Replit shell:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_AUTH --value "$EXPO_PUBLIC_API_AUTH" --type string --non-interactive
```

## Current EAS Secrets (as of Aug 2026)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` ✅
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` ✅  
- `EXPO_PUBLIC_API_AUTH` ✅ (added Aug 7, 2026 — was missing from all prior builds)

## Important Distinction — Login Endpoints vs General API Calls
`/googleLogin` and `/appleLogin` are identity-verification endpoints — the user is not yet authenticated when they call them, so the backend's Basic Auth middleware should NOT guard them. In Aug 2026, the middleware was incorrectly applied there, causing 401s on sign-in. The fix was server-side (remove middleware from those two routes), not client-side. Do not assume a login 401 is a missing auth secret — check the backend middleware config first.

The missing `EXPO_PUBLIC_API_AUTH` secret still matters for all OTHER endpoints (prayer feed, profile, etc.) that do require the API credential.

## OTA as Emergency Fix
If a binary is already in TestFlight/App Store missing a secret, push an OTA from Replit:
```bash
eas update --channel production --message "fix: ..."
```
The OTA bundle bakes in secrets from the Replit environment at push time, fixing all devices on that runtime version without a new binary.
