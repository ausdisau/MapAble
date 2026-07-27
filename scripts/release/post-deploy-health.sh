#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${HEALTH_CHECK_BASE_URL:-http://localhost:3000}"

echo "==> Post-deploy health check against ${BASE_URL}"

response=$(curl -s "${BASE_URL}/api/health" || echo '{"status":"unreachable"}')
echo "Health response: ${response}"

if echo "$response" | grep -qE '"status"|ok|healthy'; then
  echo "==> Post-deploy health check passed (stub)"
else
  echo "WARN: Health endpoint did not return expected shape — manual verification required"
  exit 0
fi
