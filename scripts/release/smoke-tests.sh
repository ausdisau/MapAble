#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SMOKE_TEST_BASE_URL:-http://localhost:3000}"

echo "==> Smoke tests against ${BASE_URL}"

# Lightweight stubs — extend for live staging
check_endpoint() {
  local path="$1"
  local expected="${2:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" || echo "000")
  if [[ "$code" != "$expected" && "$code" != "401" && "$code" != "403" ]]; then
    echo "WARN: ${path} returned ${code} (expected ${expected}, 401, or 403)"
  else
    echo "OK: ${path} -> ${code}"
  fi
}

check_endpoint "/api/health" "200"
check_endpoint "/status" "200"

echo "==> Smoke tests complete (stub)"
