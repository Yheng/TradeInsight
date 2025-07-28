# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/types/package*.json ./packages/types/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/types/package*.json ./packages/types/
RUN npm ci

# Copy source code
COPY packages/ ./packages/
COPY apps/frontend/ ./apps/frontend/

# Build the application
WORKDIR /app/apps/frontend
RUN npm run build

# Production image
FROM nginx:alpine AS runner

# Copy built application
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]