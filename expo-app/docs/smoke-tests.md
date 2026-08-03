# Smoke-Test Checklist — Hook-Split Verification

After the refactor that split App.js into `useAuth`, `usePrayers`, and `useIap`,
these manual steps confirm the three critical cross-hook paths still work on a
real device or simulator.

Run this checklist on **both iOS and Android** before shipping any release that
touches `App.js`, `hooks/useAuth.js`, `hooks/usePrayers.js`, or `hooks/useIap.js`.

---

## Path 1: Cold-Launch → Login → Community Feed Loads

These steps verify that `useAuth.checkStoredAuth` → `currentUser` → `usePrayers.loadCommunityPrayers`
still connects correctly across the hook boundary.

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Fully close the app (swipe away from recents). | — |
| 2 | Launch the app fresh (cold start). | Splash / loading indicator appears. |
| 3 | If a cached session exists, wait for boot to complete. | App navigates directly to the Home screen — **no login prompt**. |
| 4 | Confirm the community prayer feed is visible and populated. | At least one prayer card is shown. No "Load Error" toast. |
| 5 | If no cached session: tap **Sign In** and log in with email + password. | Home screen appears after login. |
| 6 | After login, confirm the community feed loads. | Prayer cards appear within a few seconds. |
| 7 | Pull down on the feed to refresh. | Feed refreshes without crashing. |

**What can go wrong after the hook split:**
- `useAuth` sets `currentUser` but `usePrayers` still receives the old `null` value
  because it captured it at render time → feed never loads.
- `loadCommunityPrayers` is called before `isCheckingAuth` clears → skips load
  because `userId` is still null.

---

## Path 2: Amen Tap → Confetti → Modal Closes → Floating +1 pt

These steps verify that `usePrayers.markAsPrayed` → `callbacksRef.onPrayerAnimation`
→ `onAmenComplete` → App.js floating-points animation all still chain correctly.

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | From the Home screen, tap any prayer card. | The prayer modal slides up. A generated prayer text loads. |
| 2 | Wait for (or tap) the **Amen** button. | — |
| 3 | Observe the animation. | Confetti / celebration emojis burst on screen. |
| 4 | Wait ~1 second. | The prayer modal slides **down and closes** automatically. |
| 5 | Observe the prayer card in the feed. | `prayer_count` incremented by 1 optimistically. Card shows user has prayed. |
| 6 | Observe the top of the screen or profile area. | A floating **+1 pt** label animates upward briefly. |
| 7 | Confirm no crash or blank screen. | App is fully responsive; bottom nav is usable. |

**What can go wrong after the hook split:**
- `prayerCallbacksRef.current.onPrayerAnimation` is undefined because App.js
  populated it after the hook was called → no confetti, no floating points.
- `onAmenComplete` is not wired to the `closeModal` call in App.js → modal
  stays open forever after Amen.
- `setCurrentUser` passed to `usePrayers` is stale → faith points don't update.

---

## Path 3: IAP Modal Opens → Price Shows → Purchase Completes Without Crash

These steps verify that `useIap.getIapPrice` returns correctly and `doIapPurchase`
executes end-to-end.

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to the prayer modal for any prayer. | Modal opens. |
| 2 | Tap **Extended Prayer** (or whichever IAP trigger is present). | An IAP purchase sheet or confirmation modal appears. |
| 3 | Confirm a price string is displayed (e.g. "$1.99"). | Price is shown — **not** "null", "undefined", or blank. |
| 4 | Dismiss the IAP sheet without purchasing. | Modal closes cleanly. No crash. |
| 5 | *(Sandbox only)* Tap **Buy** on the IAP modal. | The OS payment sheet appears. |
| 6 | *(Sandbox only)* Complete the sandbox purchase. | Purchase sheet dismisses; a success toast appears. |
| 7 | *(Sandbox only)* Confirm the feature is unlocked immediately. | Extended prayer content is now visible without another prompt. |
| 8 | *(Sandbox only)* Force-kill and relaunch the app. | Entitlement is still active on relaunch (customerInfo persisted by RevenueCat). |

**What can go wrong after the hook split:**
- `rcAvailable` is `false` because module-level SDK bootstrap in `useIap.js`
  threw during import and was swallowed → `getIapPrice` always returns `null`.
- `iapProducts` is empty because `loadIapData` was never called from App.js →
  price is null and purchase throws "Product not found".
- `doIapPurchase` references a stale `iapProducts` list captured before
  `loadIapData` resolved → product lookup fails.

---

## Regression Signals to Watch For in Logs

While running any of the above paths, watch the Metro / Xcode / Logcat console
for these warning patterns that indicate a hook-boundary regression:

| Log message | Likely cause |
|-------------|--------------|
| `⚠️ No user ID available, skipping community load` | `usePrayers` received `currentUser` as null |
| `[IAP] load error:` | RevenueCat SDK bootstrap failed or keys missing |
| `[Boot] Session JSON corrupt` | Corrupt AsyncStorage entry — expected behaviour; verify re-login works |
| `prayFor error:` | Network failure during Amen — verify optimistic update still fires |
| `Error generating prayer:` | API failure in `generatePrayer` — verify modal falls back gracefully |
| `🔴 AppErrorBoundary caught a render crash:` | Render-tree crash — check componentStack in log |

---

## Automated Unit Tests

The three paths above are also covered by Jest unit tests in
`__tests__/hooks/`. Run them with:

```sh
cd expo-app
npx jest
```

These tests mock all native modules and verify:
- `useAuth`: session restore, corrupt-JSON handling, login, logout
- `usePrayers`: feed mapping, Amen optimistic update, 900 ms modal-close timer, generatePrayer fallback
- `useIap`: `getIapPrice` lookup, `hasEntitlement` / `isThemeUnlocked` logic, purchase success/cancel/error paths
