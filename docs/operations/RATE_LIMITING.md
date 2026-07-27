# Rate limiting — honesty and decision matrix

**Canonical pilot policy:** [CONTROLLED_PILOT_CHARTER.md](./CONTROLLED_PILOT_CHARTER.md)  
**Status:** process-local limiter only in repository  
**Sensitive pilot mutations:** `BLOCKED` until a distributed store is owner-approved and evidenced  
**Rule:** Do not invent or auto-select an external vendor during feature freeze.

## Current implementation

| Item                                 | Evidence                    | Status                                              |
| ------------------------------------ | --------------------------- | --------------------------------------------------- |
| `lib/api/ip-rate-limit.ts`           | In-memory `Map` per process | `VERIFIED` (code)                                   |
| Multi-instance / multi-region safety | None                        | `FAILED` for production-sensitive claims            |
| Abuse protection for CSP report sink | Uses process-local helper   | Acceptable for Preview/CI; **not** production-grade |
| Search interpret / autocomplete      | `checkIpRateLimit`          | Process-local (Sprint 4 Act)                        |
| Register + NDIS provider search      | `checkIpRateLimit`          | Process-local (Sprint 4 Act)                        |
| Act handoff resolve                  | `checkIpRateLimit`          | Process-local (Sprint 4 Act)                        |

## Approved shared store scan (2026-07-21)

| Store                                                   | Present in repo with production config evidence? |
| ------------------------------------------------------- | ------------------------------------------------ |
| Redis / Upstash / Vercel KV / other distributed limiter | **No**                                           |

Therefore: **no adapter added**. If an approved store later appears with privacy review, design a focused adapter behind a default-false flag.

## Owner decision matrix (complete before selecting a vendor)

| Criterion                       | Question                                     | Owner answer              | Status                  |
| ------------------------------- | -------------------------------------------- | ------------------------- | ----------------------- |
| AU availability / data location | AU / region residency for IP hashes or keys? |                           | `OWNER_ACTION_REQUIRED` |
| Personal information exposure   | What identifiers stored?                     |                           | `OWNER_ACTION_REQUIRED` |
| Logging and retention           | TTL aligned to window only? Logs?            |                           | `OWNER_ACTION_REQUIRED` |
| Latency                         | p99 impact on auth/mutations                 |                           | `OWNER_ACTION_REQUIRED` |
| Availability                    | Multi-AZ / SLA                               |                           | `OWNER_ACTION_REQUIRED` |
| Multi-region behaviour          | Failover semantics                           |                           | `OWNER_ACTION_REQUIRED` |
| Outage handling                 | Fail-closed for sensitive mutations?         | Required: **fail closed** | Policy in charter       |
| Deletion                        | Key purge / GDPR-aligned deletion            |                           | `OWNER_ACTION_REQUIRED` |
| Cost                            | Preview + production estimate                |                           | `OWNER_ACTION_REQUIRED` |
| Contractual / privacy review    | Named reviewer + date                        |                           | `OWNER_ACTION_REQUIRED` |

Until completed, keep NDIA submit, automated payment/invoice approval, and other sensitive high-volume writes fail-closed. Process-local limiting must **not** be described as production-grade.

## Rollback

Unset any future distributed limiter flag; revert adapter PR; process-local behaviour remains the documented default.
