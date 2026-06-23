#!/bin/sh
set -e

# Render the nginx config so its API proxy targets the same port the backend
# uses (PORT, default 4000). Only ${API_PORT} is substituted — nginx's own
# $uri/$host variables are left untouched.
export API_PORT="${PORT:-4000}"
envsubst '${API_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Start nginx (serves the SPA, proxies /api/) in the background, then run the API.
nginx
exec node guild-loot-api/server.js
