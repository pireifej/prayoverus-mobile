---
name: Consumable IAP — Extra Prayer Post
description: Planned feature: charge per additional prayer post beyond the daily free one. Waiting for build 92 (1.0.33) App Store approval before adding.
---

## The feature
- First prayer request per day: free
- Each additional post that same day: costs money via a **Consumable IAP**

## What needs to happen

### App Store Connect
- Create a new In-App Purchase
  - Type: **Consumable** (not Non-Consumable — it gets used up each time)
  - Reference name: `Extra Prayer Post`
  - Product ID: `extra_prayer_post`
  - Suggested price: $0.99

### RevenueCat
- Add `extra_prayer_post` as a product (same process as Extended Prayer and Themes)

### Code (App.js)
- The current gate lives in `proceedToPost()` — look for `dailyPostCountRef.current >= 1`
- Currently: shows ad prompt if AdMob is available, otherwise posts freely
- Change to: if `dailyPostCountRef.current >= 1`, show `Alert.alert` to purchase `extra_prayer_post` consumable, then on success call `doAddPrayer`
- Use same `Alert.alert` pattern as Extended Prayer / Themes (not `setIapModal`) so it renders above any open modals

**Why:** User explicitly wants per-post charging (not an "unlimited posts" subscription). Consumable is the right IAP type because each purchase grants one extra post, not permanent access.

**Hold until:** build 92 / 1.0.33 is approved on the App Store.
