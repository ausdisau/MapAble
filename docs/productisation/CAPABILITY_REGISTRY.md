# Productisation Capability Registry (human mirror)

**Authoritative runtime seed:** `lib/convergence-os/seed/capabilities.ts`  
**Remediation inventory:** `docs/remediation/CAPABILITY_INVENTORY.md`  
**Inspection date:** 2026-07-20 — post #378 on `main` + NDIS Expansion Wave 0 docs  
**Public claim allowed:** false for all rows below unless registry + evidence say otherwise.

This table reconciles documentation with verified source. It does **not** enable flags
or assert registration.

| Capability key | Title | Verified classification | Persistence | Flags (default) | Notes |
|----------------|-------|-------------------------|-------------|-----------------|-------|
| care.request_loop | Care request → evidence | merged_but_flagged / pilot-grade | Prisma Care* | no master care flag | Agreements + billing handoff landed (#327) |
| care.agreements | Accessible service agreements | merged_but_flagged | Prisma `CareServiceAgreement` | — | Versioned accept + amend APIs; not production_supported |
| care.recurring_schedules | Recurring Care schedules | merged_but_flagged | Prisma `CareRecurringSchedule*` | `MAPABLE_CARE_RECURRING_SCHEDULES_ENABLED=false` | Weekly/fortnightly + exceptions; cancel ≠ Transport cancel |
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
| ndis.expansion_foundation | NDIS Expansion Wave 0 foundation | documented | docs only | — | No product schema; migrate-from-zero still blocks product waves |
| ndis.at_continuity | Assistive Technology Continuity | scaffolded Wave 1 | `at_*` Prisma tables; `lib/at-continuity/**` | `MAPABLE_AT_CONTINUITY_ENABLED=false`; precursor `MAPABLE_AT_LIFECYCLE_ENABLED=false` | Partner assessment/repair; no clinical suitability SoT |
| ndis.plan_evidence_navigator | Plan and Evidence Navigator | documented / planned Wave 2 | none yet | `MAPABLE_PLAN_EVIDENCE_NAVIGATOR_ENABLED=false` (planned) | No eligibility/funding determination |
| ndis.support_coordination_outcomes | Support Coordination Outcomes | documented / planned Wave 3 | reuse SC on main | `MAPABLE_SUPPORT_COORDINATION_OUTCOMES_ENABLED=false` (planned) | #188/#243 not landed SoT |
| ndis.home_living_navigator | Home and Living Navigator | documented / planned Wave 4 | none yet | `MAPABLE_HOME_LIVING_NAVIGATOR_ENABLED=false` (planned) | No SDA/SIL eligibility decisions |
| ndis.workforce_assurance | Workforce Assurance | documented / planned Wave 5 | extends readiness | `MAPABLE_WORKFORCE_ASSURANCE_ENABLED=false` (planned) | No scores; no auto-assign |
| ndis.psychosocial_recovery | Psychosocial Recovery Continuity | documented / planned Wave 6 | none yet | `MAPABLE_PSYCHOSOCIAL_RECOVERY_ENABLED=false` (planned) | No crisis prediction |
| ndis.pbs_operations | PBS Practice Operations | documented / planned Wave 7 | none yet | `MAPABLE_PBS_*=false` (planned) | High-risk; partner clinical governance |
| ndis.early_childhood_workspace | Early Childhood Family Workspace | documented / planned Wave 8 | none yet | `MAPABLE_EARLY_CHILDHOOD_WORKSPACE_ENABLED=false` (planned) | Strict child privacy |
| ndis.allied_health_exchange | Allied Health / Home Modification | documented / planned Wave 9 | none yet | exchange flags false (planned) | Adapters off until agreements |
| ndis.plan_manager_infrastructure | Plan Management Infrastructure | documented / planned Wave 10 | extend PM/Billing | PM infra false; **NDIA submit false**; **auto payment approval false** | Infrastructure for registered PMs |
| ndis.regional_capacity_exchange | Regional Capacity Exchange | documented / planned Wave 11 | CapacityBlock ≠ exchange | `MAPABLE_REGIONAL_CAPACITY_EXCHANGE_ENABLED=false` (planned) | One-region readiness before national |

## Operating lanes

See [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md). Managed Support and
Network must remain separated in every public surface.

## NDIS Expansion programme

See [docs/programmes/NDIS_EXPANSION_MASTER_PLAN.md](../programmes/NDIS_EXPANSION_MASTER_PLAN.md)
and [docs/programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md](../programmes/NDIS_EXPANSION_DELIVERY_SEQUENCE.md).
Product waves are **not** eligible while migrate-from-zero fails.

## Next implementation PRs

See [docs/strategy/STRATEGIC_OPPORTUNITIES.md](../strategy/STRATEGIC_OPPORTUNITIES.md)
and the NDIS Expansion delivery sequence (Wave 1 AT Continuity only after gates clear).
