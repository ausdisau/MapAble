# Remediation — Current State

**Last verified:** 2026-07-22 (public informational GO-gate remediation)  
**Base `origin/main` tip:** `2042a210edba065a500c2936c95f22e47497dec3`  
**Prior tip (stale):** `7009e9de7c815267577404c324231c504077372e`  
**Canonical pilot charter:** [../operations/CONTROLLED_PILOT_CHARTER.md](../operations/CONTROLLED_PILOT_CHARTER.md)  
**Informational closure rescan:** [CLOSURE_RESCAN_2026-07-22.md](./CLOSURE_RESCAN_2026-07-22.md)  
**Finding status values:** `VERIFIED` | `FAILED` | `NOT_RUN` | `OWNER_ACTION_REQUIRED` | `BLOCKED` | `NOT_APPLICABLE`

Full Phase 0 notes: [RESCAN_RECONCILIATION.md](./RESCAN_RECONCILIATION.md)  
Authoritative evidence rows: [PRODUCTION_READINESS_EVIDENCE_LEDGER.md](./PRODUCTION_READINESS_EVIDENCE_LEDGER.md)

This document records live repository and public-edge inspection. CI green is **not** a production-ready claim.

## Evidence layers (do not conflate)

| Layer              | Status discipline                           |
| ------------------ | ------------------------------------------- |
| Repository         | Code on `main`, CI workflows, disposable DB |
| Preview            | Vercel preview for a PR tip                 |
| Public edge        | Live `https://mapable.com.au` responses     |
| Production account | Neon / Vercel / GitHub settings (owner)     |
| Human acceptance   | Manual AT, tabletop, pilot golden journeys  |

## Live production edge (curl, 2026-07-22)

| Check                                   | Result                                                                                                         | Status                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Apex `https://mapable.com.au/`          | HTTP 200; allowlisted informational routes 200                                                                 | `VERIFIED`                                                              |
| `https://www.mapable.com.au/`           | TLS certificate **expired** (curl exit 60)                                                                     | `FAILED` / `OWNER_ACTION_REQUIRED`                                      |
| `http://mapable.com.au/`                | 308 → `https://mapable.com.au/`                                                                                | `VERIFIED`                                                              |
| `/robots.txt` / `/sitemap.xml`          | 200; sitemap locs use apex                                                                                     | `VERIFIED`                                                              |
| CSP                                     | Report-Only only (no enforce header); includes `unsafe-eval`                                                   | `VERIFIED` (report-only)                                                |
| `/api/health/live`, `/api/health/ready` | Present in **repository** on main; apex returns **404 HTML**; latest Production build for `2042a210` **ERROR** | Repository `VERIFIED`; edge `FAILED`; HTTPS env `OWNER_ACTION_REQUIRED` |
| Deployment drift                        | Live edge ≠ failed Production attempt `dpl_D6eih3Nn…` (HTTP `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL`)            | `VERIFIED` (drift)                                                      |
| Branch protection via API               | rulesets `[]`; protection endpoint 403                                                                         | `OWNER_ACTION_REQUIRED`                                                 |

## Wave / repair programme status

| Item                                           | Status                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PR #377 Wave 0                                 | MERGED                                                                                    |
| PR #378 repair + launch remediation            | MERGED                                                                                    |
| PR #381 migrate-from-zero repair               | **MERGED** (`78f95d40`) — empty-DB deploy green in CI                                     |
| PR #380 NDIS Expansion Wave 0 docs             | **MERGED** — tip of current `main`                                                        |
| Migrate-from-zero (disposable PostgreSQL / CI) | **`VERIFIED` green** on `main` after #381                                                 |
| Production `_prisma_migrations` reconciliation | **`OWNER_ACTION_REQUIRED`** — checksum update + rename drift; see repair runbook          |
| Authenticated a11y (Playwright storage-state)  | Repository CI present; Accessibility on `main` post-#380 **success**                      |
| CSP enforce                                    | Builder exists; **not wired** for production — [CSP_ENFORCEMENT.md](./CSP_ENFORCEMENT.md) |
| Capabilities marked `production_ready`         | Must remain unset / false for public claim                                                |
| NDIS Expansion product Wave 1 (#382)           | Open draft; flag off; CI format + a11y **FAILED**                                         |
| Feature freeze                                 | **Active** with narrow recorded waivers only                                              |

## Architectural invariants (unchanged)

- AccessPlace — canonical public place identity
- AccessibilityProfile — canonical preference record
- ConsentRecord — foundational consent system
- AuditEvent — canonical consequential-action audit
- Care, Transport, Calendar, Jobs, billing entities remain canonical
- AI may interpret/retrieve/explain/summarise/propose only
- Paid features must not influence confidence, safety, moderation, accreditation, or personal-fit
- Essential workflows remain available without AI/chat-only interaction
- NDIA submission and automated payment/invoice approval remain hard-off
- Participant authority, consent, tenancy, human review, audit, least-privilege remain mandatory

## PBS ownership decision (Wave 7)

| Decision                     | Value                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Canonical planned owner path | **`lib/pbs-operations/**`\*\* (Wave 0 domain map)                                                      |
| PR #379 path                 | `lib/positive-behaviour-support/**` — **non-canonical** relative to Wave 0                             |
| Designation for #379         | **`BLOCKED` / extractable future Wave 7** — do not merge as-is; do not copy code into remediation      |
| Human cleanup                | Close, retarget, or recreate onto `lib/pbs-operations/**` only after Wave 7 gate; agent does not close |

## Open stack discipline

Maximum unmerged stack depth: **3**.  
Current Geoscape train **#367 → #384 → #385 → #386** is depth **4** — policy breach; human must consolidate or retarget before further stack growth. See [PR_ACTION_LEDGER.md](./PR_ACTION_LEDGER.md).

## Stale-statement corrections (this tip)

| Prior stale claim                                              | Correct current claim                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Migrate-from-zero still broken / P3018 active empty-DB blocker | Empty-DB migrate-from-zero is **green** on `main` CI after #381                             |
| Wave 1 blocked solely by migrate-from-zero                     | Empty-DB gate cleared; Wave 1 still needs freeze waiver, green CI on #382, human acceptance |
| Leadership train merge #330/#341/#340                          | Those PRs are **MERGED**; ledger refreshed                                                  |

## Git metadata

| Finding                                     | Status                          | Evidence   |
| ------------------------------------------- | ------------------------------- | ---------- |
| Broken gitlink `tmp/mapable-unified-replit` | already remediated historically | gitignored |
| `.gitmodules`                               | not present                     |            |

## Historical Phase 0 notes

Older tables below this line may be stale. Prefer sections above, [RESCAN_RECONCILIATION.md](./RESCAN_RECONCILIATION.md), and [MIGRATE_FROM_ZERO_REPAIR.md](./MIGRATE_FROM_ZERO_REPAIR.md).

<details>
<summary>Archived Phase 0 inspection (2026-07-17)</summary>

Base SHA at that inspection: `5c667983`. Many tooling gaps listed then have since been addressed. Do not use that snapshot for go/no-go.

</details>
