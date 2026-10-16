---
name: EAS monorepo archive
description: Which ignore files affect EAS archives when the Expo project is in a repository subdirectory
---

# EAS Archives May Use the Git Repository Root

When EAS is launched from the Expo app's subdirectory in this monorepo, its source archive can be rooted at the Git repository root. The root `.gitignore` hierarchy then governs workspace files. A nested `expo-app/.easignore` does not filter root-level siblings such as workspace caches or uploaded attachments.

**Why:** EAS archive inspection showed that the uploaded source included repository-root files in addition to the Expo project. A root `.easignore` replaces `.gitignore` rules rather than merging with them, so adding one without carrying over the existing ignore patterns can unexpectedly include local files or change which build inputs are sent.

**How to apply:** Inspect the actual archive with `eas build:inspect --platform android --stage archive` before changing ignore rules. For a few safe root-only exclusions, prefer narrowly scoped root `.gitignore` entries; if using a root `.easignore`, preserve every required existing ignore rule and verify native source, app assets, lockfiles, and config plugins remain in the archive.
