# Rate limiting honesty

**Last refreshed:** 2026-07-20  
**Status:** in-memory limiter present; distributed production limiting `BLOCKED` / `OWNER_ACTION_REQUIRED`

## Current control

`lib/api/ip-rate-limit.ts` uses a process-local `Map`. It is suitable for single-process
dev/preview soft throttling only.

It is **not** production-safe across multiple Vercel serverless instances.

## Inventory (sensitive endpoints)

| Surface                       | Current control                                 | Production-safe?          |
| ----------------------------- | ----------------------------------------------- | ------------------------- |
| Auth / login adjacent         | In-memory IP helper where wired                 | No                        |
| Care / transport write APIs   | Permission + tenant checks; rate limit optional | Distributed limit missing |
| Billing / payout              | Flags fail-closed; specialist review            | Distributed limit missing |
| Public autocomplete / geocode | Adapter timeouts + optional IP limit            | Distributed limit missing |

## Gate

If no distributed store is configured and verified:

- Sensitive production capability enables remain **disabled**
- Evidence ledger records the blocker (`OWNER_ACTION_REQUIRED` / `BLOCKED`)

Do not introduce a new observability/rate-limit vendor during the feature freeze without
account-owner approval.
