# Refactor To-Do List

## Prioritized refactor plan

### P0 — Shrink the app shell
- [ ] Move tab selection, subtab state, and top-level navigation handlers out of `src/App.jsx`.
- [ ] Leave `src/App.jsx` responsible mainly for bootstrapping, auth, and composing feature containers.
- [ ] Goal: make `src/App.jsx` mostly orchestration, not business logic.

### P1 — Extract the bank feature first
- [x] Pull the bank update flow, bank history, request state, and related handlers into a dedicated bank module or hook.
- [x] Localized request approval/denial form state into `src/components/BankRequestsTab.jsx`.
- [x] Moved archived-request selection state into `src/components/BankRequestHistory.jsx`.
- [x] Removed redundant `src/containers/BankRequestsContainer.jsx` wrapper.
- [ ] This is the highest-value target because it is already fairly isolated and has clear components in `src/components` and `src/hooks/useBankData.js`.

### P1 — Extract admin/officer features
- [ ] Move officer roles, Discord bot config, and admin todo state into a dedicated admin feature module.
- [ ] Remove a large amount of form and mutation logic from the main file.

### P2 — Extract loot council and raid assignments
- [ ] Split assignment state, loot decisions, and related actions into feature-specific hooks/containers.
- [ ] These are important, but slightly more coupled to shared data than the bank flow.

### P2 — Extract roster and signup flows
- [ ] Move roster claim logic and signup state into their own modules once the earlier areas are cleaned up.
- [ ] This reduces the remaining cross-cutting responsibilities in `src/App.jsx`.

### P3 — Clean up shared patterns
- [ ] Consolidate repeated helpers, reduce prop drilling, and standardize the container/hook pattern across the app.
- [ ] This should come after the major feature extraction so the structure is already clearer.

## Suggested execution order for the next session
- First: bank feature extraction
- Second: admin feature extraction
- Third: loot/assignments extraction
- Fourth: roster/signups extraction

## Definition of done
The refactor is “mostly complete” when:

- `src/App.jsx` is no longer the main owner of feature state
- each major feature has its own module or hook
- the app still builds and the main shell remains easy to reason about
