# Rate limiting — honesty and decision matrix

**Status:** process-local limiter only in repository  
**Production-sensitive enables:** `BLOCKED` until a distributed store is owner-approved and evidenced  
**Rule:** Do not invent or auto-select an external vendor during feature freeze.

## Current implementation

| Item                                 | Evidence                    | Status                                              |
| ------------------------------------ | --------------------------- | --------------------------------------------------- |
| `lib/api/ip-rate-limit.ts`           | In-memory `Map` per process | `VERIFIED` (code)                                   |
| Multi-instance / multi-region safety | None                        | `FAILED` for production-sensitive claims            |
| Abuse protection for CSP report sink | Uses process-local helper   | Acceptable for Preview/CI; **not** production-grade |

## Decision matrix (no vendor selected)

Agents must **not** add Redis, Upstash, Vercel KV, or another store unless the account owner records an approved provider with privacy review.

| Criterion     | Question                                               | Owner answer required |
| ------------- | ------------------------------------------------------ | --------------------- |
| Data location | AU / region residency for IP hashes or keys?           |                       |
| Privacy       | What identifiers are stored? Retention?                |                       |
| Retention     | TTL aligned to window only?                            |                       |
| Availability  | Failure mode if store down (fail-closed vs fail-open)? |                       |
| Cost          | Preview + production estimate                          |                       |
| Approval      | Named owner + date                                     |                       |

Until completed, keep:

- NDIA submission hard-off
- Automated payment/invoice approval hard-off
- Sensitive high-volume public write paths behind existing fail-closed flags
- CSP production enforce hard-off

## Adapter policy

- **If** an already-approved distributed store appears in this repository with production configuration evidence, design a focused adapter behind a **default-false** flag.
- **As of 2026-07-21 rescan:** no approved distributed store dependency is present → **no adapter added**.

## Rollback

Unset any future distributed limiter flag; revert adapter PR; process-local behaviour remains the documented default.
