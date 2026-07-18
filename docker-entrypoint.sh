#!/bin/sh
export API_PORT=4000

# Write to the file that Nginx will actually read
envsubst '${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start Nginx
/usr/sbin/nginx -g 'daemon off;' &

# Start the API
cd /app/guild-loot-api && PORT=4000 node server.js