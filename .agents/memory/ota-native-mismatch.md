---
name: OTA breaks native-only features
description: OTA updates importing native modules crash users on App Store binaries that lack the native counterpart
---

**Rule:** Recover a broken OTA only for the affected platform and actual binary runtime, after approval and a native-compatibility audit. Do not assume changing the visible app version retargets an OTA.

**Why:** Update compatibility follows the configured runtime, which can be static and independent of the app version. A bundle importing a missing native module can crash even when its visible version looks correct.

**How to apply:**
Inspect the affected binary's runtime, platform, channel and running update ID. Match those against live EAS records. Choose an approved rollback-to-embedded or compatible replacement update for affected public users; do not change public update routing to troubleshoot an individual beta tester. A replacement test binary can instead use a separate runtime, synchronized in both Expo configuration and checked-in native resources.
