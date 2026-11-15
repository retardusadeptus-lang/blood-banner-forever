# Wow Loot Dashboard - Coolify Deployment

This repository contains a React frontend and an Express backend (`guild-loot-api`) that should run together on Coolify.

## Coolify Deployment Setup

### Recommended deployment mode
Use Docker deployment if possible.

If Coolify is using Nixpacks, this repository is now configured to run the backend and frontend in a single service, but Docker is preferred because it includes the native SQLite dependency build and the shared nginx/API startup contract.

### Environment variables
Copy the contents of `coolify.env` into Coolify environment variables.

### Important values
- `FRONTEND_PORT=3002`
- `API_PORT=4002`
- `PORT=3002`
- `VITE_API_BASE_URL=/api`
- `NIXPACKS_NODE_VERSION=22`
- `NIXPACKS_INSTALL_CMD=npm install`

For Docker deployment, set Coolify's exposed/service port to `3002`, matching `FRONTEND_PORT`. `API_PORT` is an internal container port and must remain different from the frontend port.

### Database persistence

The SQLite database is intentionally not committed to Git. Mount a Coolify persistent volume at `/app/data` and set `GUILD_LOOT_DB_PATH=/app/data/mydb.db`. Docker startup initializes the schema and seeds the canonical 28 class/spec records into a new or empty database volume. It does not import BiS items, demo roster members, Discord data, or other local-only data. Existing database rows are preserved, and rerunning the container startup is safe.

Set `SEED_DEPLOYMENT_DATABASE=false` only if startup seeding should be disabled. To seed a local database manually, run `npm run seed:deployment`.

### Required app secrets
- `ADMIN_API_TOKEN`
- `SESSION_SECRET`
- `BNET_PRIMARY_ADMIN_BATTLETAG`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_BANK_CHANNEL_ID`
- `DISCORD_RECRUITMENT_CHANNEL_ID`
- `BNET_CLIENT_ID`
- `BNET_CLIENT_SECRET`
- `BNET_REGION`
- `REDIRECT_URI`
- `SITE_URL`

`DISCORD_BANK_CHANNEL_ID` and `DISCORD_RECRUITMENT_CHANNEL_ID` are the Discord text-channel IDs where the bot should post bank and recruitment notifications. Enable Developer Mode in Discord, right-click each channel, and choose **Copy Channel ID**. The bot must be able to view and send messages in both channels, and must have **Embed Links** permission for the formatted notifications.

### Battle.net RBAC bootstrapping
- Set `BNET_PRIMARY_ADMIN_BATTLETAG` to the Battle.net account that should be treated as the permanent primary admin (example: `Steve#2506`).
- The primary admin can promote/demote admins and officers.
- Other admins can manage officer roles, but cannot promote/demote admins.

### Battle.net session lifetime
- Battle.net OAuth itself is not the main limiter for your dashboard login state.
- This app keeps Battle.net login sessions in server memory and controls their lifetime via `BNET_SESSION_TTL_HOURS`.
- Set `BNET_SESSION_TTL_HOURS` higher (for example `720`) to keep users logged in longer.
- Restarting the API process clears in-memory sessions and requires users to log in again.

### What this deployment will do
- Start the backend API from `guild-loot-api/server.js`
- Serve built frontend files from `dist`
- Proxy browser requests under `/api` to the backend
- Allow the bot code to run when Discord env vars are present

## Appearance customization

The dashboard header includes an **Appearance** control with selectable colour palettes and site fonts. The selected palette and font are applied across the shared page, panel, navigation, field, and button styles. Expand **Advanced colours** to override individual surface, text, accent, state, or navigation colour tokens; each token can be reset independently or all custom colours can be cleared at once.

Appearance preferences are stored in the current browser's local storage, so they persist for that browser without changing the guild-wide configuration or database. Granular overrides are sparse: colours that have not been customized continue to follow the selected palette and administrator defaults, and resetting an override restores that behavior. A new browser or cleared site data starts with the default **Azure & Banner** palette and **Modern System** font. Available palettes include **Blood & Banner** (Horde red), **Classic Blood & Banner** (the original palette), **Charcoal Banner**, **Blood & Banter**, **Blood & Brass**, **Banner & Bone**, **Blood & Iron**, **Blood & Shadow**, **Midnight & Banner**, and **Blood & Ash** alongside the other fantasy themes. Available fonts include **Modern System**, **Guild Chronicle**, **Tactical Mono**, **Warband Condensed**, **Runestone Serif**, **Guild Scribe**, and **War Room Typewriter**.

## Navigation customization

Battle.net administrators can open **Admin > Sitemap** and use **Move up** or **Move down** on a group or expanded subtab to reorder the main navigation or a subtab within its group. The controls include tabs hidden from some audiences. Select **Save site settings** to persist the layout for all visitors; unsaved changes are only local to the current session. A subtab can also be moved to another group using the Group selector. Changing the order does not change the configured default page.

Navigation links include a `page` query marker based on the stable site-tab ID. For example, `/?page=admin.config` opens Config directly; the same format works for every registered subtab. In-app navigation updates the marker without reloading, and browser Back/Forward follows page-marker history.

## About Us content

Officers and administrators can open **Recruitment > About Us**, choose **Edit Content**, and update the page introduction, guild information, Discord links, and its three content sections. The page always includes a direct **Apply to join** link to the Applications subtab. **Save Changes** persists the content for all visitors; **Discard** leaves the saved version unchanged.

## Recruitment applicant contact

Officers can select **Contact** on an application to send a bespoke Discord DM with joining instructions or a named officer's Discord or Battle.net identity. The application must contain the applicant's numeric 17–20 digit Discord user ID; usernames cannot be resolved by the bot. Each message includes the sending officer's Battle.net identity, is limited to Discord's message size, and reports bot or delivery failures without claiming the message was sent.

## Profile visibility

Character profiles are public by default. In **Profiles > My Characters**, owners can change a profile to **Private**; private profiles remain available to their owner in My Characters but are excluded from **Meet the Guild** for every viewer.

Meet the Guild shows compact public character summaries. Select a summary to open the full character details; matching roster entries add the character's guild role to the summary.

## Default appearance

Officers and administrators can set the default colour palette and site font in **Admin > Config > Site defaults, appearance, and claims**. These defaults apply to visitors who have not chosen a local appearance preference; an individual's Appearance controls continue to override the administrator defaults.

## Notes

- `GUILD_LOOT_DB_PATH` can be left blank to use the default DB file at `guild-loot-api/mydb.db`.
- If you want the backend to serve the frontend directly, the Dockerfile and server are already configured for that flow.
- If you want to rotate secrets later, replace them in Coolify and redeploy.
