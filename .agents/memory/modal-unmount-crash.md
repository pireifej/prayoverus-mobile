---
name: Modal unmount crash
description: React Native Modal crashes app when its parent component unmounts while a dismissal animation is in progress
---

## The Rule
Never use a `<Modal>` for loading overlays that dismiss at the same time as a component unmounts (e.g. a login screen). Use a plain `<View style={[StyleSheet.absoluteFillObject, {zIndex: 9999}]}>` instead.

**Why:** Calling `setLoading(false)` (which triggers Modal's fade-out animation) immediately before `onLogin()` (which unmounts the component) causes React Native to crash — the native Modal view is mid-animation when React destroys the component tree.

**How to apply:** Any loading overlay on a login/auth screen should be a conditional View, not a Modal:
```jsx
// ❌ Crashes when parent unmounts during fade-out
<Modal visible={loading} animationType="fade" transparent>...</Modal>

// ✅ Safe — no animation, no crash on unmount
{loading && (
  <View style={[styles.loadingOverlay, StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
    ...
  </View>
)}
```

Also: always call `setLoading(false)` BEFORE calling `onLogin()` so the overlay is gone before the component unmounts.
