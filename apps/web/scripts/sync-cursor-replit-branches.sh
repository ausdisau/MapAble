#!/usr/bin/env bash
# Sync cursor-main ↔ replit-agent for dual Cursor/Replit development.
#
# Usage:
#   ./scripts/sync-cursor-replit-branches.sh report
#   ./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit [--push]
#   ./scripts/sync-cursor-replit-branches.sh push-replit-into-cursor [--push]
#   ./scripts/sync-cursor-replit-branches.sh sync-both [--push]
#   ./scripts/sync-cursor-replit-branches.sh check-secrets
#   ./scripts/sync-cursor-replit-branches.sh refresh-from-main
#
# Env:
#   SYNC_PUSH=1          Push after successful merge actions (same as --push)
#   CURSOR_BRANCH        Default: cursor-main
#   REPLIT_BRANCH        Default: replit-agent
#   MAIN_BRANCH          Default: main
#   REPORT_DIR           Default: /tmp/cursor-replit-branch-sync-report
#
# Docs: docs/operations/cursor-replit-branch-sync.md

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

ACTION="${1:-report}"
shift || true

SYNC_PUSH="${SYNC_PUSH:-0}"
for arg in "$@"; do
  case "${arg}" in
    --push) SYNC_PUSH=1 ;;
    *)
      echo "Unknown argument: ${arg}" >&2
      exit 1
      ;;
  esac
done

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
  "package.replit.json"
  "tsconfig.replit.json"
  "scripts/bootstrap-replit-deps.sh"
  "scripts/run-replit.sh"
  "scripts/load-env-file.sh"
  ".env.replit.example"
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

maybe_push_branch() {
  local branch="$1"
  if [[ "${SYNC_PUSH}" == "1" ]]; then
    git push -u origin "${branch}"
    echo "Pushed origin/${branch}"
  else
    echo "Push skipped (set SYNC_PUSH=1 or pass --push). Suggested: git push -u origin ${branch}"
  fi
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

# Prints report; returns 0 when drift==0, 1 when path drift remains.
run_report() {
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  git fetch origin "${MAIN_BRANCH}" >/dev/null 2>&1 || true

  mkdir -p "${REPORT_DIR}"
  local summary="${REPORT_DIR}/summary.txt"
  local details="${REPORT_DIR}/details.diff"
  : > "${details}"

  local cursor_tree
  local replit_tree
  cursor_tree="$(mktemp -d)"
  replit_tree="$(mktemp -d)"

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

  rm -rf "${cursor_tree}" "${replit_tree}"

  if [[ "${drift}" -ne 0 ]]; then
    echo "ERROR: path drift detected (${drift} path(s)). Run sync-both to reconcile." >&2
    return 1
  fi
  return 0
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

apply_path_ownership() {
  # $1 = side for Replit paths: ours|theirs
  # $2 = side for Cursor paths: ours|theirs
  local replit_side="$1"
  local cursor_side="$2"
  local p
  for p in "${REPLIT_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout "--${replit_side}" -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done
  for p in "${CURSOR_PATHS[@]}"; do
    if [[ -e "${p}" ]] || git ls-files --error-unmatch "${p}" >/dev/null 2>&1; then
      git checkout "--${cursor_side}" -- "${p}" 2>/dev/null || true
      git add -- "${p}" 2>/dev/null || true
    fi
  done
}

finish_merge_or_die() {
  local message="$1"
  if [[ -n "$(git ls-files -u)" ]]; then
    echo "Unresolved conflicts remain:"
    git ls-files -u
    die "Resolve remaining conflicts manually, then commit."
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    git commit --no-edit 2>/dev/null || git commit -m "${message}"
  fi
}

# Prefer ours for Replit paths when catching up replit-agent with cursor-main.
run_pull_cursor_into_replit() {
  require_clean_or_confirm
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  checkout_branch_tracking "${REPLIT_BRANCH}"

  git merge --no-ff "origin/${CURSOR_BRANCH}" -m "merge: pull origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH}" || true
  apply_path_ownership ours theirs
  finish_merge_or_die "merge: pull origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH} (path ownership)"

  echo "Merged origin/${CURSOR_BRANCH} into ${REPLIT_BRANCH}."
  maybe_push_branch "${REPLIT_BRANCH}"
}

# Prefer theirs (Replit) for overlay paths when merging into cursor-main.
run_push_replit_into_cursor() {
  require_clean_or_confirm
  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  checkout_branch_tracking "${CURSOR_BRANCH}"

  git merge --no-ff "origin/${REPLIT_BRANCH}" -m "merge: pull origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH}" || true
  apply_path_ownership theirs ours
  finish_merge_or_die "merge: pull origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH} (path ownership)"

  echo "Merged origin/${REPLIT_BRANCH} into ${CURSOR_BRANCH}."
  maybe_push_branch "${CURSOR_BRANCH}"
}

run_check_secrets() {
  local failed=0
  echo "Scanning for tracked secret files and private-key material..."

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

  # Hard-fail only on PEM private key bodies outside docs/tests/scripts allowlist noise.
  # Exclude scanner source, docs, and fixture/test files that intentionally mention patterns.
  local pem_hits
  pem_hits="$(
    git grep -nI -E 'BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY' -- \
      ':!.gitignore' \
      ':!docs/**' \
      ':!*.md' \
      ':!scripts/**' \
      ':!tests/**' \
      ':!server/__tests__/**' \
      ':!scripts/server/__tests__/**' \
      2>/dev/null || true
  )"
  if [[ -n "${pem_hits}" ]]; then
    echo "FAIL: private key material found in tracked files:"
    echo "${pem_hits}" | head -20
    failed=1
  fi

  local live_hits
  live_hits="$(
    git grep -nI -E 'sk_live_[A-Za-z0-9]{20,}' -- \
      ':!.gitignore' \
      ':!docs/**' \
      ':!*.md' \
      ':!scripts/**' \
      ':!tests/**' \
      ':!server/__tests__/**' \
      ':!scripts/server/__tests__/**' \
      2>/dev/null || true
  )"
  if [[ -n "${live_hits}" ]]; then
    echo "FAIL: live Stripe secret pattern found in tracked files:"
    echo "${live_hits}" | head -20
    failed=1
  fi

  if [[ "${failed}" -ne 0 ]]; then
    die "Secret scan failed. Remove secrets and rotate credentials."
  fi
  echo "OK: secret scan passed (no tracked key files or private-key / sk_live_ material)."
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
      # refresh always pushes (production catch-up); SYNC_PUSH only gates directional merges
      git push -u origin "${branch}"
      echo "Refreshed origin/${branch} from origin/${MAIN_BRANCH}"
    else
      git checkout -B "${branch}" "origin/${MAIN_BRANCH}"
      git push -u origin "${branch}"
      echo "Created origin/${branch} from origin/${MAIN_BRANCH}"
    fi
  done
}

