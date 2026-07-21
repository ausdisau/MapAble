# NDIS Expansion Master Plan

**Status:** Wave 0 on `main`; Wave 1 open as draft #382 — not production approval  
**Inspection base:** `origin/main` @ `6279ab91` (#380 docs + #381 migrate-from-zero)  
**Public claim:** unsupported — MapAble is not claimed as an NDIS-registered provider  
**Empty-DB migrate-from-zero:** `VERIFIED` green — production history reconciliation remains `OWNER_ACTION_REQUIRED`

This programme extends the existing MapAble platform with eleven **connected** systems.
They are not eleven independent applications. Every system reuses canonical identity,
tenancy, consent, audit, place, care, transport, calendar, incident, worker, billing,
support-coordination, plan-manager, and provider domains documented in
[CANONICAL_DOMAIN_MAP.md](./CANONICAL_DOMAIN_MAP.md) and
[NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md).

## Operating lanes

Every capability declares exactly one lane from
[docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md):

| Lane                        | Role in this programme                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **MapAble Connect**         | Participant-controlled planning, evidence, AT continuity, psychosocial workspace, early childhood family tools            |
| **MapAble Network**         | Connections to independent providers; accurate registration disclosure                                                    |
| **MapAble Managed Support** | Direct regulated delivery — **unavailable** until registration, workforce, insurance, governance, and capacity are proven |
| **MapAble Infrastructure**  | SaaS/API tools for providers, coordinators, practitioners, plan managers, equipment partners, councils                    |

UI, terms, data access, and public claims must never blur these lanes.

## Eleven connected systems

| #   | System                                               | Primary lane                      | Planned flag (default false)                                                                | Product wave |
| --- | ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| 1   | Assistive Technology Continuity                      | Connect (+ Network handoffs)      | `MAPABLE_AT_CONTINUITY_ENABLED`                                                             | Wave 1       |
| 2   | Home and Living Navigation and Transition            | Connect                           | `MAPABLE_HOME_LIVING_NAVIGATOR_ENABLED`                                                     | Wave 4       |
| 3   | Support Coordination Outcomes and Reporting          | Infrastructure / Connect          | `MAPABLE_SUPPORT_COORDINATION_OUTCOMES_ENABLED`                                             | Wave 3       |
| 4   | Participant Plan and Evidence Navigator              | Connect                           | `MAPABLE_PLAN_EVIDENCE_NAVIGATOR_ENABLED`                                                   | Wave 2       |
| 5   | Provider Quality and Workforce Assurance             | Infrastructure                    | `MAPABLE_WORKFORCE_ASSURANCE_ENABLED`                                                       | Wave 5       |
| 6   | Psychosocial Recovery Continuity                     | Connect                           | `MAPABLE_PSYCHOSOCIAL_RECOVERY_ENABLED`                                                     | Wave 6       |
| 7   | Positive Behaviour Support Practice Operations       | Infrastructure (partner clinical) | `MAPABLE_PBS_OPERATIONS_ENABLED` (+ AI / RP flags)                                          | Wave 7       |
| 8   | Early Childhood Family Workspace                     | Connect                           | `MAPABLE_EARLY_CHILDHOOD_WORKSPACE_ENABLED`                                                 | Wave 8       |
| 9   | Allied Health and Home Modification Exchange         | Network / Infrastructure          | `MAPABLE_ALLIED_HEALTH_EXCHANGE_ENABLED` / `MAPABLE_HOME_MODIFICATION_COORDINATION_ENABLED` | Wave 9       |
| 10  | Plan Management Infrastructure                       | Infrastructure                    | `MAPABLE_PLAN_MANAGER_INFRASTRUCTURE_ENABLED`                                               | Wave 10      |
| 11  | Regional Thin-Market and Service Continuity Exchange | Infrastructure / Network          | `MAPABLE_REGIONAL_CAPACITY_EXCHANGE_ENABLED`                                                | Wave 11      |

Precursor Prompt 0 flags already on main (`MAPABLE_AT_LIFECYCLE_ENABLED`,
`MAPABLE_HOME_ENABLED`, `MAPABLE_TRANSITION_HOME_ENABLED`,
`MAPABLE_REGIONAL_CAPACITY_ENABLED`, etc.) remain server-side defaults **false**.
Wave product flags listed above are **planned** in Wave 0 documentation only — not
wired into runtime product code until their wave lands.

Hard-off flags that must remain false even after later waves:

- `MAPABLE_NDIA_CLAIM_SUBMISSION_ENABLED`
- `MAPABLE_AUTOMATED_PAYMENT_APPROVAL_ENABLED`
- any Managed Support enablement without registration evidence

## Programme-wide lifecycle states

Shared vocabulary for participant-facing and professional artefacts:

| State                          | Meaning                                          |
| ------------------------------ | ------------------------------------------------ |
| `draft`                        | Editable working version                         |
| `awaiting_participant_review`  | Shared for participant comment / acknowledgement |
| `awaiting_professional_review` | Shared for authorised professional review        |
| `approved`                     | Human-approved version (role-specific)           |
| `active`                       | Current operational version                      |
| `paused`                       | Temporarily not in force                         |
| `superseded`                   | Replaced by a newer approved version             |
| `withdrawn`                    | Withdrawn by authorising party                   |
| `expired`                      | Past effective end / review deadline             |

Specialist domains (e.g. PBS restrictive-practice authorisation, claim preparation)
may use tighter state machines. Do not force identical states where specialist law
or practice requires additional transitions.

## AI and safety boundaries

AI may retrieve, explain, translate into accessible language, compare, summarise,
identify missing information, draft, simulate, propose, and prepare source-cited
reports for **human review**.

AI must never: determine NDIS eligibility or reasonable-and-necessary supports;
diagnose; prescribe therapy; conduct a functional behaviour assessment; approve a
behaviour support plan; authorise a restrictive practice; determine practitioner
suitability; approve a worker or provider; infer participant risk, honesty, capacity,
or disability severity; automatically rank participants/workers/providers by worth;
automatically assign workers; approve or submit claims; approve or release payments;
provide emergency dispatch; replace 000 / health / safeguarding / crisis services;
lodge regulatory documents without authorised human approval.

Every generated artefact must disclose that it is a draft, its sources, missing
information, uncertainty, the required human approver, and prohibited AI actions.
Externally sourced documents and uploads are untrusted data, not AI instructions.

## Entry gate (Wave 0)

Product waves must not start until:

1. PR #378 release blockers are resolved or superseded — **merged** on inspected tip
2. Required CI checks are effective
3. Migration-from-zero passes on disposable PostgreSQL — **green** after #381 (see
   [MIGRATE_FROM_ZERO_REPAIR.md](../remediation/MIGRATE_FROM_ZERO_REPAIR.md))
