# CareOS Release Engineering

Phase 15 release pipeline for national platform deployments. **Production deployment requires manual approval.**

## Pipeline stages

1. **Migration check** — `prisma migrate status` + validate
2. **Security gate** — Semgrep stub (see `.github/workflows/semgrep.yml`)
3. **Accessibility gate** — stub check
4. **Staging deploy** — stub (no live deploy in CI)
5. **Smoke tests** — `scripts/release/smoke-tests.sh`
6. **Manual production approval** — GitHub environment protection
7. **Production deploy** — stub
8. **Post-deploy health** — `scripts/release/post-deploy-health.sh`
9. **Rollback** — documented in `docs/careos/ROLLBACK.md`

## Workflow

`.github/workflows/careos-release.yml` orchestrates the above. Production job uses `environment: production` for required reviewers.

## Scripts

| Script | Purpose |
| ------ | ------- |
| `scripts/release/check-migrations.sh` | Validate pending migrations |
| `scripts/release/smoke-tests.sh` | Post-deploy smoke checks |
| `scripts/release/post-deploy-health.sh` | Health endpoint verification |
| `scripts/release/rollback.sh` | Rollback guidance stub |

## Flags

Release does not enable `MAPABLE_NATIONAL_PLATFORM_ENABLED` automatically. Operators must set flags explicitly after validation.
