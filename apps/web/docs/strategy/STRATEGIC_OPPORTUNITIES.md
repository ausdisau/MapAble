# Strategic Opportunities and First Implementation Sequence

**Status:** programme sequencing — not production approval  
**Baseline SHA lineage:** productisation merge train through #327 on `main`

## Twelve opportunities (summary)

1. **Whole-journey coordination** — missions around goals, not bookings (Starting Work first).
2. **Portable Participant Passport** — provider-agnostic, participant-controlled package.
3. **Care and Transport completion** — close the basic transactions incumbents already perform.
4. **Continuity and recovery** — participant-controlled recovery; Care cancel ≠ Transport cancel.
5. **Provider Operations SaaS** — read-only attention projection.
6. **Venue and civic access** — Harbour Civic Centre controlled venue.
7. **Workforce competency network** — evidence ladder; Academy ≠ competency.
8. **Evidence-to-payment** — agreement → evidence → invoice integrity.
9. **Employment and workplace access** — beyond applications to first-day and retention.
10. **Assistive technology continuity** — partner assessment/repair; MapAble coordinates.
11. **Regional capacity exchange** — regional liquidity before national marketplace.
12. **Public accountability and appeals** — owned, explainable, challengeable decisions.

Detailed wave checklist lives in the Strategic Opportunity Programme plan; this file
sequences the **first five pull requests** after Wave 0 documentation reconciliation.

## First five pull requests (sequential)

| Order | Branch | Purpose | Product migration | Flags |
|-------|--------|---------|-------------------|-------|
| **PR 1 (this wave)** | `cursor/strategic-opportunity-reconciliation-e909` | Reconcile capabilities, docs, operating lanes; claim discipline tests | None | None enabled |
| **PR 2** | `cursor/persistent-transport-quotes-e909` | Persistent Transport quotes + staged location privacy | `TransportQuote*` | Keep defaults off |
| **PR 3** | `cursor/recurring-care-agreements-e909` | Recurring Care schedules + agreement completion | Care schedule/agreement refinements | Keep defaults off |
| **PR 4** | `cursor/starting-work-db-journey-e909` | Database-backed Starting Work golden journey (seed) | Mission projection / journey links as needed | Pilot flags remain off by default |
| **PR 5** | `cursor/worker-cancel-recovery-e909` | Worker cancellation → participant-controlled recovery | ContinuityCase / RecoveryReceipt as needed | Keep defaults off |

### PR 1 non-goals

- No Prisma product migration
- No feature flag enables
- No new operational source of truth
- No fabricated registration status
- No Managed Support launch claims

### Stack discipline

Maximum **three** unmerged PRs in a stack. Prefer merge PR *n* before opening PR *n+3*.

## Maturity vocabulary (honesty)

| Label | Meaning |
|-------|---------|
| `merged_and_operational` | On main, Prisma-backed, usable in internal/pilot paths with gates |
| `merged_but_flagged` | On main; master flag default off |
| `merged_but_synthetic` | On main; fixtures/synthetic only |
| `merged_but_process_local` | On main; in-process memory (e.g. transport quotes Map) — not durable |
| `scaffold` | Foundation only |
| `open_pr` | Tip not merged |
| `blocked_by_registration` | Requires registration before claim |
| `blocked_by_external_approval` | e.g. NDIA live submit |
| `documentation_out_of_date` | Docs lag source (must be fixed in PR 1) |

## Related

- [OPERATING_LANES.md](./OPERATING_LANES.md)
- [COMPETITIVE_POSITION.md](./COMPETITIVE_POSITION.md)
- [BUILD_PARTNER_DEFER.md](./BUILD_PARTNER_DEFER.md)
- [../productisation/CAPABILITY_REGISTRY.md](../productisation/CAPABILITY_REGISTRY.md)
- NDIS Expansion sequence (distinct multi-wave programme): [../programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md](../programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md)
