#!/usr/bin/env bash
# Run the Playwright e2e suite against a running dev server.
# Usage: ./scripts/run-e2e.sh [grep]
#   E2E_BASE_URL  default http://localhost:5000
set -euo pipefail
cd "$(dirname "$0")/.."

BASE="${E2E_BASE_URL:-http://localhost:5000}"
echo "→ checking $BASE/api/stripe/config"
if ! curl -sf "$BASE/api/stripe/config" > /dev/null; then
  echo "✗ dev server not reachable at $BASE — start the 'Start application' workflow first" >&2
  exit 1
fi

if [[ -n "${1:-}" ]]; then
  exec npx playwright test --grep "$1"
else
  exec npx playwright test
fi
