---
name: React Native archive sheets
description: Layout constraint for scrollable bottom-sheet archive modals
---

A scrollable archive inside a React Native bottom sheet needs a parent with an explicit height; `flex: 1` plus only `maxHeight` can collapse the content area while leaving the header and close control visible.

**Why:** The archive modal rendered only its title and Close button because the sheet's auto-sized layout gave its flex scroll view no measurable height.

**How to apply:** For similar modal sheets, set an explicit or minimum sheet height before relying on a flex child to occupy the remaining space.