---
name: Admin test prayer privacy
description: Product requirement for the private test-post mode in Pray Over Us.
---

Admin test prayer requests should be visible only to their author. Do not describe a test post as "Only me" until that visibility is enforced and verified on the backend.

**Why:** The user wants to keep test posts for themselves only. Disabling notifications does not establish who can read a request.

**How to apply:** When changing the composer, feed, request detail, or test-post flow, preserve this distinction and verify author-only access across all server read paths before making privacy claims in the UI.
