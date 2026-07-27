#!/usr/bin/env bash
# Sync cursor-main ↔ replit-agent for dual Cursor/Replit development.
#
# Usage:
#   ./scripts/sync-cursor-replit-branches.sh report
#   ./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit
#   ./scripts/sync-cursor-replit-branches.sh push-replit-into-cursor
#   ./scripts/sync-cursor-replit-branches.sh check-secrets
#   ./scripts/sync-cursor-replit-branches.sh refresh-from-main
#
# Docs: docs/operations/cursor-replit-branch-sync.md

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

ACTION="${1:-report}"
REPORT_DIR="${REPORT_DIR:-/tmp/cursor-replit-branch-sync-report}"
CURSOR_BRANCH="${CURSOR_BRANCH:-cursor-main}"
REPLIT_BRANCH="${REPLIT_BRANCH:-replit-agent}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"

# Replit-owned overlay (prefer Replit on conflict)
REPLIT_PATHS=(
  "client"
  "shared"
  "migrations"
  "attached_assets"
  "ports/mapableau-new"
  ".replit"
  "replit.md"
  "replit.nix"
  "vite.config.replit.ts"
  "drizzle.config.replit.ts"
  "tailwind.config.replit.ts"
  "components.replit.json"
  "server/agentmail-service.ts"
  "server/auto-debit.ts"
  "server/chat-engine.ts"
  "server/chat-guardrails.ts"
  "server/db.ts"
  "server/grocery-supplier.ts"
  "server/index.ts"
  "server/ndis-api.ts"
  "server/notifications.ts"
  "server/orb.ts"
  "server/plan-review-brief.ts"
  "server/quickbooks.ts"
  "server/seed.ts"
  "server/static.ts"
  "server/stripe.ts"
  "server/vite.ts"
  "server/chat"
  "server/geo"
  "server/policy-pack"
  "server/replit_integrations"
  "server/routes"
  "server/storage"
  "server/__tests__"
  "scripts/server"
)

# Cursor-owned production surface (prefer Cursor on conflict)
CURSOR_PATHS=(
  "app"
  "components"
  "lib"
  "prisma"
  "tests"
  "packages"
  "tsconfig.json"
  "pnpm-lock.yaml"
  "next.config.ts"
  "tailwind.config.js"
  "server/admin"
  "server/agents"
  "server/api"
)

SECRET_PATTERNS=(
  'attached_assets/.*\.key$'
  'attached_assets/vercelAPI_.*\.txt$'
  'vercelAPI'
  'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY'
  'sk_live_'
  'sk_test_'
)

die() {
  echo "ERROR: $*" >&2
  exit 1
}

require_clean_or_confirm() {
  if [[ -n "$(git status --porcelain)" ]]; then
    die "Working tree is dirty. Commit or stash before ${ACTION}."
  fi
}

ensure_remote_branch() {
  local branch="$1"
  git fetch origin "${branch}" >/dev/null 2>&1 || die "Missing origin/${branch}. Create it from ${MAIN_BRANCH} first."
}

count_diff_lines() {
  local left="$1"
  local right="$2"
  if [[ ! -e "${left}" && ! -e "${right}" ]]; then
    echo "absent"
    return 0
  fi
  if [[ ! -e "${left}" || ! -e "${right}" ]]; then
    echo "missing"
    return 0
  fi
  diff -ru "${left}" "${right}" 2>/dev/null | wc -l | tr -d ' '
}

run_report() {
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"

  mkdir -p "${REPORT_DIR}"
  local summary="${REPORT_DIR}/summary.txt"
  local details="${REPORT_DIR}/details.diff"
  : > "${details}"

  local cursor_tree
  local replit_tree
  cursor_tree="$(mktemp -d)"
  replit_tree="$(mktemp -d)"
  trap 'rm -rf "${cursor_tree}" "${replit_tree}"' RETURN

  git archive "origin/${CURSOR_BRANCH}" | tar -x -C "${cursor_tree}"
  git archive "origin/${REPLIT_BRANCH}" | tar -x -C "${replit_tree}"

  {
    echo "Cursor ↔ Replit branch sync report"
    echo "Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "cursor: origin/${CURSOR_BRANCH} ($(git rev-parse --short "origin/${CURSOR_BRANCH}"))"
    echo "replit: origin/${REPLIT_BRANCH} ($(git rev-parse --short "origin/${REPLIT_BRANCH}"))"
    echo "main:   origin/${MAIN_BRANCH} ($(git rev-parse --short "origin/${MAIN_BRANCH}" 2>/dev/null || echo n/a))"
    echo ""
    echo "Ahead/behind (replit...cursor): $(git rev-list --left-right --count "origin/${REPLIT_BRANCH}...origin/${CURSOR_BRANCH}")"
    echo ""
    echo "Path drift (diff -ru line counts):"
  } > "${summary}"

  local drift=0
  local rel
  for rel in "${REPLIT_PATHS[@]}" "${CURSOR_PATHS[@]}"; do
    local count
    count="$(count_diff_lines "${replit_tree}/${rel}" "${cursor_tree}/${rel}")"
    if [[ "${count}" == "0" || "${count}" == "absent" ]]; then
      echo "  ${rel}: in sync" >> "${summary}"
    else
      echo "  ${rel}: ${count} diff lines" >> "${summary}"
      drift=$((drift + 1))
      {
        echo ""
        echo "===== ${rel} ====="
        diff -ru "${replit_tree}/${rel}" "${cursor_tree}/${rel}" 2>/dev/null || true
      } >> "${details}"
    fi
  done

  {
    echo ""
    echo "Drift paths: ${drift}"
    echo "Ops doc: docs/operations/cursor-replit-branch-sync.md"
  } >> "${summary}"

  cat "${summary}"
  echo ""
  echo "Full diff written to ${details}"
}

