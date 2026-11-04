#!/bin/sh
export FRONTEND_PORT="${FRONTEND_PORT:-3002}"
export API_PORT="${API_PORT:-4002}"

# Write to the file that Nginx will actually read
envsubst '${FRONTEND_PORT} ${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx
/usr/sbin/nginx -g 'daemon off;' &

# Start the API
cd /app/guild-loot-api && PORT="$API_PORT" node server.js