#!/usr/bin/env bash
set -euo pipefail

echo "==> CareOS rollback guidance (stub)"
echo "1. Set MAPABLE_NATIONAL_PLATFORM_ENABLED=false and redeploy"
echo "2. See docs/careos/ROLLBACK.md for application rollback"
echo "3. Database rollback requires reviewed forward migration — do not drop data"
echo "4. If DR failover was triggered, follow docs/disaster-recovery/README.md rollback section"

echo "==> Rollback script complete (no automated rollback executed)"
