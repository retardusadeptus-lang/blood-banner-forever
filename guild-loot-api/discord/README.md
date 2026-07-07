# Discord Bot Setup and Usage

This bot runs in the same Node process as the Express API and uses the same better-sqlite3 database connection.

## 1) Environment setup

Create or edit guild-loot-api/.env:

DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=1523795701811908819
DISCORD_GUILD_ID=your_discord_server_id

Notes:
- DISCORD_GUILD_ID is recommended for fast command registration while testing.
- If DISCORD_GUILD_ID is not set, commands register globally and can take longer to appear.

## 2) Start the backend and bot

From guild-loot-api:

npm start

This starts Express API and the Discord bot together.

## 3) Configure role access in the web UI

Open the website and go to Discord Bot Config tab.

You can configure separate role lists for:
- Request command: /request
- Raid signup command: /raid signup
- Raid bench command: /raid bench

Each list accepts either:
- Discord role ID
- Exact Discord role name

One role per line (or comma-separated values).

Behavior:
- If a list is empty, that command is unrestricted.
- If a list has values, user must have at least one matching role.

## 4) Commands

/request
- item: required, item autocomplete from items table
- quantity: required
- character: required, roster autocomplete by ID
- reason: optional

/raid signup
- character: required, roster autocomplete by ID
- Sets roster.in_raid = 1

/raid bench
- character: required, roster autocomplete by ID
- Sets roster.in_raid = 0

## 5) Production process manager (optional)

You can run with PM2:

npm run start:pm2

or

pm2 start server.js --name guild-loot-bot
