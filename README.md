# Wow Loot Dashboard - Coolify Deployment

This repository contains a React frontend and an Express backend (`guild-loot-api`) that should run together on Coolify.

## Coolify Deployment Setup

### Recommended deployment mode
Use Docker deployment if possible.

If Coolify is using Nixpacks, this repository is now configured to run the backend and frontend in a single service.

### Environment variables
Copy the contents of `coolify.env` into Coolify environment variables.

### Important values
- `PORT=3000`
- `API_PORT=4000`
- `VITE_API_BASE_URL=/api`
- `NIXPACKS_NODE_VERSION=22`
- `NIXPACKS_INSTALL_CMD=npm install`

### Required app secrets
- `ADMIN_API_TOKEN`
- `SESSION_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_GUILD_ID`
- `DISCORD_WEBHOOK_URL`
- `BNET_CLIENT_ID`
- `BNET_CLIENT_SECRET`
- `BNET_REGION`
- `REDIRECT_URI`
- `SITE_URL`

### What this deployment will do
- Start the backend API from `guild-loot-api/server.js`
- Serve built frontend files from `dist`
- Proxy browser requests under `/api` to the backend
- Allow the bot code to run when Discord env vars are present

## Notes

- `GUILD_LOOT_DB_PATH` can be left blank to use the default DB file at `guild-loot-api/mydb.db`.
- If you want the backend to serve the frontend directly, the Dockerfile and server are already configured for that flow.
- If you want to rotate secrets later, replace them in Coolify and redeploy.
