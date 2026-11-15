# Project TODO

Active backlog for Blood Banner Forever. This list was consolidated from
[`src/archive/to-do.txt`](src/archive/to-do.txt); archived items marked
complete were omitted, repeated items were merged, and the newer requested
items were added below.

## Migration, Architecture, and Operations

- [ ] Configure a permanent redirect from `guild-name-tbc.top` and `www.guild-name-tbc.top` to `forever.guild-name-tbc.top`, preserving paths and query strings.

## Authentication, Permissions, and Discord

- [ ] **In progress:** Complete login fallback behavior:
  - [ ] Fall back to guild-member password authentication if Battle.net OAuth fails.
  - [x] Require authentication for Guild Bank baskets while keeping the bank viewable read-only.
  - [x] Hide Loot Council Priority Overview behind password authentication.
- [ ] Add Discord OAuth2 login.
- [ ] **In progress:** Automatically add new Discord members to the web roster through bot integration.
- [X] Add Discord absence commands so users can add and remove absences directly from Discord.
  - [X] Add private `/absence list`, `/absence add`, and `/absence remove` slash commands.
  - [X] Support comma-separated dates and date ranges with duplicate-safe updates.
  - [X] Use the existing raid absence records so Discord and website absence views stay aligned.
- [X] Add a raid signup chase command that identifies missing signups and supports follow-up notifications.
  - [X] Compare active roster members with existing event responses.
  - [X] Support direct messages, signup-channel reminders, or both.
  - [X] Report unlinked members and delivery failures explicitly.
- [X] Allow the bot to ping people directly when they are unsigned for a raid, with safeguards against duplicate or stale notifications.
  - [X] Send automatic direct reminders in the 24-hour and 8-hour pre-raid windows.
  - [X] Persist per-event, per-member notification markers across restarts.
  - [X] Skip closed, started, and expired reminder windows; throttle failed-delivery retries.

## Applications and Recruitment

- [X] Replace recruitment webhooks with bot-authored channel notifications for received, edited, status-changed, and deleted applications.
- [X] Send application lifecycle DMs, including an `application received` confirmation and later status updates.
- [X] Verify applicant Discord DMs:
  - [X] Confirm the bot is online and can fetch the numeric Discord user ID.
  - [X] Confirm the bot has permission to DM the applicant or shares a server with them.
  - [X] Surface and log delivery failures clearly.
- [X] Allow authorized officers to send bespoke contact messages directly to applicants through the bot, including instructions such as joining Discord or messaging a named officer by Discord or Battle.net identity.
  - [X] Add an officer-only contact endpoint with explicit recipient, bot, and delivery failure responses.
  - [X] Add a Contact Applicant modal with message length limits and delivery feedback.
  - [X] Require the application's Discord value to be a numeric Discord user ID for direct messages.
- [X] Add guild information to About Us with Discord links and a direct link to applications.

## Navigation, Routing, and Site Content

- [X] Allow administrators to reorder subtabs within each navigation group and persist the order.
- [X] Allow administrators to reorder the main navigation groups and persist the order.
- [X] Add URL page markers for direct links to pages such as Config, including links that resolve correctly for every subtab.
- [X] Make About Us sections editable via enter edit mode rather than hard-coded.

## Profiles and Guild Presentation

- [X] Add public/private visibility controls to character details in My Characters; show only public characters to other users via the Meet the Guild tab.
- [X] Show compact character summaries in Meet the Guild and open full details in a modal when a card is selected.
- [X] Include the character's guild role from the roster in the Meet the Guild summary.
- [X] Remove Realm from character cards and related character-detail presentation.

## Appearance and Theming

- [X] Add administrator-configurable default appearance settings to the Config tab.
- [X] Allow users to customize individual appearance elements with advanced, granular colour controls while preserving administrator defaults.
- [X] Test the red-hue site redesign.

## Raid Signups, Assignments, and Attendance

- [ ] **Needs decision:** Add read-only guards that remove Save controls for read-only users while retaining local draft changes or reverting to officer filters.
- [ ] Add raid-log webhook handling to the Discord bot:
  - [ ] Enable and validate Message Content, Guild Messages, and Read Message History access.
  - [ ] Extract Warcraft Logs URLs from messages.
  - [ ] Synchronize detected logs into the Raid Logs page.
- [ ] Finish the Warcraft Logs API integration.
- [ ] **In progress:** Complete the Warcraft Logs GraphQL pipeline:
  - [ ] Build queries for parse percentile and healing metrics.
  - [ ] Schedule a nightly job to sync guild logs into `player_parses`.
  - [ ] Add frontend performance charts with toggleable metrics over time.
  - [ ] Review parse calculation logic for T5-specific and overall median/best averages.

## Guild Bank, Items, and Addon

- [ ] **Needs review:** Investigate why subcategories do not work correctly during Guild Bank export/import.
- [X] Replace Guild Bank webhook notifications with bot-authored messages in the configured bank channel.
- [ ] Add automatic trade-window population back into the addon.
- [ ] Add a site/addon feature to extract the full in-game Guild Roster and guild ranks.
- [ ] **Needs decision:** Add request approval and autotrade import payloads from the site to the addon.
- [ ] Build a WeakAura Assignment Exporter:
  - [ ] Export JSON or Angry Assignments strings from the site for in-game copy/pasting.
  - [ ] Write a companion Lua WeakAura with an embedded JSON parser that renders dynamic text based on the logged-in character.
- [ ] Update the addon and its metadata or compatibility handling so it works in Forever.

## Loot, Resources, and Data Validation

- [ ] Explore direct SoftRes integration with the Discord bot:
  - [ ] Confirm the legacy SoftRes API payload, authentication, and current availability.
  - [ ] Add a feature-flagged SoftRes service for creating a raid from a local signup event.
  - [ ] Map event title, raid, faction, schedule, and reserve settings to SoftRes fields.
  - [ ] Persist the returned SoftRes raid ID and URL against the signup event.
  - [ ] Add an officer-only Discord action to create or update the linked SoftRes raid.
  - [ ] Add a clear manual-link fallback if the legacy API is unavailable or retired.
- [ ] Explore integration options for WowAudit and RCLootCouncil.
