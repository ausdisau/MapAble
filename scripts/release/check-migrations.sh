#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking Prisma migration status"
pnpm prisma validate
pnpm prisma migrate status

echo "==> Migration check passed (no drift action taken in CI stub)"