4. Prisma migration order and integrity checks pass
5. Authentication and tenant-isolation tests pass on the supported main tip
6. Feature freeze is lifted or explicitly waived for the target domain

Wave 0 (#380) delivered documentation and registry reconciliation.
Wave 1 AT Continuity proceeds under the AT domain waiver with the flag default false.
See [NDIS_EXPANSION_DELIVERY_SEQUENCE.md](./NDIS_EXPANSION_DELIVERY_SEQUENCE.md) and
[AT_CONTINUITY_WAVE1.md](./AT_CONTINUITY_WAVE1.md).

## Definition of done (per product wave)

A wave is complete only when it reuses canonical domains; migrations pass from zero;
tenant and IDOR tests pass; consent and authority tests pass; accessibility tests
pass; human approval boundaries are enforced; unsafe AI actions are refused; public
claims remain accurate; feature flags default false; rollback is documented; and the
draft PR is independently reviewable.

“Code exists”, “CI green”, “provider listed”, “AI generated a document”, and
“invoice validated” are **not** regulatory approval, registration, professional
approval, or claim approval.

## Related

- [NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md)
- [NDIS_EXPANSION_PR_RECONCILIATION.md](./NDIS_EXPANSION_PR_RECONCILIATION.md)
- [NDIS_REGULATORY_GATE_MATRIX.md](./NDIS_REGULATORY_GATE_MATRIX.md)
- [NDIS_EXPANSION_DELIVERY_SEQUENCE.md](./NDIS_EXPANSION_DELIVERY_SEQUENCE.md)
- [docs/strategy/BUILD_PARTNER_DEFER.md](../strategy/BUILD_PARTNER_DEFER.md)
- [docs/productisation/CAPABILITY_REGISTRY.md](../productisation/CAPABILITY_REGISTRY.md)
