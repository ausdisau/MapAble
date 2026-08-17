#!/usr/bin/env bash
# Probe the MapAble-Unified Replit deployment hostname.
set -euo pipefail

URL="${REPLIT_DEPLOY_URL:-https://mapable-unified.replit.app}"
REPLIT_EDITOR="https://replit.com/@ausdisau1/MapAble-Unified"

echo "Checking ${URL} ..."

body=$(curl -sL -A "Mozilla/5.0" "${URL}/" || true)
code=$(curl -sL -o /dev/null -w "%{http_code}" -A "Mozilla/5.0" "${URL}/" || echo "000")

if echo "${body}" | grep -qi "live yet"; then
  echo "Status: NOT LIVE (Replit placeholder — deploy the Repl first)"
  echo "HTTP: ${code}"
  echo "Repl editor: ${REPLIT_EDITOR}"
  exit 2
fi

if [[ "${code}" =~ ^2 ]]; then
  echo "Status: reachable (HTTP ${code})"
  echo "Repl editor: ${REPLIT_EDITOR}"
  exit 0
fi

if [[ "${code}" == "404" ]]; then
  echo "Status: NOT FOUND (HTTP 404 — Repl may be private, renamed, or undeployed)"
  echo "Repl editor: ${REPLIT_EDITOR}"
  echo "Production target for this repo: Vercel (ausdisau/mapableau-new)"
  exit 2
fi

echo "Status: unexpected (HTTP ${code})"
echo "Repl editor: ${REPLIT_EDITOR}"
exit 1
