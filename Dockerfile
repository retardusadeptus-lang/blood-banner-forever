# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY guild-loot-api/package*.json ./guild-loot-api/
RUN npm ci

# Vite inlines VITE_* vars at build time. Only the API base URL is build-time;
# the admin secret is NOT shipped to the browser (auth goes via POST /api/login).
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build:prod

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

# Tools needed
RUN apk add --no-cache python3 make g++ nginx gettext

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
RUN cd guild-loot-api && npm ci --omit=dev

# Copy API source
COPY guild-loot-api/ ./guild-loot-api/

# Keep importer input available in production container.
# guild-loot-api/scripts/import-wowhead-item-list.js reads /app/src/wowheaditemlist.csv.
COPY --from=builder /app/src/wowheaditemlist.csv /app/src/wowheaditemlist.csv

# API listens on API_PORT (nginx proxies /api/ to it); nginx serves the SPA on 3000.
# API_PORT can be overridden at runtime (e.g. --env-file); nginx follows it.
ENV API_PORT=4000
EXPOSE 3000 4000

CMD ["/docker-entrypoint.sh"]
