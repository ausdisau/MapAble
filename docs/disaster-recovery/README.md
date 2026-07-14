# Disaster Recovery Procedures

CareOS Phase 15 disaster recovery documentation. Procedures extend existing `lib/disaster-recovery/` and `/admin/disaster-recovery`.

## RPO / RTO targets (documented)

| Target | Value | Status |
| ------ | ----- | ------ |
| RPO | 15 minutes | **Documented** — requires managed PostgreSQL PITR |
| RTO | 60 minutes | **Documented** — not validated without restore drill |

Configured via `MAPABLE_DOCUMENTED_RPO_MINUTES` and `MAPABLE_DOCUMENTED_RTO_MINUTES`. These are **documentation targets**, not runtime guarantees.

## Capability matrix

| Capability | Documented | Tested | Evidence |
| ---------- | ---------- | ------ | -------- |
| PostgreSQL PITR | Yes | No | `infra/modules/postgresql` |
| Backup verification | Yes | **No** | Automated restore-to-staging not in CI |
| Object versioning | Yes | No | S3 versioning in `infra/modules/object-storage` |
| Event outbox replay | Yes | Partial | `lib/platform/event-outbox-service` |
| Queue DLQ recovery | Yes | No | Manual procedure only |
| Degraded mode | Yes | **Yes** | Mobile offline phase tests |
| Cross-region failover | Yes | **No — untested** | Do not claim failover works |
| Restore drills | Yes | On demand | `RestoreDrillRecord` model |

## Failover procedure (documented, untested)

1. Incident commander declares primary region failure.
2. Verify DR replica lag within documented RPO (`lib/platform/resilience/procedures.ts`).
3. Promote DR PostgreSQL replica (see `infra/environments/disaster-recovery.tfvars`).
4. Update secrets manager `DATABASE_URL` to DR endpoint.
5. Shift DNS weighted routing to DR (`infra/modules/dns`).
6. Run `pnpm prisma migrate deploy` against promoted instance.
7. Execute post-deploy health checks (`scripts/release/post-deploy-health.sh`).
8. Record outcome in `RestoreDrillRecord` or incident log.

**Do not claim failover works without a passed restore drill.** Enforced by `claimUntestedFailoverWorks=false` in `lib/config/national-platform.ts`.

## Restore drill workflow

1. Schedule drill in staging (never first-run in production).
2. Restore from latest backup to isolated environment.
3. Run smoke tests (`scripts/release/smoke-tests.sh`).
4. Record RPO/RTO achieved vs documented targets.
5. Store evidence via `recordRestoreDrill()` in `lib/platform/resilience/`.

## Related

- `docs/careos/ROLLBACK.md` — application rollback
- `docs/release/` — release and deploy gates
- `lib/platform/resilience/` — resilience contracts and procedures
