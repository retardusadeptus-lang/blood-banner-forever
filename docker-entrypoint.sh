#!/bin/sh
PORT="${PORT:-3002}"
API_PORT="${API_PORT:-4002}"
export PORT API_PORT

# Write to the file that Nginx will actually read
envsubst '${PORT} ${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx
/usr/sbin/nginx -g 'daemon off;' &

# Start the API
cd /app/guild-loot-api && node server.js