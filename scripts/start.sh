#!/bin/sh
# Container entrypoint: apply migrations, seed demo data on an empty database, start the app.
set -e

echo "[start] applying database migrations"
npx prisma migrate deploy

if [ "$DEMO_MODE" = "true" ]; then
  node scripts/seed-if-empty.mjs
fi

echo "[start] starting app on port ${PORT:-3000}"
exec npx next start -p "${PORT:-3000}"