checkout_branch_tracking() {
  local branch="$1"
  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    git checkout "${branch}"
    git reset --hard "origin/${branch}"
  else
    git checkout -B "${branch}" "origin/${branch}"
  fi
}

# Prefer ours for Replit paths when catching up replit-agent with cursor-main.
run_pull_cursor_into_replit() {
  require_clean_or_confirm
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  checkout_branch_tracking "${REPLIT_BRANCH}"

  git merge --no-ff "origin/${CURSOR_BRANCH}" -m "merge: pull origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH}" || true

  local p
  for p in "${REPLIT_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout --ours -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done
  for p in "${CURSOR_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout --theirs -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done

  if [[ -n "$(git ls-files -u)" ]]; then
    echo "Unresolved conflicts remain:"
    git ls-files -u
    die "Resolve remaining conflicts manually, then commit."
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git commit --no-edit 2>/dev/null || \
      git commit -m "merge: pull origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH} (path ownership)"
  fi

  echo "Merged origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH}."
  echo "Validate Replit tests, then: git push -u origin ${REPLIT_BRANCH}"
}

# Prefer theirs (Replit) for overlay paths when merging into cursor-main.
run_push_replit_into_cursor() {
  require_clean_or_confirm
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  checkout_branch_tracking "${CURSOR_BRANCH}"

  git merge --no-ff "origin/${REPLIT_BRANCH}" -m "merge: pull origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH}" || true

  local p
  for p in "${REPLIT_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout --theirs -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done
  for p in "${CURSOR_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout --ours -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done

  if [[ -n "$(git ls-files -u)" ]]; then
    echo "Unresolved conflicts remain:"
    git ls-files -u
    die "Resolve remaining conflicts manually, then commit."
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git commit --no-edit 2>/dev/null || \
      git commit -m "merge: pull origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH} (path ownership)"
  fi

  echo "Merged origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH}."
  echo "Run pnpm type-check && pnpm test, then: git push -u origin ${CURSOR_BRANCH}"
}

run_check_secrets() {
  local failed=0
  local pattern
  echo "Scanning staged + tracked attached_assets and common secret patterns..."

  if git ls-files | grep -E 'attached_assets/.*\.key$' >/dev/null 2>&1; then
    echo "FAIL: tracked *.key under attached_assets/"
    git ls-files | grep -E 'attached_assets/.*\.key$' || true
    failed=1
  fi
  if git ls-files | grep -E 'attached_assets/vercelAPI_.*\.txt$' >/dev/null 2>&1; then
    echo "FAIL: tracked vercelAPI_*.txt under attached_assets/"
    git ls-files | grep -E 'attached_assets/vercelAPI_.*\.txt$' || true
    failed=1
  fi

  for pattern in "${SECRET_PATTERNS[@]}"; do
    if git grep -nI -E "${pattern}" -- ':!docs' ':!*.md' >/dev/null 2>&1; then
      echo "WARN: pattern matched in tree: ${pattern}"
      git grep -nI -E "${pattern}" -- ':!docs' ':!*.md' | head -20 || true
      # Treat private-key / live stripe as hard fail
      if [[ "${pattern}" == *"PRIVATE KEY"* || "${pattern}" == "sk_live_" ]]; then
        failed=1
      fi
    fi
  done

  if [[ "${failed}" -ne 0 ]]; then
    die "Secret scan failed. Remove secrets and rotate credentials."
  fi
  echo "OK: secret scan passed (no hard-fail patterns)."
}

run_refresh_from_main() {
  require_clean_or_confirm
  git fetch origin "${MAIN_BRANCH}" "${CURSOR_BRANCH}" "${REPLIT_BRANCH}" 2>/dev/null || \
    git fetch origin "${MAIN_BRANCH}"

  ensure_remote_branch "${MAIN_BRANCH}"

  for branch in "${CURSOR_BRANCH}" "${REPLIT_BRANCH}"; do
    if git ls-remote --exit-code --heads origin "${branch}" >/dev/null 2>&1; then
      checkout_branch_tracking "${branch}"
      git merge --ff-only "origin/${MAIN_BRANCH}" 2>/dev/null || \
        git merge --no-ff "origin/${MAIN_BRANCH}" -m "merge: refresh ${branch} from origin/${MAIN_BRANCH}"
      git push -u origin "${branch}"
      echo "Refreshed origin/${branch} from origin/${MAIN_BRANCH}"
    else
      git checkout -B "${branch}" "origin/${MAIN_BRANCH}"
      git push -u origin "${branch}"
      echo "Created origin/${branch} from origin/${MAIN_BRANCH}"
    fi
  done
}

case "${ACTION}" in
  report)
    run_report
    ;;
  pull-cursor-into-replit)
    run_pull_cursor_into_replit
    ;;
  push-replit-into-cursor)
    run_push_replit_into_cursor
    ;;
  check-secrets)
    run_check_secrets
    ;;
  refresh-from-main)
    run_refresh_from_main
    ;;
  *)
    echo "Unknown action: ${ACTION}"
    echo "Usage: $0 [report|pull-cursor-into-replit|push-replit-into-cursor|check-secrets|refresh-from-main]"
    exit 1
    ;;
esac
