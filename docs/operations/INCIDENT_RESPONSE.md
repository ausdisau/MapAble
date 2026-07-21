# Incident response runbook

**Status:** process template — exercises `NOT_RUN` until humans complete them  
**Last refreshed:** 2026-07-20

## Severity levels

| Severity | Examples | Initial response |
| -------- | -------- | ---------------- |
| SEV-1 | Active privacy breach; payment diversion; auth total outage | Page on-call; preserve evidence; consider flag disable |
| SEV-2 | Partial auth failure; DB readiness flapping; widespread 5xx | Stabilize; communicate; schedule RCA |
| SEV-3 | Degraded feature; non-critical job failures | Business hours response |
| SEV-4 | Cosmetic / docs | Backlog |

## Escalation boundaries

| Domain | Escalate to | Do not |
| ------ | ----------- | ------ |
| Privacy breach | Privacy lead + legal counsel path | Public blog without approval |
| Safeguarding / participant harm risk | Safeguarding lead; external authorities per policy | Autonomous “AI safeguarding” decisions |
| Payment / claim incidents | Finance + billing owners | Enable NDIA submit or auto-approve to “fix” |
| Security compromise | Security owner; rotate secrets via owner process | Paste secrets into tickets/chat |

## Communications owner

Named **communications owner** must be recorded by account owner (`OWNER_ACTION_REQUIRED`). Until named, treat as blocker for broad service — not for private invitation pilot engineering.

## Evidence preservation

- Preserve logs with correlation IDs; redact participant free text.
- Do not delete audit rows.
- Capture deployment SHA, flag states, and approximate blast radius.

## Post-incident review

Within five business days for SEV-1/2: timeline, root cause, customer impact, corrective actions, ledger updates. Record exercise completion in [TABLETOP_EXERCISES.md](./TABLETOP_EXERCISES.md).
