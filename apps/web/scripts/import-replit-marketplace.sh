#!/usr/bin/env bash
# Import MapAble-Marketplace from Replit into a sibling directory for review/merge.
# Replit: https://replit.com/@ausdisau1/MapAble-Marketplace
#
# Usage:
#   ./scripts/import-replit-marketplace.sh
#   REPLIT_GIT_URL='https://...' ./scripts/import-replit-marketplace.sh

set -euo pipefail

REPLIT_SLUG="${REPLIT_SLUG:-MapAble-Marketplace}"
REPLIT_OWNER="${REPLIT_OWNER:-ausdisau1}"
IMPORT_DIR="${IMPORT_DIR:-/tmp/mapable-marketplace-replit}"
DEFAULT_GIT_URL="https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}.git"
GIT_URL="${REPLIT_GIT_URL:-$DEFAULT_GIT_URL}"

echo "MapAble Marketplace — Replit import"
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
    echo "Clone failed. Replit git often requires authentication or a URL from the Repl UI."
    echo "Steps:"
    echo "  1. Open https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
    echo "  2. Tools → Version control → copy the HTTPS git remote"
    echo "  3. Re-run: REPLIT_GIT_URL='<your-remote>' ./scripts/import-replit-marketplace.sh"
    echo ""
    echo "After clone, compare with this monorepo:"
    echo "  diff -ru ${IMPORT_DIR}/app /workspace/app/marketplace 2>/dev/null | head"
    echo "  diff -ru ${IMPORT_DIR}/components /workspace/components/marketplace 2>/dev/null | head"
    exit 1
  fi
fi

echo ""
echo "Clone ready at ${IMPORT_DIR}"
echo "Suggested merge targets in mapableau-new:"
echo "  UI:        app/marketplace/, components/marketplace/"
echo "  Catalog:   lib/marketplace/catalog.ts (or Prisma product model)"
echo "  API:       app/api/marketplace/"
echo "  Checkout:  app/api/billing/invoices (serviceType: marketplace)"
echo "  Admin:     app/admin/partner-marketplace/ (B2B listings, separate)"
echo ""
echo "See docs/operations/replit-mapable-marketplace-import.md for the full checklist."
