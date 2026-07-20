# NDIS Expansion — Delivery Sequence

**Status:** Wave 0 sequencing — not a merge or deploy authorisation  
**Inspected main tip:** `8f64dc38` (PR #378 merged)  
**Product entry gate:** **closed** until migrate-from-zero is green

## Hard stop

| Prerequisite | Status at Wave 0 inspection |
|--------------|-----------------------------|
| PR #378 merged or equivalent release blockers resolved | **Pass** — merged |
| Required CI checks effective | **Partial** — migrate-from-zero hard-fails |
| Migration-from-zero on disposable PostgreSQL | **Fail** — P3018 @ `20260525000000_mapable_access_phase_1` |
| Migration order + integrity | **Pass** on tip |
| Auth + tenant-isolation suites | Existing; not sufficient alone while migrate-from-zero is red |
| Feature freeze | **Active** — new product Prisma domains frozen |

Until migrate-from-zero is green **and** freeze is lifted or waived for the target
domain, **do not** start product Waves 1–11. Complete Wave 0 documentation only.

## Pull request order

| Order | Wave | Title | Product migration | Depends on |
|------:|------|-------|-------------------|------------|
| 1 | **0** | NDIS expansion reconciliation and programme foundation | **None** | Clean `main` tip |
| — | *trust* | Migration-from-zero repair (separate programme) | Forward repair / baseline only with account-owner evidence | Wave 0 docs; owner evidence |
| 2 | 1 | Assistive Technology Continuity | Smallest additive AT entities | Wave 0 merged; migrate-from-zero green; freeze lift/waiver |
| 3 | 2 | Plan and Evidence Navigator | Additive plan/evidence entities | Wave 1 merged (or explicit parallel waiver if no shared migration conflict) |
| 4 | 3 | Support Coordination Outcomes | Prefer no new SoT; extend SC | Wave 0 + SC SoT on main; extract from #188/#243 only as needed |
| 5 | 4 | Home and Living Navigator | Additive living/transition entities; reuse AccessPlace | Wave 1 for AT dependencies recommended |
| 6 | 5 | Provider Quality and Workforce Assurance | Prefer extend WorkerProfile / readiness | Wave 0; overlap review with #294 |
| 7 | 6 | Psychosocial Recovery Continuity | Additive recovery workspace | Wave 0 + consent/authority |
| 8 | 7 | PBS Practice Operations | High-risk professional entities | Regulatory gates; practitioner suitability evidence model |
| 9 | 8 | Early Childhood Family Workspace | Additive family workspace | Authority grants; child privacy rules |
| 10 | 9 | Allied Health and Home Modification Exchange | Handoff/project entities; adapters off | Waves 1 + 4 linkages |
| 11 | 10 | Plan Management Infrastructure | Catalogue versioning + PM workflows | Billing Centre; NDIA submit stays false |
| 12 | 11 | Regional Capacity Exchange | Regional capacity product | One-region operational readiness proven |
| 13 | 12 | Cross-system pilot and release evidence | Evidence only | Golden journeys 1–10; no production claim |

## Stack rules

1. Never combine all waves into one branch
2. Maximum **three** stacked unmerged PRs
3. Prefer starting each wave from latest merged `main`
4. Do not start a dependent product migration until its prerequisite PR is merged
5. Do not merge PRs from this agent role; do not deploy production
6. Feature flags default **false**
7. Avoid stacking migrations wherever possible
8. Do not open PR order *n+3* while order *n* remains unmerged

## Wave 0 (this delivery)

Deliverables:

- [NDIS_EXPANSION_MASTER_PLAN.md](./NDIS_EXPANSION_MASTER_PLAN.md)
- [NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md)
- [NDIS_EXPANSION_PR_RECONCILIATION.md](./NDIS_EXPANSION_PR_RECONCILIATION.md)
- [NDIS_REGULATORY_GATE_MATRIX.md](./NDIS_REGULATORY_GATE_MATRIX.md)
- This sequence file
- Capability registry + domain ownership + feature-dependency documentation updates

Non-deliverables:

- Product tables / Prisma migrations
- Runtime wiring of Wave 1–11 flags
- Historical migration SQL rewrite
- Production flag enables
- Registration or Managed Support claims

## Next eligible product wave

**Wave 1 — Assistive Technology Continuity** (`MAPABLE_AT_CONTINUITY_ENABLED=false`)

Prerequisites:

1. This Wave 0 PR merged
2. Separate migration-trust repair: migrate-from-zero green
3. Required CI green on then-current `main`
4. Feature freeze lifted or AT domain explicitly waived
5. Fresh branch from then-current `main`

Acceptance journey (when Wave 1 lands): power wheelchair fails before a work shift →
outage recorded → participant backup plan shown → authorised repair partners →
Care/Transport/Work dependencies → human-approved notifications → full audit trail.
Clinical suitability remains an external reference.

## Related

- [MIGRATE_FROM_ZERO_BLOCKER.md](../remediation/MIGRATE_FROM_ZERO_BLOCKER.md)
- [FEATURE_FREEZE.md](../remediation/FEATURE_FREEZE.md)
- [DELIVERY_SEQUENCE.md](./DELIVERY_SEQUENCE.md) (Prompt 0 connected programmes — distinct sequence)
- [STRATEGIC_OPPORTUNITIES.md](../strategy/STRATEGIC_OPPORTUNITIES.md)
