# Productisation Capability Registry (human mirror)

**Authoritative runtime seed:** `lib/convergence-os/seed/capabilities.ts`  
**Remediation inventory:** `docs/remediation/CAPABILITY_INVENTORY.md`  
**Inspection date:** 2026-07-17 — post #327 on `main`  
**Public claim allowed:** false for all rows below unless registry + evidence say otherwise.

This table reconciles documentation with verified source. It does **not** enable flags
or assert registration.

| Capability key | Title | Verified classification | Persistence | Flags (default) | Notes |
|----------------|-------|-------------------------|-------------|-----------------|-------|
| care.request_loop | Care request → evidence | merged_but_flagged / pilot-grade | Prisma Care* | no master care flag | Agreements + billing handoff landed (#327) |
| care.agreements | Accessible service agreements | merged_but_flagged | Prisma `CareServiceAgreement` | — | Versioned accept APIs; not production_supported |
| transport.trip_ops | TransportTrip operations | merged_but_flagged | Prisma TransportTrip* | honesty matrix | Trip ≠ outcome |
| transport.quotes | Transport quotes | merged_but_flagged | Prisma `TransportQuote*` | — | Durable versions; acceptance ≠ provider exact address |
| transport.location_disclosure | Staged address disclosure | merged_but_flagged | service logic | — | Exact address after acceptance |
| billing.centre | Billing Centre | merged_and_operational (gated) | Prisma Billing* | NDIA/payouts/PM off | Evidence handoff from Care/Transport |
| communication.passport | Communication Passport | merged_but_flagged | `AccessibilityProfile` + AuditEvent | `MAPABLE_COMMUNICATION_PASSPORT_ENABLED=false` | Projection — not second profile SoT |
| workforce.readiness | Assignment readiness | merged_but_flagged | evaluates WorkerProfile | `MAPABLE_WORKFORCE_READINESS_ENABLED=false` | Auto-assign permanently false |
| access.intelligence_next | Living Access Fabric | merged_but_synthetic | fixtures | AI Next flags off | Not personally usable truth |
| accesscast.outlook | AccessCast outlook | merged_but_synthetic | fixtures | `MAPABLE_ACCESSCAST_*=false` | Synthetic Harbour / Starting Work |
| pilot.starting_work | Starting Work pilot | merged_but_synthetic | process/fixture | `MAPABLE_STARTING_WORK_PILOT_ENABLED=false`; synthetic-only default | DB journey is PR 4 |
| mobile.companion | Native Companion | scaffold + flagged server | Expo + APIs | `MAPABLE_COMPANION_*=false` | Foundation; not production Companion |
| provider.ops_attention | Provider Ops attention | merged_but_flagged | Prisma reads only | `MAPABLE_PROVIDER_OPS_ENABLED=false` | Read-only; never second writer |
| continuity.mission_recovery | Continuity / mission recovery | open_pr / thin on main | Care backup recovery only | — | Full Continuity is later PR |
| academy.courses | Provider Academy | merged_but_flagged | Prisma enrollments | — | Course ≠ competency |
| regional.capacity_exchange | Regional Capacity Exchange | scaffold / absent as product | CapacityBlock ≠ exchange | — | Defer national marketplace |
| at.lifecycle | Assistive technology lifecycle | scaffold | marketplace taxonomy | — | Partner assessment/repair |
| accountability.appeals | Appeals / accountability | open_pr / scaffold | — | — | #307/#311 tips |
| ndis.claim_submission | NDIA live submit | blocked_by_external_approval | mock gateway | off | Must stay disabled |
| managed.support_delivery | MapAble Managed Support | blocked_by_registration | — | — | Do not fabricate registration |

## Operating lanes

See [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md). Managed Support and
Network must remain separated in every public surface.

## Next implementation PRs

See [docs/strategy/STRATEGIC_OPPORTUNITIES.md](../strategy/STRATEGIC_OPPORTUNITIES.md).
