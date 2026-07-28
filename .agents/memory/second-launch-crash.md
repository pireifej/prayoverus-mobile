---
name: Second-launch crash after Google login
description: iOS app crashed immediately on second cold launch after Google OAuth login; root cause and fix confirmed.
---

## The Rule
Never put `Linking.getInitialURL()` inside a useEffect that has `currentUser` or `isCheckingAuth` in its dependency array.

**Why:** The effect re-runs every time those values change (3 times on second launch: mount, session restore, auth check complete). On each re-run iOS can replay the stale Google OAuth redirect URL (`prayoverus://auth?code=...`) into `getInitialURL()`, which triggers deep-link handling before the app is ready and crashes it silently.

**How to apply:**
- `getInitialURL()` must live in a `useEffect(() => { ... }, [])` — empty deps, runs exactly once per cold launch.
- The live `Linking.addEventListener` listener can also be mount-only (`[]`) if it reads current state via refs instead of closure variables.
- Explicitly ignore any URL containing `prayoverus://auth` in the initial-URL handler — OAuth redirects are already consumed during login and must not be replayed.
- Add an `AppErrorBoundary` class component wrapping the root export so future render crashes show on screen instead of silently closing the app.
