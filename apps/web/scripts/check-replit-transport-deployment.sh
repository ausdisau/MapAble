#!/usr/bin/env bash
# Probe the MapAble-Transport Replit deployment hostname.
set -euo pipefail

URL="${REPLIT_DEPLOY_URL:-https://mapabletransport.replit.app}"
echo "Checking ${URL} ..."

body=$(curl -sL -A "Mozilla/5.0" "${URL}/" || true)
code=$(curl -sL -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "${URL}/" || echo "000")

if echo "${body}" | grep -qi "live yet"; then
  echo "Status: NOT LIVE (Replit placeholder — deploy the Repl first)"
  echo "HTTP: ${code}"
  echo "Repl editor: https://replit.com/@ausdisau1/MapAble-Transport"
  exit 2
fi

if [[ "${code}" =~ ^2 ]]; then
  echo "Status: reachable (HTTP ${code})"
  exit 0
fi

echo "Status: unexpected (HTTP ${code})"
exit 1
