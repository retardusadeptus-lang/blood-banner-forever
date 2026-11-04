#!/bin/sh
set -eu

export FRONTEND_PORT="${FRONTEND_PORT:-3002}"
export API_PORT="${API_PORT:-4002}"
export GUILD_LOOT_DB_PATH="${GUILD_LOOT_DB_PATH:-/app/data/mydb.db}"

mkdir -p "$(dirname "$GUILD_LOOT_DB_PATH")"

# Initialize the mounted database volume without importing loot or guild data.
if [ "${SEED_DEPLOYMENT_DATABASE:-true}" != "false" ]; then
  node /app/guild-loot-api/scripts/seed-deployment-database.js
fi

# Write to the file that Nginx will actually read
envsubst '${FRONTEND_PORT} ${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx
/usr/sbin/nginx -g 'daemon off;' &

# Start the API
cd /app/guild-loot-api && PORT="$API_PORT" node server.js