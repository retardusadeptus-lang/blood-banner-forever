# Discord Bot Setup and Usage

This bot runs in the same Node process as the Express API and uses the same better-sqlite3 database connection.

## 1) Environment setup

Create or edit guild-loot-api/.env:

DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=1523795701811908819
DISCORD_GUILD_ID=your_discord_server_id
DISCORD_BANK_CHANNEL_ID=your_bank_notification_channel_id
DISCORD_RECRUITMENT_CHANNEL_ID=your_recruitment_channel_id

Notes:
- DISCORD_GUILD_ID is recommended for fast command registration while testing.
- If DISCORD_GUILD_ID is not set, commands register globally and can take longer to appear.
- The channel IDs are where the bot posts bank and recruitment notifications. The bot needs View Channel, Send Messages, and Embed Links permissions there.

## 2) Start the backend and bot

From guild-loot-api:

npm start

This starts Express API and the Discord bot together.

## 3) Configure role access in the web UI

Open the website and go to Discord Bot Config tab.

You can configure separate role lists for:
- Request command: /request
- Raid signup commands: /raidsignup and /raid signup
- Raid bench command: /raid bench

Each list accepts either:
- Discord role ID
- Exact Discord role name

One role per line (or comma-separated values).

Behavior:
- If a list is empty, that command is unrestricted.
- If a list has values, user must have at least one matching role.
- Absence commands use the linked roster character check described below instead of a role list.

## 4) Commands

/request
- item: required, item autocomplete from items table
- quantity: required
- character: required, roster autocomplete by ID
- reason: optional

/absence list
- Privately lists your upcoming raid absences.

/absence add
- dates: required, comma-separated YYYY-MM-DD dates or ranges

/absence remove
- dates: required, comma-separated YYYY-MM-DD dates or ranges; existing dates are available through autocomplete
- Your Discord account must be linked to a claimed roster character. Signing up for a raid from Discord establishes that character link.

/raid signup
- character: required, roster autocomplete by ID
- Sets roster.in_raid = 1

/raid bench
- character: required, roster autocomplete by ID
- Sets roster.in_raid = 0

/raidsignup chase
- event: required, existing signup event
- delivery: direct messages, the event's signup channel, or both
- Compares active roster characters with the event's existing responses. Declined, tentative, bench, and absence entries count as responses and are not chased.
- Requires the configured raid signup command role. Members without a linked numeric Discord ID are reported but cannot be notified.

Automatic unsigned-member reminders
- The bot checks every minute for open events with a posted Discord signup card.
- It sends direct reminders in the 24-hour window and the 8-hour window before the scheduled start. If the bot starts late, it does not send an expired window's reminder.
- Each member receives at most one successful automatic reminder per window. Failed deliveries retry no more than once per hour, and repeated manual chase requests use a 24-hour cooldown.

## 5) Production process manager (optional)

You can run with PM2:

npm run start:pm2

or

pm2 start server.js --name guild-loot-bot
