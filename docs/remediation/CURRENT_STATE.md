# Remediation — Current State

**Last verified:** 2026-07-20 (post-#378 tip + NDIS Expansion Wave 0 docs)
**Base `origin/main` tip:** `8f64dc3845288dc42beefb35cdea95b9ca28dba5` (Merge PR #378)
**NDIS Expansion Wave 0:** documentation/registry reconciliation on
`cursor/ndis-expansion-wave0-0a20` — **no product migrations**
**Finding status values:** `verified` | `likely` | `needs_runtime_verification` | `not_present` | `already_remediated`

This document records live repository and production-edge inspection. CI green is **not** a production-ready claim.

## Live production edge (curl, 2026-07-20)

| Check                                                  | Result                                                                                                       | Status                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Apex `https://mapable.com.au/`                         | HTTP 200                                                                                                     | verified                                                                |
| `https://www.mapable.com.au/`                          | HTTP 307 → `https://mapable.com.au/`                                                                         | verified (TLS/redirect working at scan time; still account-owner owned) |
| `/jobs`                                                | HTTP 308 → `/employment`                                                                                     | verified                                                                |
| `/robots.txt` / `/sitemap.xml`                         | 200; sitemap locs use apex                                                                                   | verified                                                                |
| HTML JSON-LD on apex                                   | Still contains `http://localhost:3000` and `sameAs` www — **production has not deployed PR #378 repair yet** | verified                                                                |
| CSP                                                    | Report-Only; includes `unsafe-eval`                                                                          | verified                                                                |
| `/api/health`, `/api/health/live`, `/api/health/ready` | 404 on production (probes land with this PR)                                                                 | verified                                                                |
| Branch protection via API                              | rulesets `[]`; protection endpoint 403                                                                       | needs_runtime_verification (account-owner)                              |

## Wave 0 / repair programme status

| Item                                   | Status                                                                                              |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| PR #377 Wave 0                         | MERGED (was merged with red Format CI historically)                                                 |
| PR #378 repair + launch remediation    | **MERGED** into `main` @ `8f64dc38`                                                                 |
| Canonical origin code                  | Apex-only validators + safe JSON-LD serializer (landed via #378)                                    |
| Deploy-path env gate                   | `next.config.ts` + `instrumentation.ts`                                                             |
| Prod audit allowlist                   | Exact/descendant path match only                                                                    |
| Migrate-from-zero                      | Hard-fail CI; P3018 at `20260525000000_mapable_access_phase_1` — see `MIGRATE_FROM_ZERO_BLOCKER.md` |
| Authenticated a11y                     | Seeded pilot users + Playwright storage-state (landed via #378)                                     |
| CSP enforce                            | Builder exists; **not wired** — `CSP_ENFORCEMENT.md`                                                |
| Capabilities marked `production_ready` | **not_present** (must remain unset)                                                                 |
| NDIS Expansion product waves           | **blocked** until migrate-from-zero green + freeze lift — see `docs/programmes/NDIS_EXPANSION_*`    |

## Architectural invariants (unchanged)

- AccessPlace — canonical public place identity
- AccessibilityProfile — canonical preference record
- ConsentRecord — foundational consent system
- AuditEvent — canonical consequential-action audit
- Care, Transport, Calendar, Jobs, billing entities remain canonical
- AI may interpret/retrieve/explain/summarise/propose only
- Paid features must not influence confidence, safety, moderation, accreditation, or personal-fit
- Essential workflows remain available without AI/chat-only interaction

## Git metadata

| Finding                                     | Status                       | Evidence                                                                |
| ------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Broken gitlink `tmp/mapable-unified-replit` | already_remediated (this PR) | Was mode `160000` without `.gitmodules`; removed from index; gitignored |
| `.gitmodules`                               | not_present                  |                                                                         |

## Historical Phase 0 notes

Older tables below this line may be stale relative to Wave 0 merges. Prefer the 2026-07-20 sections above and `WAVE0_STABILISATION.md` / `MIGRATE_FROM_ZERO_BLOCKER.md` for launch decisions.

<details>
<summary>Archived Phase 0 inspection (2026-07-17)</summary>

Base SHA at that inspection: `5c667983`. Many tooling gaps listed then (Playwright, CODEOWNERS, CI) have since been addressed in later PRs. Do not use that snapshot for go/no-go.

</details>
