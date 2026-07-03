---
name: Play App Signing SHA-1 location
description: Where to find the production Android SHA-1 in the new Google Play Console UI (2025/2026)
---

**Rule:** Android OAuth client in Google Cloud Console must use the Play App Signing SHA-1, NOT the upload key SHA-1.

**Why:** Google Play re-signs APKs with its own managed key before delivery to users. The upload key SHA-1 (used during development) is different from the Play App Signing key SHA-1.

**How to find it:** Play Console → select app → Protected with Play → expand "Play Store protection" → click "Manage Play app signing" → copy SHA-1 from "App signing key certificate" section (NOT upload key certificate).

**For Pray Over Us:** Play App Signing SHA-1 = `80:98:76:6B:F6:EE:02:71:5C:E8:EC:35:D9:02:0D:9B:85:85:26:E7`
Upload key SHA-1 = `50:2E:97:0B:B8:D5:0C:E7:85:12:01:FD:14:90:E6:1F:10:CE:93:BB`
