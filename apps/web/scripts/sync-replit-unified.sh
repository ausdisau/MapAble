#!/usr/bin/env bash
# Sync MapAble-Unified (Replit) with mapableau-new.
# Replit: https://replit.com/@ausdisau1/MapAble-Unified
#
# Usage:
#   ./scripts/sync-replit-unified.sh              # import (if possible) + diff report
#   ./scripts/sync-replit-unified.sh import     # clone or extract zip only
#   ./scripts/sync-replit-unified.sh report     # diff report (requires IMPORT_DIR)
#   ./scripts/sync-replit-unified.sh check      # probe Replit deployment URL
#
# Auth / offline import:
#   REPLIT_GIT_URL='https://...' ./scripts/sync-replit-unified.sh
#   REPLIT_ZIP_PATH='/path/to/MapAble-Unified.zip' ./scripts/sync-replit-unified.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMPORT_DIR="${IMPORT_DIR:-/tmp/mapable-unified-replit}"
REPORT_DIR="${REPORT_DIR:-/tmp/mapable-unified-sync-report}"
ACTION="${1:-all}"

MONOREPO_PATHS=(
  "app/core"
  "app/lib/modules.ts"
  "components/core"
  "lib/platform/core-ui"
  "lib/auth"
  "app/api/auth"
  "prisma/schema.prisma"
)

run_import() {
  REPLIT_GIT_URL="${REPLIT_GIT_URL:-}" \
  REPLIT_ZIP_PATH="${REPLIT_ZIP_PATH:-}" \
  IMPORT_DIR="${IMPORT_DIR}" \
    "${ROOT}/scripts/import-replit-unified.sh"
}

run_check() {
  "${ROOT}/scripts/check-replit-unified-deployment.sh"
}

count_diff_lines() {
  local left="$1"
  local right="$2"
  if [[ ! -e "${left}" || ! -e "${right}" ]]; then
    echo "missing"
    return 0
  fi
  diff -ru "${left}" "${right}" 2>/dev/null | wc -l | tr -d ' '
}

run_report() {
  if [[ ! -d "${IMPORT_DIR}" ]]; then
    echo "Import directory not found: ${IMPORT_DIR}"
    echo "Run: ./scripts/sync-replit-unified.sh import"
    exit 1
  fi

  mkdir -p "${REPORT_DIR}"
  local summary="${REPORT_DIR}/summary.txt"
  local details="${REPORT_DIR}/details.diff"

  {
    echo "MapAble-Unified sync report"
    echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Monorepo: ${ROOT}"
    echo "Replit import: ${IMPORT_DIR}"
    echo ""
    echo "Path drift (line count from diff -ru):"
  } > "${summary}"

  : > "${details}"

  local drift=0
  for rel in "${MONOREPO_PATHS[@]}"; do
    local mono="${ROOT}/${rel}"
    local repl="${IMPORT_DIR}/${rel}"
    local count
    count="$(count_diff_lines "${repl}" "${mono}")"

    if [[ "${count}" == "missing" ]]; then
      echo "  ${rel}: missing on one side" >> "${summary}"
      drift=$((drift + 1))
      continue
    fi

    if [[ "${count}" == "0" ]]; then
      echo "  ${rel}: in sync" >> "${summary}"
    else
      echo "  ${rel}: ${count} diff lines" >> "${summary}"
      drift=$((drift + 1))
      {
        echo ""
        echo "===== ${rel} ====="
        diff -ru "${repl}" "${mono}" 2>/dev/null || true
      } >> "${details}"
    fi
  done

  echo "" >> "${summary}"
  echo "Drift paths: ${drift}/${#MONOREPO_PATHS[@]}" >> "${summary}"
  echo "" >> "${summary}"
  echo "Merge checklist: docs/operations/replit-mapable-unified-import.md" >> "${summary}"

  cat "${summary}"
  echo ""
  echo "Full diff written to ${details}"
}

case "${ACTION}" in
  import)
    run_import
    ;;
  report)
    run_report
    ;;
  check)
    run_check
    ;;
  all)
    if run_import; then
      echo ""
      run_report
    else
      echo ""
      echo "Import blocked — running deployment check and monorepo verification instead."
      run_check || true
      echo ""
      echo "Monorepo already hosts the Unified shell. Verify with:"
      echo "  pnpm test tests/mapable-core-ui.test.ts tests/module-routes.test.ts"
      exit 1
    fi
    ;;
  *)
    echo "Unknown action: ${ACTION}"
    echo "Usage: $0 [import|report|check|all]"
    exit 1
    ;;
esac
