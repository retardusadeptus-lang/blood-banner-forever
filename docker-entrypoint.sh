#!/bin/sh

# Replace the variable in the Nginx config
export API_PORT=4000
envsubst '${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx in the background
nginx -g 'daemon off;' &

# Start the API in the foreground and log errors to a file
cd /app/guild-loot-api && PORT=4000 node server.js > /var/log/api.log 2>&1