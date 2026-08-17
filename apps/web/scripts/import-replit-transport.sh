#!/usr/bin/env bash
# Import MapAble-Transport from Replit into a sibling directory for review/merge.
# Replit: https://replit.com/@ausdisau1/MapAble-Transport
#
# Prerequisites:
#   - Git access to the Repl (Version control tab in Replit → copy git remote URL)
#   - Optional: REPLIT_GIT_URL override if the default remote fails
#
# Usage:
#   ./scripts/import-replit-transport.sh
#   REPLIT_GIT_URL='https://...' ./scripts/import-replit-transport.sh

set -euo pipefail

REPLIT_SLUG="${REPLIT_SLUG:-MapAble-Transport}"
REPLIT_OWNER="${REPLIT_OWNER:-ausdisau1}"
IMPORT_DIR="${IMPORT_DIR:-/tmp/mapable-transport-replit}"
DEFAULT_GIT_URL="https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}.git"
GIT_URL="${REPLIT_GIT_URL:-$DEFAULT_GIT_URL}"

# Normalize browser URLs (no .git) to the default git remote pattern.
if [[ "${GIT_URL}" =~ ^https://replit\.com/@[^/]+/[^/]+$ ]]; then
  echo "Note: REPLIT_GIT_URL looks like a Replit page URL, not a git remote."
  echo "      Using ${DEFAULT_GIT_URL} instead."
  echo "      For private Repls, copy the HTTPS URL from Tools → Version control."
  echo ""
  GIT_URL="${DEFAULT_GIT_URL}"
fi
if [[ "${GIT_URL}" != *.git ]]; then
  GIT_URL="${GIT_URL%/}.git"
fi

echo "MapAble Transport — Replit import"
echo "  Source: https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
echo "  Target: ${IMPORT_DIR}"
echo ""

if [[ -d "${IMPORT_DIR}/.git" ]]; then
  echo "Existing clone found; fetching latest..."
  git -C "${IMPORT_DIR}" fetch --all --prune
  git -C "${IMPORT_DIR}" pull --ff-only || true
else
  echo "Cloning from ${GIT_URL} ..."
  if ! git clone "${GIT_URL}" "${IMPORT_DIR}" 2>/dev/null; then
    echo ""
    echo "Clone failed (HTTP 403 is common without Replit git credentials)."
    echo ""
    echo "The Repl page URL is NOT the git remote:"
    echo "  ✗ https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
    echo ""
    echo "Steps:"
    echo "  1. Open https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
    echo "  2. Tools → Version control → enable Git, copy the HTTPS clone URL"
    echo "     (often includes a token or repl-specific host — not the @user/slug page)"
    echo "  3. Re-run: REPLIT_GIT_URL='<version-control-https-url>' ./scripts/import-replit-transport.sh"
    echo ""
    echo "Or export a zip from Replit and extract to IMPORT_DIR=${IMPORT_DIR}"
    echo ""
    echo "After clone, compare with this monorepo:"
    echo "  diff -ru ${IMPORT_DIR}/app /workspace/app/dashboard/transport 2>/dev/null | head"
    echo "  diff -ru ${IMPORT_DIR}/api /workspace/app/api/transport 2>/dev/null | head"
    exit 1
  fi
fi

echo ""
echo "Clone ready at ${IMPORT_DIR}"
echo "Suggested merge targets in mapableau-new:"
echo "  UI:     app/transport/, app/dashboard/transport/, app/driver/"
echo "  API:    app/api/transport/, app/api/driver/transport/"
echo "  Domain: lib/transport/, lib/transport-routing/"
echo "  Schema: prisma/schema.prisma (TransportTrip, TransportBooking, …)"
echo ""
echo "See docs/operations/replit-mapable-transport-import.md for the full checklist."
