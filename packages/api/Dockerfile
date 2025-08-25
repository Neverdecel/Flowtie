# Multi-stage build for API
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/api/package.json ./packages/api/
RUN npm install --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY packages/api/package.json ./packages/api/
RUN npm install

# Copy source code
COPY packages/api ./packages/api/
WORKDIR /app/packages/api

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nextjs:nodejs /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./packages/api/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/package.json ./packages/api/

# Set working directory to API package
WORKDIR /app/packages/api

USER nextjs

EXPOSE 3001

ENV PORT 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]