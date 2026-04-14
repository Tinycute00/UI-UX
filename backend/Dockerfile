# ============================================================
# Stage 1: Builder — install all deps + compile TypeScript
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source code (tsconfig.json excludes *.test.ts)
COPY src/ ./src/

# Compile TypeScript → dist/
RUN npm run build

# ============================================================
# Stage 2: Runtime — production image with compiled JS only
# ============================================================
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy dependency manifests for production install
COPY package*.json ./

# Install production dependencies only (no devDependencies)
RUN npm ci --omit=dev

# Expose the default Fastify port
EXPOSE 3000

# Start the server
CMD ["node", "dist/server.js"]