run_sync_both() {
  require_clean_or_confirm
  git fetch origin "${MAIN_BRANCH}" "${CURSOR_BRANCH}" "${REPLIT_BRANCH}" \
    || die "Failed to fetch origin/${MAIN_BRANCH}, origin/${CURSOR_BRANCH}, origin/${REPLIT_BRANCH}"

  ensure_remote_branch "${CURSOR_BRANCH}"
  ensure_remote_branch "${REPLIT_BRANCH}"
  run_check_secrets

  local cursor_sha replit_sha
  cursor_sha="$(git rev-parse "origin/${CURSOR_BRANCH}")"
  replit_sha="$(git rev-parse "origin/${REPLIT_BRANCH}")"

  if [[ "${cursor_sha}" == "${replit_sha}" ]]; then
    echo "Tips already equal ($(git rev-parse --short "${cursor_sha}")). Nothing to merge."
    run_report
    return 0
  fi

  echo "Bidirectional sync: cursor → replit, then replit → cursor (path ownership)."
  local saved_push="${SYNC_PUSH}"
  # Defer pushes until both legs succeed.
  SYNC_PUSH=0
  run_pull_cursor_into_replit

  if [[ "${saved_push}" == "1" ]]; then
    git push -u origin "${REPLIT_BRANCH}"
    echo "Pushed origin/${REPLIT_BRANCH}"
    git fetch origin "${REPLIT_BRANCH}"
    run_push_replit_into_cursor
    git push -u origin "${CURSOR_BRANCH}"
    echo "Pushed origin/${CURSOR_BRANCH}"
    SYNC_PUSH="${saved_push}"
    git fetch origin "${CURSOR_BRANCH}" "${REPLIT_BRANCH}"
    run_report
    return 0
  fi

  # Local-only second leg: merge the updated local replit branch into cursor-main.
  checkout_branch_tracking "${CURSOR_BRANCH}"
  git merge --no-ff "${REPLIT_BRANCH}" -m "merge: pull ${REPLIT_BRANCH} into ${CURSOR_BRANCH}" || true
  apply_path_ownership theirs ours
  finish_merge_or_die "merge: pull ${REPLIT_BRANCH} into ${CURSOR_BRANCH} (path ownership)"
  echo "Merged ${REPLIT_BRANCH} into ${CURSOR_BRANCH}."
  echo "Push skipped (set SYNC_PUSH=1 or pass --push). Suggested:"
  echo "  git push -u origin ${REPLIT_BRANCH}"
  echo "  git push -u origin ${CURSOR_BRANCH}"
  SYNC_PUSH="${saved_push}"
  echo "Local sync complete. Origin tips unchanged until you push; report may still show remote drift."
  run_report || true
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
  sync-both)
    run_sync_both
    ;;
  check-secrets)
    run_check_secrets
    ;;
  refresh-from-main)
    run_refresh_from_main
    ;;
  *)
    echo "Unknown action: ${ACTION}"
    echo "Usage: $0 [report|pull-cursor-into-replit|push-replit-into-cursor|sync-both|check-secrets|refresh-from-main] [--push]"
    exit 1
    ;;
esac
