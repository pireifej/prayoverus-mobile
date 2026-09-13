---
name: Signed backend session tokens
description: Rules for protecting the backend session across mobile login, API requests, and account changes
---

The backend session token is a credential, not user profile data: keep it in platform secure storage, send it alongside the existing Basic API credential, and clear it before switching accounts or logging out.

**Why:** A cached token in ordinary app storage can authenticate the wrong account on a shared device or survive a logout.

**How to apply:** Hydrate the secure token before protected requests, replace it only after a successful login response, and treat missing, expired, or mismatched tokens as a forced re-authentication rather than retrying with another user ID.