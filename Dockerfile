# syntax=docker/dockerfile:1

# ---- Dependencies ----
FROM node:22.11-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Build (also used by the one-off `migrate` service) ----
FROM deps AS builder
COPY . .
RUN npx prisma generate && npm run build

# ---- Runtime: small image, non-root user ----
FROM node:22.11-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/node_modules/.prisma ./node_modules/.prisma
RUN mkdir -p storage/reports lis-export/inbox lis-export/processed lis-export/reports \
 && chown -R app:app storage lis-export

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
