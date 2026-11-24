# Mobile subscription integration handoff

## Implemented contract

- Authenticated `POST /api/subscriptions/identity` sends exactly `{}`.
- Authenticated `POST /api/subscriptions/pro-status` sends the server-issued
  `revenuecatAppUserId` and `refresh: true`.
- Authenticated `GET /api/subscriptions/access-policy` controls Daily Bread and
  Prayer Walk independently from membership. Extended prayers remain Pro-only.
- Profile verification, foregrounding, purchase and restore refresh backend
  access. SDK customer information alone never grants account Pro.
- `/getPrayedFor` sends the viewed member as `targetUserId` and the signed-in
  viewer as `userId`.

No deployed responses were queried while implementing this handoff. These
contracts came from the separate backend project's supplied source examples.

## Existing customers and billing safety

Identity lookup and backend preflight do not log into or mutate SDK customers.
The SDK is identified only before a user-initiated purchase/restore, after
ownership preflight. `requiresSdkLogin: true` is **not** a migration indicator.

`identityVerificationRequired`, identity mismatches, or a different SDK customer
with purchase history block automatic billing/relinking. The user is directed
to ownership support, not another purchase. No automatic transfer, alias-repair,
or SDK logout is performed. Catalog information from a different SDK customer
does not become account entitlement state.

A successful store transaction whose backend status cannot be verified is
reported as pending, not successful Pro activation or a failed payment requiring
another purchase. Profile provides verification retry and store management.

Account changes clear app membership/policy/catalog state and invalidate stale
responses. Native billing operations are serialized and duplicate taps blocked.

## Authentication and posting

Session tokens remain in SecureStore, are omitted from cached profile records,
and are required before login restoration. Legacy insecure copies are removed,
not trusted as a replacement for a missing secure token.

Secure-store operations are serialized so delayed logout/read operations cannot
restore an old credential or delete a newer account's token. Ordinary cache
cleanup is awaited before accepting another login.

Posting uses the server result, not a local quota count. Success closes and
clears the composer, including the final free post. Only a rejected daily-limit
submission shows the quota offer. Retryable generation failures retain the
draft, offer manual retry, and reuse the same idempotency key.

Daily Bread reward markers are account-specific. Content policy gates cached
playback too; denied/unknown policy does not become a purchase requirement by
default. A policy lookup failure offers retry while normal free features remain
independent. Audio URLs/storage have not been changed.

## Still required before public launch

1. Backend team confirms the compatible endpoints are deployed in the intended
   test environment and that the session-signing secret/identity derivation is
   stable. Deploying API support and enabling paid restrictions are separate.
2. Backend team supplies a safe support process for legacy ownership failures.
   The app deliberately does not migrate those customers automatically.
3. Test Android internal-testing and iOS TestFlight purchases and restores:
   store success → correct RevenueCat entitlement → backend Pro → features.
4. Test cancellation during the paid period, renewal, expiration, refund,
   account switching, legacy customers, and complimentary RevenueCat grants.
5. Verify live platform SDK keys, products, offering, entitlement, Apple metadata,
   subscription approval, and legal disclosures. Release-native configuration
   no longer falls back to a Test Store key, but live values were not inspected.
6. Add verified privacy-policy and subscription-terms links to the paywall
   before store submission. No unverified URLs were invented.
7. Coordinate older-client compatibility before publishing backend guards.

No OTA, AAB/IPA build, store submission, backend deployment, purchase, grant,
customer transfer, or paywall-setting change was performed.
