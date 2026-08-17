#!/bin/bash
set -e
# Prefer Replit overlay bootstrap when package.replit.json is present.
if [[ -f package.replit.json ]]; then
  bash scripts/bootstrap-replit-deps.sh
  npx drizzle-kit push --config drizzle.config.replit.ts 2>&1 || true
else
  npm install --prefer-offline --no-audit --no-fund 2>&1
  npx drizzle-kit push 2>&1 || true
fi
