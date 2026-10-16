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

## Verifying a customer's subscription
Match the app account's numeric user ID to the RevenueCat App User ID before making a claim about that user's entitlement. An empty email search does not prove that the account has no subscription.

**Why:** RevenueCat email searches can return no match when the customer is identified only by the app's numeric ID. Recent activity and app version are not sufficient evidence of customer identity.

**How to apply:** Obtain the account's support ID from Profile or the backend account lookup, then query that exact RevenueCat customer and its active entitlements. Do not infer the account from a recent anonymous customer.