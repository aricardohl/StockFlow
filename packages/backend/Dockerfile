# syntax=docker/dockerfile:1
# Build context: monorepo root (required — npm workspaces hoists node_modules to root)
# docker compose build / docker build -f packages/backend/Dockerfile .

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Install production dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /monorepo

# Copy workspace manifests first (layer-cache friendly)
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

# Stub the frontend workspace so the packages/* glob in workspaces doesn't fail.
# The frontend has no shared code with the backend — this is a build-time only stub.
RUN mkdir -p packages/frontend && \
    echo '{"name":"frontend","version":"1.0.0","private":true}' \
    > packages/frontend/package.json

# Install only production dependencies for the backend workspace
RUN npm install --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Lean production image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy hoisted node_modules from the deps stage
COPY --from=deps /monorepo/node_modules ./node_modules

# Copy backend source and its package.json
COPY packages/backend/src ./src
COPY packages/backend/package.json ./package.json

EXPOSE 3000

# node_modules are at /app/node_modules (Node resolves upward from /app/src)
CMD ["node", "src/index.js"]
