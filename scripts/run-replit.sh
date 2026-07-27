#!/usr/bin/env bash
# Run a Replit overlay command with NODE_PATH pointing at .replit-node_modules.
# Works fully in Cursor — Replit Secrets / Agent credits are not required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

ACTION="${1:-dev}"

# shellcheck disable=SC1091
source "${ROOT}/scripts/load-env-file.sh"
# Cursor-local secrets (preferred when Replit credits are exhausted).
# Existing process env / CI secrets always win over file values.
load_env_file "${ROOT}/.env.replit"
load_env_file "${ROOT}/.env"

if [[ ! -d "${ROOT}/.replit-node_modules/node_modules" ]]; then
  echo "Replit deps missing — running bootstrap..."
  bash "${ROOT}/scripts/bootstrap-replit-deps.sh"
fi

# Vite resolves from client/ upward; point client/node_modules at the isolated
# Replit install so CSS/UI packages resolve without polluting the pnpm tree.
if [[ ! -e "${ROOT}/client/node_modules" ]]; then
  ln -sfn ../.replit-node_modules/node_modules "${ROOT}/client/node_modules"
elif [[ -L "${ROOT}/client/node_modules" ]]; then
  ln -sfn ../.replit-node_modules/node_modules "${ROOT}/client/node_modules"
fi

# shellcheck disable=SC1091
source "${ROOT}/.replit-node-path.env"
export TSX_TSCONFIG_PATH="${ROOT}/tsconfig.replit.json"

# OpenAI client constructs at module load; provide placeholders when unset so
# import graphs (tests / local smoke) do not crash before route handlers run.
export AI_INTEGRATIONS_OPENAI_API_KEY="${AI_INTEGRATIONS_OPENAI_API_KEY:-replit-local-placeholder}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-$AI_INTEGRATIONS_OPENAI_API_KEY}"
export SESSION_SECRET="${SESSION_SECRET:-replit-local-session-secret}"
# server/db.ts requires a URL at import time; offline CI uses a localhost placeholder.
export DATABASE_URL="${DATABASE_URL:-postgresql://user:password@127.0.0.1:5432/replit_offline}"
export NEON_DATABASE_URL="${NEON_DATABASE_URL:-$DATABASE_URL}"
if [[ "${DATABASE_URL}" == *"replit_offline"* || "${DATABASE_URL}" == *"127.0.0.1:5432"* ]]; then
  export MAPABLE_REPLIT_OFFLINE=1
fi

case "${ACTION}" in
  dev)
    exec env NODE_ENV=development tsx --tsconfig tsconfig.replit.json server/index.ts
    ;;
  build)
    exec tsx --tsconfig tsconfig.replit.json scripts/build.ts
    ;;
  start)
    exec env NODE_ENV=production node dist/index.cjs
    ;;
  test)
    # Expand glob under bash so tsx --test receives concrete paths.
    # Default offline suite avoids geo/payments tests that need a live Neon DB.
    # Set REPLIT_TEST_FULL=1 (or REPLIT_TEST_GLOB) in Replit with Neon connected
    # to run the full server/__tests__ suite.
    shopt -s nullglob
    local_files=()
    if [[ -n "${REPLIT_TEST_GLOB:-}" ]]; then
      # shellcheck disable=SC2206
      local_files=(${REPLIT_TEST_GLOB})
    elif [[ "${REPLIT_TEST_FULL:-}" == "1" ]]; then
      local_files=(server/__tests__/*.test.ts)
    else
      echo "Running offline Replit suite (set REPLIT_TEST_FULL=1 for geo/payments)"
      local_files=(server/__tests__/smoke.test.ts server/__tests__/migration-journal.test.ts)
    fi
    if [[ ${#local_files[@]} -eq 0 ]]; then
      echo "No server/__tests__ match for Replit test run" >&2
      exit 1
    fi
    exec tsx --tsconfig tsconfig.replit.json --test "${local_files[@]}"
    ;;
  db:push)
    exec drizzle-kit push --config drizzle.config.replit.ts
    ;;
  *)
    echo "Unknown replit action: ${ACTION}" >&2
    echo "Usage: $0 [dev|build|start|test|db:push]" >&2
    exit 1
    ;;
esac
