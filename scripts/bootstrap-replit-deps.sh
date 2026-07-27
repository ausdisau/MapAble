#!/usr/bin/env bash
# Install Replit Express+Vite+Drizzle dependencies from package.replit.json
# into .replit-node_modules (isolated from the Next.js / pnpm workspace).
#
# Usage (in Replit or local overlay testing):
#   ./scripts/bootstrap-replit-deps.sh
#
# Docs: docs/operations/cursor-replit-branch-sync.md

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

if [[ ! -f package.replit.json ]]; then
  echo "ERROR: package.replit.json missing" >&2
  exit 1
fi

INSTALL_DIR="${ROOT}/.replit-node_modules"
mkdir -p "${INSTALL_DIR}"
cp package.replit.json "${INSTALL_DIR}/package.json"

# Drop pnpm workspace protocol issues by installing in an isolated folder.
echo "Installing Replit runtime deps into .replit-node_modules/ ..."
(
  cd "${INSTALL_DIR}"
  # Prefer npm here — Replit workflows use npm; lockfile stays local/untracked.
  npm install --no-audit --no-fund --ignore-scripts
)

# Convenience symlink so Node can resolve from repo root when NODE_PATH is set.
if [[ -d node_modules ]] && [[ ! -e node_modules/.replit-overlay ]]; then
  mkdir -p node_modules
fi

cat > "${ROOT}/.replit-node-path.env" <<EOF
# Sourced by Replit workflows / helpers
export NODE_PATH="${INSTALL_DIR}/node_modules\${NODE_PATH:+:\$NODE_PATH}"
export PATH="${INSTALL_DIR}/node_modules/.bin\${PATH:+:\$PATH}"
EOF

echo "OK: Replit deps installed under .replit-node_modules/"
echo "Activate: source .replit-node-path.env"
echo "Then:     npm run dev:replit   /   npm run test:replit"
