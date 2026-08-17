#!/usr/bin/env bash
set -euo pipefail

echo "Installing workspace dependencies from pnpm-lock.yaml..."
pnpm install --frozen-lockfile

echo "Generating Prisma Client..."
pnpm exec prisma generate

echo "MapAble cloud agent setup complete."
