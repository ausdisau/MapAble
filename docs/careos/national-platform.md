# CareOS Phase 15 — National Infrastructure, Federation and Resilience

Phase 15 delivers multi-region infrastructure-as-code, federated identity boundaries, disaster recovery procedures, platform observability, cost baselines, and release engineering gates.

## Safety boundaries (hard)

CareOS **must NOT**:

- Auto-grant participant authority from federated identity login
- Claim untested failover works (`claimUntestedFailoverWorks=false`)
- Expose secrets or PII in health dashboards (redaction enforced)
- Deploy to production without manual approval

Enforced in `lib/config/national-platform.ts` and `lib/platform/federation/federation-service.ts`.

## Feature flags

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `MAPABLE_NATIONAL_PLATFORM_ENABLED` | `false` | Master switch for national platform |
| `MAPABLE_FEDERATION_ENABLED` | `false` | OIDC/SAML federation trusts |
| `federatedIdentityGrantsParticipantAuthority` | **hardcoded `false`** | Federated login never grants participant authority |
| `claimUntestedFailoverWorks` | **hardcoded `false`** | Failover claims require drill evidence |

## Schema (migration `20260714160000_national_platform`)

| Model | Purpose |
| ----- | ------- |
| `FederationTrust` | OIDC/SAML partner trust (participant authority blocked) |
| `RegionalOrganisation` | Regional org directory entries |
| `PlatformHealthCheck` | Redacted health check snapshots |
| `RestoreDrillRecord` | Restore drill evidence with RPO/RTO achieved |

Note: `PlatformStatusCheck` (Phase 8) remains for legacy status page.

## Module layout

```
infra/                          — OpenTofu/Terraform modules
lib/platform/
  resilience/                   — PITR, backup, failover, degraded mode
  federation/                   — OIDC/SAML, org directory, regional adapters
  observability/                — Health checks, redaction
  security-operations/          — SIEM export, incident playbooks
  cost/                         — Cost estimates and optimisation hints
lib/config/national-platform.ts
app/admin/system-health/        — Admin health dashboard
docs/infrastructure/
docs/disaster-recovery/
docs/performance/
docs/release/
scripts/release/
.github/workflows/careos-release.yml
```

## Federation

Federated identity establishes a session context with `participantAuthorityGranted: false`. Participant-scoped API calls still require explicit CareOS authority via `checkFederatedParticipantAuthority()`.

Trusted service accounts and partner API clients bind to federation trusts but inherit the same participant authority block.

## Resilience

See `docs/disaster-recovery/README.md` for the documented vs tested matrix. Cross-region failover is **documented only — untested**.

## Observability

`/admin/system-health` shows redacted component health, resilience capability status, restore drills, federation trusts, cost baseline, and incident playbooks.

## Release

Production deploys use `.github/workflows/careos-release.yml` with manual approval gate. See `docs/release/README.md`.

## Related phases

- Phase 12 — Developer platform (API clients, service accounts)
- Phase 14 — Analytics cloud
- Phase 8 — Legacy `PlatformStatusCheck` and national insights
