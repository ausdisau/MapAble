# NDIS Expansion — Delivery Sequence

**Status:** Wave 0 landed; Wave 1 repair in flight — not a merge or deploy authorisation  
**Inspected main tip:** `6279ab91` (PR #380 merged; #381 migrate-from-zero on main)  
**Product entry gate:** Wave 1 open as #382 with flag off; freeze waiver narrow

## Hard stop (refreshed 2026-07-20)

| Prerequisite | Status |
|--------------|--------|
| PR #378 / #380 / #381 on `main` | **Pass** — merged |
| Required CI checks effective | **Partial** — branch protection `OWNER_ACTION_REQUIRED` |
| Migration-from-zero on disposable PostgreSQL | **Pass** — `VERIFIED` green on `main` CI |
| Production `_prisma_migrations` reconciliation | **`OWNER_ACTION_REQUIRED`** — separate from empty-DB green |
| Migration order + integrity | **Pass** on tip |
| Feature freeze | **Active** — AT Continuity narrow waiver for #382 only |
| Wave 1 (#382) CI + a11y | **Fail** — format + build OOM; leave draft |

Empty-DB migrate-from-zero is no longer the active product-entry blocker. Wave 1 remains
gated by freeze waiver discipline, green CI on #382, human acceptance, and fail-closed flags.

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

1. ~~Wave 0 PR merged~~ — **done** (#380)
2. ~~Migration-trust repair: migrate-from-zero green~~ — **done** (#381)
3. Repair #382 CI (format) + Accessibility OOM; keep draft
4. Feature freeze AT waiver remains narrow; flag stays false
5. Human preview acceptance + audit evidence before any enable discussion
6. Production checksum reconciliation remains `OWNER_ACTION_REQUIRED` (parallel, not a flag enable)

Acceptance journey (when Wave 1 lands): power wheelchair fails before a work shift →
outage recorded → participant backup plan shown → authorised repair partners →
Care/Transport/Work dependencies → human-approved notifications → full audit trail.
Clinical suitability remains an external reference.

## Related

- [MIGRATE_FROM_ZERO_BLOCKER.md](../remediation/MIGRATE_FROM_ZERO_BLOCKER.md)
- [FEATURE_FREEZE.md](../remediation/FEATURE_FREEZE.md)
- [DELIVERY_SEQUENCE.md](./DELIVERY_SEQUENCE.md) (Prompt 0 connected programmes — distinct sequence)
- [STRATEGIC_OPPORTUNITIES.md](../strategy/STRATEGIC_OPPORTUNITIES.md)
