# API Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/
RUN npm ci

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build the application
WORKDIR /app/apps/api
RUN npm run build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache sqlite curl

WORKDIR /app

# Copy built application and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages ./packages

# Copy package.json for production
COPY apps/api/package*.json ./

# Create necessary directories
RUN mkdir -p data logs backups

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/tradeinsight.db
ENV LOG_DIR=/app/logs
ENV BACKUP_DIR=/app/backups

EXPOSE 3000

CMD ["node", "dist/index.js"]