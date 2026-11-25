# Controlled sandbox purchase-identity reconciliation

## Release boundary

This mobile change implements the backend contract supplied in the sandbox
identity-reconciliation handoff. It does not deploy the backend, approve an
account, modify a production mapping, or perform a purchase. No real account
identifiers or approvals are embedded in the app.

The existing purchase-history guard remains unchanged for normal billing.
Only a signed-session backend response with a valid `identityReconciliation`
offer can enable the exceptional flow.

## Operator/backend prerequisites

Before trying this on a device, the separate backend project must:

1. Review the actual production schema diff and prerequisite uniqueness checks.
   Publish only separately approved source/schema changes, without unrelated
   drops or overwriting production data.
2. Independently recheck account ownership, the stored mapping, all provider
   history/aliases and the reviewed device evidence.
3. Create an explicit, short-lived authorization for that exact account and
   transition. Publishing source with an empty authorization table is not enough.

Keep the content-paywall flag and signing secret unchanged. Never clear the old
mapping, delete purchase history, transfer purchases or change global restore
settings as a shortcut.

## Phone flow

- Profile shows **Fix purchase setup** only when a valid backend offer or a
  resumable securely saved transition exists. Other accounts keep normal behavior.
- The confirmation explains that the switch does not buy, restore, transfer or
  grant Pro. Canceling makes no SDK or backend mapping change.
- After confirmation the app refetches the authenticated offer. All fields must
  still match, with an unexpired approval and unchanged signed-in app account.
- It verifies the identified SDK source and exact original anonymous ID.
- It securely saves only the account-bound transition and consent before calling
  `Purchases.logIn(target)`. It never logs out, restores, syncs or purchases.
- After checking the SDK's current target ID, it calls
  `POST /api/subscriptions/identity-reconciliation/complete` with only
  `{authorizationId}`.
- Fresh identity and membership responses must confirm the target with
  `identityVerificationRequired=false` before the journal and billing block clear.
  Completion alone does not grant Pro.

For the approved expired-sandbox case, the expected final result is matching
device/server IDs, `isPro=false`, `identityVerificationRequired=false`, with the
old expired sandbox history intact in RevenueCat. A later purchase is a separate
user action.

## Interruptions and failures

The secure journal survives an app restart, but is cleared on app sign-out or
account switching. It contains no receipt, CustomerInfo, payment information or
session token. Secure-storage failures fail closed.

A saved transition at the SDK target offers **Retry purchase setup**, without
another SDK login or checking the old original ID at the new customer. This
supports the backend's idempotent completion even when a previous HTTP timeout
hid a successful transaction. A missing fresh offer is allowed only for this
already-switched, securely saved case.

A saved transition still at the source requires the same fresh backend offer and
rechecks source/original IDs. Changed approvals, expired approvals, unexpected
SDK IDs, authentication errors and provider evidence errors do not bypass
ownership checks. Expired authorization requires an operator review, even if
the SDK already switched. Never automatically switch back.

Purchase, restore and duplicate repair actions share the existing native billing
mutex. Late account responses cannot complete another account's repair or grant
Pro. Backend refreshes begun before repair cannot overwrite its verified result.

## Verification and remaining checks

Mocked service/hook/UI/API tests cover offer validation, explicit confirmation,
secure persistence, unchanged normal ownership protection, SDK mismatches,
account changes, expiry, interruption, completion failures/retry, and exact
authenticated completion input.

These tests do not prove live provider behavior or production database readiness.
After backend publication and account authorization, verify on the reviewed
device, then separately test a Google Play license-test subscription and restore
with backend-confirmed Pro. Apple purchase testing remains a separate step.
