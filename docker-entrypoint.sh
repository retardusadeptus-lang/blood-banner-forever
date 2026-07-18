#!/bin/sh

# Replace the variable in the Nginx config
API_PORT=${API_PORT:-4000}
envsubst '${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx in the background
nginx -g 'daemon off;' &

# Start the API in the foreground and allow logs to flow to stdout/stderr
cd /app/guild-loot-api && node server.js
