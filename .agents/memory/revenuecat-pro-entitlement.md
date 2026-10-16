---
name: RevenueCat Pro entitlement
description: Subscription gating uses one entitlement and the live monthly package from the current offering.
---

The app's paid feature boundary is the single RevenueCat entitlement `Pray Over Us Pro`; feature code must not introduce separate products or entitlement flags. The paywall reads the monthly package and localized price from RevenueCat's current offering instead of duplicating price data in the client.

**Why:** Keeping entitlement and package selection centralized prevents a purchase from unlocking one feature but not another, and lets App Store/Play Store price changes reach the paywall without an app update.

**How to apply:** Route new premium actions through the shared Pro paywall and check the active entitlement returned by RevenueCat. Keep platform product identifiers and prices in RevenueCat configuration. For catalog changes, use the connected RevenueCat integration and verify the current offering/package/entitlement relationships; its credentials may not be available to local shell scripts.