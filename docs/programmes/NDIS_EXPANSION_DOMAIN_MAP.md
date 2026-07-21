# NDIS Expansion — Canonical Domain Map

**Status:** Wave 0 reconciliation — authoritative against current `main` code  
**Companion:** [CANONICAL_DOMAIN_MAP.md](./CANONICAL_DOMAIN_MAP.md) (Prompt 0 programmes)  
**Rule:** search schema, migrations, code, and PR history before adding any model

## Status vocabulary

| Status | Meaning |
|--------|---------|
| available on main | Model/service present and reusable |
| precursor flag only | Prompt 0 flag exists; product domain not built |
| planned | Documented for a future expansion wave |
| open PR | Proposed elsewhere; not a dependency |
| feature-branch-only | Merged into an unmerged feature branch — not on `main` |
| partner boundary | Clinical/provider SoT remains external |
| blocked | External/human/regulatory gate |

## Canonical sources of truth (reuse)

| Concept | Canonical | Status | Notes |
|---------|-----------|--------|-------|
| Person identity | `User` | available on main | Single auth identity |
| Tenancy | `Organisation` + `OrganisationMember` | available on main | Server-derived tenant only |
| Participant identity | `ParticipantProfile` | available on main | Demographics — do not fork |
| Presentation prefs | `AccessibilityProfile` | available on main | Operational UI/access prefs |
| Communication / Access Passport | TS projection over `AccessibilityProfile` | available on main | Adapter if AccessPassport PR absent |
| Consent | `ConsentRecord` | available on main | Field/purpose-scoped sharing |
| Scoped delegation | `ParticipantAuthorityGrant` | available on main | Purpose/field/action/expiry |
| Audit | `AuditEvent` | available on main | No sensitive payloads |
| Public place / venue | `AccessPlace` | available on main | `lib/access-map/` sole writer |
| Care delivery | Care\* entities | available on main | Continuity links only |
| Transport | `TransportTrip` (+ canonical transport) | available on main | Continuity links only |
| Calendar | `CalendarEvent` | available on main | Coordination only |
| Incidents / complaints | `IncidentReport` (+ related) | available on main | Escalation references |
| Worker | `WorkerProfile` (+ credentials) | available on main | Workforce assurance extends, does not fork |
| Billing / invoices | Billing Centre entities | available on main | Plan-manager infrastructure extends |
| Support Coordinator | `SupportCoordinatorRelationship`, tasks, access requests | available on main | Outcomes layer reuses |
| Plan Manager | `PlanManagerRelationship`, invoice review, queries | available on main | Infrastructure extends |
| Provider / outlet | Provider\* / NDIS provider entities | available on main | No second directory |
| Service agreements | `ServiceAgreement` / `CareServiceAgreement` | available on main | Track, do not duplicate |
| Programme sources | `ProgrammeSourceRecord` | available on main | Evidence provenance |
| NDIS catalogue (existing) | `NdisSupportItem` / price catalogue\* | available on main | Versioned ingestion must preserve effective dates |

### Legacy — do not extend as SoT

| Legacy | Canonical | Rule |
|--------|-----------|------|
| `AccessiblePlace` | `AccessPlace` | New writes → `AccessPlace` only |
| FHIR/telehealth consent as sharing SoT | `ConsentRecord` | Specialised records stay specialised |
| Speculative CareOS mission tables | Case / mission adapters | No second mission SoT from expansion waves |
| Marketplace AT taxonomy alone | Future AT Continuity entities | Taxonomy ≠ equipment asset register |

## Expansion systems → domain ownership

| System | Planned owner path | Reuses | Must not create |
|--------|-------------------|--------|-----------------|
| AT Continuity | `lib/at-continuity/**` (Wave 1 in #382; writers flag-gated; not on main yet) | ParticipantProfile, ConsentRecord, AuditEvent, Care/Transport/Jobs links, provider refs | Clinical suitability SoT; second participant identity; emergency-response claims |
| Plan & Evidence Navigator | `lib/plan-evidence/**` (planned) | Personal data vault patterns, ProgrammeSourceRecord, ConsentRecord, AuditEvent, ParticipantAuthorityGrant | Eligibility engine; fabricated budgets |
| Support Coordination Outcomes | `lib/support-coordinator/**` (extend) | Existing SC relationships/tasks/plan summaries | Second SC relationship model |
| Home & Living Navigator | `lib/home-living/**` (planned) | AccessPlace, Care, Transport, AT links, service agreements | Duplicate property registry; housemate compatibility scores |
| Workforce Assurance | `lib/workforce-readiness/**` + provider-quality (extend) | WorkerProfile, credentials, Academy, incidents | Worker quality scores; auto-assign; auto-clearance |
| Psychosocial Recovery | `lib/psychosocial-recovery/**` (planned) | Consent, Audit, Calendar, Care links | Clinical treatment plan; crisis prediction |
| PBS Operations | `lib/pbs-operations/**` (planned canonical) | Consent, Audit, Incident, Worker acknowledgement | AI-approved plans; MapAble as clinical SoT; **reject** #379 `lib/positive-behaviour-support/**` as Wave 7 SoT |
| Early Childhood | `lib/early-childhood/**` (planned) | ParticipantAuthorityGrant, Consent, Audit | Developmental ranking scores; advertising use |
| Allied Health / Home Mod | `lib/allied-health-exchange/**` (planned) | Provider directory, AT Continuity, AccessPlace, Billing evidence | Prescribing; building certification by MapAble |
| Plan Management Infrastructure | `lib/plan-manager/**` + `lib/billing/**` (extend) | Billing Centre, catalogue, agreements | Live NDIA submit; AI payment approval |
| Regional Capacity Exchange | `lib/regional-capacity/**` (planned) | Provider outlets, CapacityBlock (≠ exchange), TransportNetworkRegion | Participant prioritisation scores; pay-to-rank |

## Precursor flags on main (not product completion)

| Precursor flag | Relates to | Status |
|----------------|------------|--------|
| `MAPABLE_AT_LIFECYCLE_ENABLED` | AT Continuity (Wave 1) | precursor flag only — scaffold / marketplace taxonomy |
| `MAPABLE_HOME_ENABLED` / `MAPABLE_TRANSITION_HOME_ENABLED` | Home & Living (Wave 4) | precursor flag only |
| `MAPABLE_REGIONAL_CAPACITY_ENABLED` | Regional Exchange (Wave 11) | precursor flag only — `CapacityBlock` ≠ exchange product |
| `MAPABLE_WORKFORCE_READINESS_ENABLED` | Workforce Assurance (Wave 5) | available readiness evaluate API — assurance register still planned |
| `MAPABLE_KIDS_ENABLED` | Early Childhood (Wave 8) | precursor programme flag only |

## Do not create

- A second participant identity
- A second provider directory
- A second worker profile
- A second consent ledger
- A second audit ledger
- Duplicate Care, Transport, Calendar, Incident, or Billing records
- A second place/property identity where `AccessPlace` or a verified external reference suffices
- A separate clinical record pretending to be authoritative
- A generic “NDIS super table” of unrelated JSON
- An unvalidated AI memory store

All organisation and participant scope must be derived server-side. Never trust a
client-supplied tenant ID without membership and authority verification.

## Partner boundaries

See [BUILD_PARTNER_DEFER.md](../strategy/BUILD_PARTNER_DEFER.md): SIL/SDA delivery,
complex clinical supports, allied health prescribing, behaviour support clinical
governance, professional AT assessment, emergency response, and independent clinical
review remain partner or external boundaries. MapAble coordinates journeys, evidence
handoffs, and participant-controlled continuity — it does not become the clinical SoT.
