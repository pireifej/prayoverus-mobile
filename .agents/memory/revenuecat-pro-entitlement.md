---
name: RevenueCat Pro entitlement
description: Subscription gating uses one entitlement and the live monthly package from the current offering.
---

The app's paid feature boundary is the single RevenueCat entitlement `Pray Over Us Pro`, verified for the signed-in account by the backend; SDK customer information alone must not grant account access. Keep the current offering and localized price in RevenueCat.

**Why:** Keeping entitlement and package selection centralized prevents a purchase from unlocking one feature but not another, and lets App Store/Play Store price changes reach the paywall without an app update.

**How to apply:** Use backend-issued identity and backend-verified membership for premium access. Keep platform product identifiers and prices in RevenueCat configuration. For catalog changes, use the connected integration; its credentials may not be available to local shell scripts.

## Confirmed feature-gating decisions
Free users keep one successful prayer request per Eastern day. Extended prayers remain Pro-only. Daily Bread and Prayer Walk follow the backend's content-access policy: they are temporarily open to signed-in users until the paid boundary is explicitly enabled. Keep the Profile Pro entry.

**Why:** The paid launch requires backend/mobile verification before paid content restrictions are enabled; membership and feature policy must not be conflated.

**How to apply:** Treat backend publication and activating the content paywall as separate decisions. Do not fake Pro to permit interim free content. A Google Play license-tester account does not itself grant Pro.

## Monthly rollout scope

Use the existing backend for this monthly-subscription rollout, without a separate staging environment. The user accepts temporary breakage for older clients because the current user base is small.

**Why:** The user explicitly chose to avoid extra staging resources and prioritize getting the current app working.

**How to apply:** Do not make oldest-client compatibility a release requirement for this rollout. Continue verifying current-client sessions, purchase ownership, and backend Pro activation; accepting downtime does not establish that billing works.

## Existing customer safety

Use the backend-issued identity, not an independently chosen numeric ID. Ownership-required responses and existing SDK purchase history must not trigger automatic migration, restore, or repeat purchase. The SDK-login flag alone is not legacy ownership verification.

**Why:** SDK identity changes can alias or reassign purchase relationships. A store success also does not prove the backend recognizes account Pro.

**How to apply:** Require ownership preflight before user-initiated billing. If store success cannot be verified, report pending access and offer verification retry rather than another charge. Never invent an ownership-repair procedure.

## Prayer submission outcome
After a successful prayer submission, clear the form's error and close the screen. Zero remaining allowance after that success is not an error. Show the daily-limit error only when an attempted submission actually returns HTTP 403 with `error: "DAILY_LIMIT_REACHED"`. Prevent duplicate submissions while posting, and ensure delayed quota checks cannot overwrite the successful state.

**Why:** The user explicitly required these semantics to distinguish a successful final free post from a rejected additional post.

**How to apply:** Treat the submission response as authoritative. Do not infer rejection from cached daily counts, remaining allowance, or message text.

## Pro presentation and dismissal
The Profile Pro area should be its own separate banner using the paywall's dark-blue background and yellow button theme. The Pro bottom sheet must have an obvious on-screen close control and support outside-tap and downward-swipe dismissal, rather than depending on Android's Back button.

**Why:** The user said the Profile offer blended into the rest of the screen and that the paywall could only be dismissed with Android Back, which is not available on iPhone.

**How to apply:** Preserve the distinct banner treatment and cross-platform dismissal controls when changing the Profile or paywall. Keep dismissal accessible without a physical or system Back button.

## Verifying a customer's subscription
Use the backend-issued identity for the verified app account before making a claim about that user's entitlement. Do not assume the numeric app user ID is still the RevenueCat identity. An empty email search does not prove that an account has no subscription.

**Why:** RevenueCat email searches can miss customers, and the server-issued identity contract supersedes independently chosen numeric IDs. Legacy mappings need ownership verification.

**How to apply:** Resolve the signed-in account through the backend identity/status flow. Do not infer ownership from recent anonymous activity, a numeric-ID match, or app version alone.

## Apple configuration checks
Distinguish RevenueCat's App Store Connect API credential from its In-App Purchase subscription key. A store-state lookup can fail because the former is absent even when the latter is configured; this alone does not prove receipt validation or purchases are broken.

**Why:** The live RevenueCat store-state API returned a missing App Store Connect credential error while separately reporting the subscription key as configured.

**How to apply:** Report catalog links, store approval, receipt-validation configuration, and completed device purchase tests as separate checks. Do not call a subscription launch-ready solely because the product appears in RevenueCat or the native checkout opens.

## Unspoken prayer requests
Unspoken requests use a generic private-intention message, remain attributed according to the user's normal name/visibility settings, and consume the same daily request allowance. Keep this separate from anonymity.

**Why:** The user approved this behavior for the unspoken-request flow.

**How to apply:** Prefill the message rather than inventing personal details; route it through the normal submission and server quota path.