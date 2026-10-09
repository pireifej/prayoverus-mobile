---
name: Google Play connector routing
description: Avoid mistaking a proxy host mismatch for a Google Play OAuth or permission failure.
---

The connected Google Play OAuth proxy was configured with `play.googleapis.com` as its base host, but Android Publisher API endpoints use `androidpublisher.googleapis.com`. The connection information states that `/androidpublisher/v3/...` calls through this proxy return 404 HTML regardless of whether OAuth is valid. A connected status and the `androidpublisher` scope do not prove that Publisher API requests can reach the service.

**Why:** Repeated permission or reauthorization debugging cannot fix a request routed to the wrong host.

**How to apply:** Check the proxy's destination host before troubleshooting scopes or account permissions. Until routing is corrected, use Play Console directly to verify subscriptions and base plans.
