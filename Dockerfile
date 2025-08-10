# ---- Build stage: install deps and build all packages ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy manifest files first for better Docker layer caching
COPY package*.json ./
COPY packages ./packages

# Install dependencies for all workspaces
RUN npm install --workspaces --include-workspace-root

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage: Node + Nginx in a single container ----
FROM node:22-alpine AS runtime
WORKDIR /app

# Install Nginx
RUN apk add --no-cache nginx && mkdir -p /run/nginx

# Copy built app and node_modules from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/package.json /app/package.json

# Nginx config and entrypoint
COPY nginx.conf /etc/nginx/nginx.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# The Node server listens on 3001; Nginx serves on 80
ENV PORT=3001
EXPOSE 80

CMD ["/docker-entrypoint.sh"]


