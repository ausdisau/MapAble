# Backup and restore runbook

**Status:** documentation only — no production actions executed from this agent  
**Last refreshed:** 2026-07-20  
**Evidence status:** ownership and restore exercises are `OWNER_ACTION_REQUIRED` / `NOT_RUN` until humans complete them

## Ownership

| Item | Owner role | Status |
| ---- | ---------- | ------ |
| Neon project / production branch | Account owner | `OWNER_ACTION_REQUIRED` — confirm in Neon console |
| Snapshot schedule | Account owner | `OWNER_ACTION_REQUIRED` |
| PITR window confirmation | Account owner | `OWNER_ACTION_REQUIRED` |
| Restore decision authority | Named incident commander + data owner | `OWNER_ACTION_REQUIRED` |

## Targets

| Metric | Target | Status |
| ------ | ------ | ------ |
| RPO | ≤ 24h for controlled pilot (tighten later) | Proposed — `NOT_RUN` |
| RTO | ≤ 8h to isolated staging smoke | Proposed — `NOT_RUN` |

## Restore procedure (staging only until approved)

1. Identify snapshot or PITR timestamp (no production overwrite without dual approval).
2. Restore into an **isolated** staging Neon branch / database.
3. Compare schema to repository migrations (`prisma migrate status`) — do not run repair SQL automatically.
4. Application smoke: `/api/health/live`, `/api/health/ready`, `/login`, one care + one transport read path with synthetic data.
5. Record evidence in [TABLETOP_EXERCISES.md](./TABLETOP_EXERCISES.md).
6. Only after staging success + written approval: production restore path (owner-executed).

## Prohibitions

- Never use `prisma db push` on shared or production databases.
- Never update production `_prisma_migrations` checksums without snapshot/PITR + staging rehearsal + owner approval.
- Never print or rotate credentials in chat or tickets.

## Rollback decision authority

Rollback of application deploy vs database restore are separate decisions. Application rollback uses Vercel previous deployment; database restore requires data-owner approval.
