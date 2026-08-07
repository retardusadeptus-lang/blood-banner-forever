# Refactor To-Do List

## Current status
- [x] The main refactor pass is largely complete.
- [x] The app shell now focuses on orchestration, auth, shared navigation, and composing feature containers.
- [x] Feature-specific state and handlers have been moved into dedicated hooks and containers for bank, admin/officer, loot council, raid assignments, roster, and raid-helper import.
- [x] Frontend build currently succeeds; the targeted lint cleanup for the refactor files is largely complete.

## Completed work

### P0 — Shrink the app shell
- [x] Moved substantial tab and subtab state out of the main app shell.
- [x] Kept the main app file focused on bootstrapping, auth, shared state wiring, and container composition.
- [x] The shell is now mostly orchestration rather than business logic.

### P1 — Extract the bank feature
- [x] Extracted bank data flows, request state, and related handlers into the bank hook/container path.
- [x] Localized request approval and denial form state into the bank request UI.
- [x] Moved archived-request selection state into the history UI.
- [x] Removed the redundant bank requests wrapper.

### P1 — Extract admin/officer features
- [x] Moved officer roles, Discord bot config, and admin todo state into the admin feature flow.
- [x] Reduced the amount of admin form and mutation logic directly owned by the main app file.

### P2 — Extract loot council and raid assignments
- [x] Extracted loot council state, filters, assignment actions, and save flow into dedicated hook/container logic.
- [x] Extracted raid assignment state, archive/restore actions, and boss-zone handlers into a dedicated hook/container path.

### P2 — Extract roster and signup flows
- [x] Moved roster and attendance logic into the roster hook/container flow.
- [x] Moved raid-helper import handling into the dedicated import hook and connected it to roster state updates.
- [x] Kept the signup feature orchestration lightweight while moving the feature-specific logic into the dedicated module path.

### P3 — Clean up shared patterns
- [x] Reduced obvious prop-drilling and stale state patterns created during the refactor pass.
- [x] Cleaned up the most visible lint issues introduced by the refactor.
- [ ] Optional follow-up polish for remaining non-blocking warnings if desired.

## Remaining follow-up
- [ ] Optionally clean up the remaining React hook dependency warnings in the refactor files.
- [ ] Optionally do a final pass to simplify any remaining cross-feature props if the UI continues to grow.

## Definition of done
The refactor is now in a “mostly complete” state when:
- the main app file is no longer the primary owner of feature state
- each major feature has its own hook or container module
- the app still builds and the shell remains easy to reason about

Verified status: the frontend build completed successfully with Vite.
