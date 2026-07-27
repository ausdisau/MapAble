# CareOS Infrastructure

Phase 15 infrastructure-as-code for the national platform. OpenTofu/Terraform-compatible HCL under `infra/`. **No secrets are committed** — values are injected via CI or secrets manager at deploy time.

## Layout

```
infra/
  main.tf              — root module wiring
  variables.tf         — shared variables
  outputs.tf           — sensitive outputs marked
  environments/        — per-environment tfvars
  modules/
    application/       — ECS/hosting
    postgresql/        — Aurora PostgreSQL with PITR
    redis/             — ElastiCache
    object-storage/    — S3 with versioning
    queue/             — SQS + DLQ
    secrets/           — Secrets Manager stubs
    monitoring/        — CloudWatch logs/alarms
    dns/               — Route53 + health checks
    cdn/               — CloudFront
    waf/               — WAF rate limiting
    backups/           — AWS Backup plans
```

## Environments

| Environment | Region | Notes |
| ----------- | ------ | ----- |
| `development` | ap-southeast-2 | Single instance, PITR off |
| `staging` | ap-southeast-2 | Pre-production validation |
| `production` | ap-southeast-2 | Primary; PITR on, multi-AZ |
| `disaster-recovery` | ap-southeast-4 | Cold/warm standby; compute may scale to zero |

## Usage (stub)

```bash
cd infra
tofu init
tofu plan -var-file=environments/staging.tfvars
# Production requires human approval — see docs/release/
```

## Status

| Component | Documented | Tested in CI |
| --------- | ---------- | ------------ |
| Module syntax (HCL valid) | Yes | Yes (`tests/infra/`) |
| Live deploy | No | No |
| Cross-region failover | Documented only | **No — untested** |

See `docs/disaster-recovery/` for recovery procedures.
