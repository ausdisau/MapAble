#!/usr/bin/env bash
# Import MapAble-Unified from Replit into a sibling directory for review/merge.
# Replit: https://replit.com/@ausdisau1/MapAble-Unified
#
# Prerequisites:
#   - Git access to the Repl (Version control tab in Replit → copy git remote URL)
#   - Optional: REPLIT_GIT_URL override if the default remote fails
#   - Optional: REPLIT_ZIP_PATH for a zip export when git clone is blocked
#
# Usage:
#   ./scripts/import-replit-unified.sh
#   REPLIT_GIT_URL='https://...' ./scripts/import-replit-unified.sh
#   REPLIT_ZIP_PATH='/path/to/MapAble-Unified.zip' ./scripts/import-replit-unified.sh

set -euo pipefail

REPLIT_SLUG="${REPLIT_SLUG:-MapAble-Unified}"
REPLIT_OWNER="${REPLIT_OWNER:-ausdisau1}"
IMPORT_DIR="${IMPORT_DIR:-/tmp/mapable-unified-replit}"
DEFAULT_GIT_URL="https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}.git"
GIT_URL="${REPLIT_GIT_URL:-$DEFAULT_GIT_URL}"

is_replit_page_url() {
  local url="$1"
  [[ "${url}" =~ ^https://replit\.com/@[^/]+/[^/]+(/p)?/?$ ]]
}

normalize_git_url() {
  local url="$1"
  if is_replit_page_url "${url}"; then
    echo "Note: REPLIT_GIT_URL looks like a Replit browser URL, not a git remote." >&2
    echo "      Example of an invalid value: https://replit.com/@user/Repl/p" >&2
    echo "      Copy the HTTPS clone URL from Tools → Version control instead." >&2
    echo "" >&2
    return 1
  fi
  if [[ "${url}" != *.git && "${url}" != *@*:* && "${url}" != git@* ]]; then
    url="${url%/}.git"
  fi
  printf '%s\n' "${url}"
}

if [[ -n "${REPLIT_GIT_URL:-}" ]] && is_replit_page_url "${REPLIT_GIT_URL}"; then
  normalize_git_url "${REPLIT_GIT_URL}" >/dev/null || exit 1
fi

if [[ "${GIT_URL}" =~ ^https://replit\.com/@[^/]+/[^/]+$ ]]; then
  echo "Note: REPLIT_GIT_URL looks like a Replit page URL, not a git remote."
  echo "      Using ${DEFAULT_GIT_URL} instead."
  echo "      For private Repls, copy the HTTPS URL from Tools → Version control."
  echo ""
  GIT_URL="${DEFAULT_GIT_URL}"
elif [[ -n "${REPLIT_GIT_URL:-}" ]]; then
  GIT_URL="$(normalize_git_url "${REPLIT_GIT_URL}")"
fi

extract_zip() {
  local zip_path="$1"
  local target="$2"

  if [[ ! -f "${zip_path}" ]]; then
    echo "Zip not found: ${zip_path}"
    return 1
  fi

  rm -rf "${target}"
  mkdir -p "${target}"
  unzip -q "${zip_path}" -d "${target}"

  # Replit exports often wrap content in a single top-level folder.
  local nested
  nested="$(find "${target}" -mindepth 1 -maxdepth 1 -type d | head -1 || true)"
  if [[ -n "${nested}" && ! -f "${target}/package.json" && -f "${nested}/package.json" ]]; then
    shopt -s dotglob
    mv "${nested}"/* "${target}/"
    shopt -u dotglob
    rmdir "${nested}" 2>/dev/null || true
  fi
}

echo "MapAble Unified — Replit import"
echo "  Source: https://replit.com/@${REPLIT_OWNER}/${REPLIT_SLUG}"
echo "  Target: ${IMPORT_DIR}"
echo ""

if [[ -n "${REPLIT_ZIP_PATH:-}" ]]; then
  echo "Extracting zip export from ${REPLIT_ZIP_PATH} ..."
  extract_zip "${REPLIT_ZIP_PATH}" "${IMPORT_DIR}"
elif [[ -d "${IMPORT_DIR}/.git" ]]; then
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
    echo "  3. Re-run: REPLIT_GIT_URL='<version-control-https-url>' ./scripts/import-replit-unified.sh"
    echo ""
    echo "Or export a zip from Replit and run:"
    echo "  REPLIT_ZIP_PATH='/path/to/MapAble-Unified.zip' ./scripts/import-replit-unified.sh"
    echo ""
    echo "After import, run the sync report:"
    echo "  ./scripts/sync-replit-unified.sh report"
    exit 1
  fi
fi

echo ""
echo "Import ready at ${IMPORT_DIR}"
echo "Suggested merge targets in mapableau-new:"
echo "  Hub:     app/core/, components/core/, lib/core-ui/"
echo "  Auth:    lib/auth/, app/api/auth/"
echo "  Modules: app/lib/modules.ts, app/care/, app/transport/, app/employment/"
echo "  Schema:  prisma/schema.prisma (unified single schema)"
echo "  Docs:    docs/mapable/core-phases.md"
echo ""
echo "Next: ./scripts/sync-replit-unified.sh report"
echo "See docs/operations/replit-mapable-unified-import.md for the full checklist."
