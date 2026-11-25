# Read-only purchase ownership diagnostics

In the updated mobile app, open **My Profile → Purchase diagnostics → Read device purchase information**.
The panel is collapsed by default and never reads device history just because it is opened.

Compare:

- **Device SDK RevenueCat ID**: read from the device SDK, not the backend identity.
- **Backend-issued RevenueCat ID**: the identity expected for the signed-in app account.
- **Backend isPro / identityVerificationRequired / reason**: the latest successful
  membership-check response observed by this app, with an observation timestamp.
  A failed later check replaces these flags with an error rather than retaining
  misleading earlier success. Reading the device does not trigger a backend lookup.
- SDK purchase products, reported test/production environment, expiration in UTC,
  and activity as reported by the SDK. Unknown environment is explicitly unknown.
  SDK customer information can be cached; its request date is displayed if available.

Account IDs are support identifiers: share them only with trusted support.
The panel excludes receipts, transaction IDs/tokens/signatures, subscriber attributes,
session credentials, and raw HTTP or SDK errors.

The read action only calls `getAppUserID()` and `getCustomerInfo()`. The SDK can
refresh its customer-info cache, but the action never calls login, logout, restore,
sync-purchases, transfer, purchase, or account mapping endpoints. Backend access
remains authoritative. Diagnostic data resets on app account changes and delayed
reads cannot restore a previous account's data.

This feature does not reconcile legacy ownership or grant Pro. An app build made
before these source changes does not contain the panel. Physical-device results
are still needed before choosing an ownership repair.
