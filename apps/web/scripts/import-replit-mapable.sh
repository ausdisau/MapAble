#!/usr/bin/env bash
# Import MapAble Repls from Replit for review/merge into mapableau-new.
#
# Usage:
#   ./scripts/import-replit-mapable.sh              # care + unified
#   ./scripts/import-replit-mapable.sh care         # MapAble-for-Care only
#   ./scripts/import-replit-mapable.sh unified      # MapAble-Unified only
#   ./scripts/import-replit-mapable.sh all          # care, unified, and transport
#
# Override git remotes when Replit auth is required:
#   REPLIT_CARE_GIT_URL='...' REPLIT_UNIFIED_GIT_URL='...' ./scripts/import-replit-mapable.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-both}"

run_care() {
  REPLIT_GIT_URL="${REPLIT_CARE_GIT_URL:-${REPLIT_GIT_URL:-}}" \
    IMPORT_DIR="${IMPORT_DIR_CARE:-/tmp/mapable-for-care-replit}" \
    "${ROOT}/scripts/import-replit-care.sh"
}

run_unified() {
  REPLIT_GIT_URL="${REPLIT_UNIFIED_GIT_URL:-${REPLIT_GIT_URL:-}}" \
    IMPORT_DIR="${IMPORT_DIR_UNIFIED:-/tmp/mapable-unified-replit}" \
    "${ROOT}/scripts/import-replit-unified.sh"
}

run_transport() {
  if [[ -x "${ROOT}/scripts/import-replit-transport.sh" ]]; then
    REPLIT_GIT_URL="${REPLIT_TRANSPORT_GIT_URL:-${REPLIT_GIT_URL:-}}" \
      IMPORT_DIR="${IMPORT_DIR_TRANSPORT:-/tmp/mapable-transport-replit}" \
      "${ROOT}/scripts/import-replit-transport.sh"
  else
    echo "Transport import script not found. See docs/operations/replit-imports.md."
    return 1
  fi
}

run_marketplace() {
  if [[ -x "${ROOT}/scripts/import-replit-marketplace.sh" ]]; then
    REPLIT_GIT_URL="${REPLIT_MARKETPLACE_GIT_URL:-${REPLIT_GIT_URL:-}}" \
      IMPORT_DIR="${IMPORT_DIR_MARKETPLACE:-/tmp/mapable-marketplace-replit}" \
      "${ROOT}/scripts/import-replit-marketplace.sh"
  else
    echo "Marketplace import script not found."
    return 1
  fi
}

case "${TARGET}" in
  care)
    run_care
    ;;
  unified)
    run_unified
    ;;
  both)
    run_care
    echo ""
    run_unified
    ;;
  all)
    run_care
    echo ""
    run_unified
    echo ""
    run_transport || true
    echo ""
    run_marketplace || true
    ;;
  marketplace)
    run_marketplace
    ;;
  *)
    echo "Unknown target: ${TARGET}"
    echo "Usage: $0 [care|unified|both|all|marketplace]"
    exit 1
    ;;
esac

echo ""
echo "Import clones complete. See docs/operations/replit-imports.md for merge guidance."
