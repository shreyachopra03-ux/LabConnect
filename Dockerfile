# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:22.11-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Build ----
FROM deps AS builder
COPY . .
RUN npx prisma generate && npm run build

# ---- Runtime ----
# Keeps the Prisma CLI and tsx so the container can run migrations and the demo
# seed on start (scripts/start.sh). A slimmer standalone image is possible once
# demo seeding is no longer needed.
FROM node:22.11-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    STORAGE_DIR=/app/data/storage \
    LIS_EXPORT_DIR=/app/data/lis-export

RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app ./
RUN mkdir -p /app/data && chown -R app:app /app/data

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- http://127.0.0.1:${PORT}/api/health || exit 1
CMD ["sh", "scripts/start.sh"]
