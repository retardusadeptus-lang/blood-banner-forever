# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY guild-loot-api/package*.json ./guild-loot-api/
RUN npm ci --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

# Vite inlines VITE_* vars at build time. Only the API base URL is build-time;
# the admin secret is NOT shipped to the browser (auth goes via POST /api/login).
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build:prod

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

# Tools needed for API scripts and SQLite-based DB work on deployment
RUN apk add --no-cache python3 sqlite make g++ nginx gettext

# Verify nginx installation
RUN nginx -v

# Add this line right before you copy your nginx.conf
RUN mkdir -p /etc/nginx/http.d/

WORKDIR /app

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Install the SPA + API reverse-proxy nginx config as a template; the entrypoint
# renders it at startup so the proxy targets the runtime PORT.
COPY nginx.conf /etc/nginx/http.d/default.conf.template

# Startup script: render nginx config, start nginx, run the API
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Install API production dependencies
COPY guild-loot-api/package*.json ./guild-loot-api/
RUN cd guild-loot-api && npm ci --omit=dev --fetch-retries=5 --fetch-retry-factor=2 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=120000

# Copy API source, including BIS data and helper scripts needed for deployment
COPY guild-loot-api/ ./guild-loot-api/

# Keep importer input available in production container.
# guild-loot-api/scripts/import-wowhead-item-list.js reads /app/src/wowheaditemlist.csv.
# The CSV lives in `src/archive` in the repo; copy it from the build context.
COPY src/archive/wowheaditemlist.csv /app/src/wowheaditemlist.csv

# Ensure the working app root is the same in all environments when scripts are run on the container.
ENV BIS_CSV_PATH="/app/guild-loot-api/BIS Lists/all-bis-items.csv"

# API listens on API_PORT (nginx proxies /api/ to it); nginx serves the SPA on FRONTEND_PORT.
# Both ports can be overridden at runtime by Coolify environment variables.
ENV FRONTEND_PORT=3002
ENV API_PORT=4002
EXPOSE 3002 4002

CMD ["/docker-entrypoint.sh"]
