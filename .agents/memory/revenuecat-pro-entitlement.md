---
name: RevenueCat Pro entitlement
description: Subscription gating uses one entitlement and the live monthly package from the current offering.
---

The app's paid feature boundary is the single RevenueCat entitlement `Pray Over Us Pro`; feature code must not introduce separate products or entitlement flags. The paywall reads the monthly package and localized price from RevenueCat's current offering instead of duplicating price data in the client.

**Why:** Keeping entitlement and package selection centralized prevents a purchase from unlocking one feature but not another, and lets App Store/Play Store price changes reach the paywall without an app update.

**How to apply:** Route new premium actions through the shared Pro paywall and check the active entitlement returned by RevenueCat. Keep platform product identifiers and prices in RevenueCat configuration. For catalog changes, use the connected RevenueCat integration and verify the current offering/package/entitlement relationships; its credentials may not be available to local shell scripts.

## Confirmed feature-gating decisions
Free users keep one prayer request per day; additional requests should be blocked with a contextual Pro offer. Keep today's Daily Bread preview free, but gate the full devotional and audio. Add a persistent Pro entry in Profile alongside contextual offers. Prayer Walk is Pro-only.

**Why:** The user selected these boundaries while discussing the subscription transition.

**How to apply:** Use the same `Pray Over Us Pro` entitlement for every gate. A Google Play license-tester account is for test purchases and must not itself grant Pro access.

## Prayer submission outcome
After a successful prayer submission, clear the form's error and close the screen. Zero remaining allowance after that success is not an error. Show the daily-limit error only when an attempted submission actually returns HTTP 403 with `error: "DAILY_LIMIT_REACHED"`. Prevent duplicate submissions while posting, and ensure delayed quota checks cannot overwrite the successful state.

**Why:** The user explicitly required these semantics to distinguish a successful final free post from a rejected additional post.

**How to apply:** Treat the submission response as authoritative. Do not infer rejection from cached daily counts, remaining allowance, or message text.

## Pro presentation and dismissal
The Profile Pro area should be its own separate banner using the paywall's dark-blue background and yellow button theme. The Pro bottom sheet must have an obvious on-screen close control and support outside-tap and downward-swipe dismissal, rather than depending on Android's Back button.

**Why:** The user said the Profile offer blended into the rest of the screen and that the paywall could only be dismissed with Android Back, which is not available on iPhone.

**How to apply:** Preserve the distinct banner treatment and cross-platform dismissal controls when changing the Profile or paywall. Keep dismissal accessible without a physical or system Back button.

## Verifying a customer's subscription
Match the app account's numeric user ID to the RevenueCat App User ID before making a claim about that user's entitlement. An empty email search does not prove that the account has no subscription.

**Why:** RevenueCat email searches can return no match when the customer is identified only by the app's numeric ID. Recent activity and app version are not sufficient evidence of customer identity.

**How to apply:** Obtain the account's support ID from Profile or the backend account lookup, then query that exact RevenueCat customer and its active entitlements. Do not infer the account from a recent anonymous customer.

## Apple configuration checks
Distinguish RevenueCat's App Store Connect API credential from its In-App Purchase subscription key. A store-state lookup can fail because the former is absent even when the latter is configured; this alone does not prove receipt validation or purchases are broken.

**Why:** The live RevenueCat store-state API returned a missing App Store Connect credential error while separately reporting the subscription key as configured.

**How to apply:** Report catalog links, store approval, receipt-validation configuration, and completed device purchase tests as separate checks. Do not call a subscription launch-ready solely because the product appears in RevenueCat or the native checkout opens.

## Unspoken prayer requests
Unspoken requests use a generic private-intention message, remain attributed according to the user's normal name/visibility settings, and consume the same daily request allowance. Keep this separate from anonymity.

**Why:** The user approved this behavior for the unspoken-request flow.

**How to apply:** Prefill the message rather than inventing personal details; route it through the normal submission and server quota path.