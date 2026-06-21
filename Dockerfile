# ---- Stage 1: Build frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

# ---- Stage 2: Production ----
FROM node:20-alpine AS production

WORKDIR /app

# Install nginx for serving the frontend SPA
RUN apk add --no-cache nginx

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx SPA config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Install API production dependencies
COPY guild-loot-api/package*.json ./guild-loot-api/
RUN cd guild-loot-api && npm ci --omit=dev

# Copy API source
COPY guild-loot-api/ ./guild-loot-api/

EXPOSE 80 3000

# Start nginx (frontend) and the API server
CMD sh -c "nginx && node guild-loot-api/server.js"
