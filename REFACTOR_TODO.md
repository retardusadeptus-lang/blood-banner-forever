# Refactor To-Do List

## Current status
- [x] The main refactor pass is largely complete.
- [x] The app shell now focuses on orchestration, auth, shared navigation, and composing feature containers.
- [x] Feature-specific state and handlers have been moved into dedicated hooks and containers for bank, admin/officer, loot council, raid assignments, roster, and raid-helper import.
- [x] Frontend build currently succeeds; the targeted lint cleanup for the refactor files is largely complete.
- [ ] The app shell is still large enough that a final shell-reduction pass is still worthwhile if the goal is to make it much easier to read and maintain.

## Runtime safety lessons learned
- [x] A blank-page regression can happen when a new hook or refactor step introduces state that is referenced before its own initialization or before the parent shell has established the required shared state.
- [x] When extracting state into hooks, keep the parent component's initialization order stable: shared tab/state values should exist before any dependent hooks are created, and any hook that depends on parent-owned state should receive it from the parent rather than reaching for a later-initialized value.
- [x] Before landing future refactors, verify the app loads in the browser and check the console for initialization-order errors rather than relying only on a successful build.
- [x] Add a small guardrail checklist for future refactors: confirm hook dependency order, confirm parent-owned state exists before child hooks are invoked, and verify runtime rendering after the change.

## Completed work

### P0 — Shrink the app shell
- [x] Moved substantial tab and subtab state out of the main app shell.
- [x] Kept the main app file focused on bootstrapping, auth, shared state wiring, and container composition.
- [x] The shell is now mostly orchestration rather than business logic.
- [x] Removed the most obvious inline feature-state ownership from the top-level component.

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
- [x] Reduced duplicate inline state wiring around the main feature areas.

## Remaining follow-up work to shrink the shell further

### A. Extract navigation and tab orchestration
- [ ] Move tab/subtab selection logic into a dedicated navigation hook or controller.
- [ ] Move top-level navigation helpers such as main-nav selection and dropdown activation into a reusable navigation module.
- [ ] Centralize tab-to-route mapping so the shell only delegates to a single navigation object.

### B. Extract the app bootstrap and sync layer
- [x] Move the initial data bootstrap and periodic sync logic into a dedicated data-sync hook.
- [ ] Isolate the auth/session bootstrap from the main shell so the top-level component mostly renders instead of coordinating lifecycle concerns.
- [ ] Separate “load data” and “persist changes” concerns from the render tree.

### C. Extract remaining inline helpers from the shell
- [x] Move remaining helper functions such as score calculation, rank badge styling, item-link rendering, and item-opening handlers into utilities or focused hooks.
- [x] Move any remaining one-off handlers for overview/loot/roster interactions into feature-specific modules.
- [x] Replace inline helper constants and ad-hoc state logic with composable modules where appropriate.

### D. Split the main render tree into smaller view components
- [x] Extract the header and navigation section into a dedicated shell component.
- [x] Extract the main tab content router into a dedicated component that maps tab keys to feature containers.
- [x] Consider a small “content renderer” component so App.jsx mostly composes providers, state, and content routers.

### E. Reduce prop plumbing and cross-feature coupling
- [ ] Review the remaining props passed into container components and reduce unnecessary prop drilling.
- [ ] Introduce shared context or a feature-state provider only where it clearly improves clarity.
- [ ] Prefer passing a smaller, feature-specific prop bag to each container than the full shell state object.

### F. Final pass for maintainability
- [ ] Clean up remaining React hook dependency warnings if they are still present.
- [ ] Remove any leftover dead code, comments, and legacy inline branches that no longer serve the refactored structure.
- [ ] Revisit whether any still-large sections of App.jsx should be split into feature-specific components even if they are already using hooks.

## Definition of done
The refactor is now in a “mostly complete” state when:
- the main app file is no longer the primary owner of feature state
- each major feature has its own hook or container module
- the app still builds
- the shell remains easy to reason about, with the top-level component largely focused on composition rather than implementation details

Verified status: the frontend build completed successfully with Vite.
