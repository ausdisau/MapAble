# MapAble shared programme foundation

Principal reference for the twelve connected MapAble programmes built on MapAble Core, CareOS, Access Intelligence, and AURA.

## Purpose

Prompt 0 establishes:

1. Canonical domain reconciliation (see `CANONICAL_DOMAIN_MAP.md`)
2. Branch reconciliation against open PRs (see `BRANCH_RECONCILIATION.md`)
3. Shared cross-programme infrastructure
4. Implementation map for Prompts 1–12 (see `DELIVERY_SEQUENCE.md`)

**This PR does not implement the twelve programme product interfaces.**

## Architecture principles

### Single spine

MapAble Core remains the shared identity, billing, messaging, support, permissions, and integration backbone. Each programme extends — never rebuilds — its own digital fiefdom.

### Authority split

```
Participant (primary decision-maker)
    ↓ explicit authority grants
Supporters / carers / navigators / clinicians (assist only within scope)
    ↓
AURA (explain, simulate, propose — never decide)
    ↓ participant approval
Deterministic services (authorise outcomes)
    ↓
Application services (execute writes)
```

## Shared safety invariants

Implemented in `lib/programmes/safety-invariants.ts` and enforced in tests:

1. The disabled person remains the primary decision-maker.
2. Supporters, families, carers, clinicians and navigators assist only within explicit authority.
3. Never infer access requirements from diagnosis.
4. Never infer legal or cognitive capacity.
5. Missing information remains unknown.
6. A model cannot decide legal eligibility.
7. A model cannot decide clinical readiness.
8. A model cannot approve funding.
9. A model cannot release payment.
10. A model cannot resolve safeguarding matters.
11. Every disclosure is recipient, purpose, field and expiry specific.
12. Durable memory is not consent.
13. A credential is not consent.
14. A recommendation is not a legal or professional determination.
15. Chat is never the only workflow.
16. Participant-facing essential access and safety information must not depend on a paid subscription.
17. Paid placement must not change trust, evidence, reliability or moderation.
18. Complaints, corrections and human escalation must remain available.
19. All programme actions emit correlated audit events.
20. Every risky capability is controlled by a server-side feature flag.

## Shared modules

| Module               | Path                                  | Purpose                                     |
| -------------------- | ------------------------------------- | ------------------------------------------- |
| Safety invariants    | `lib/programmes/safety-invariants.ts` | Typed rules + validation helpers            |
| Feature flags        | `lib/config/programme-flags.ts`       | 12 programme umbrella flags (default false) |
| Programme audit      | `lib/programmes/audit.ts`             | Correlated `AuditEvent` emission            |
| Source registry      | `lib/programmes/source-registry/`     | Versioned legislation, guidance, datasets   |
| Navigator foundation | `lib/programmes/navigator/`           | Human navigator exchange                    |
| Trust ledger         | `lib/programmes/trust-ledger/`        | Service relationship explanations           |
| Authority            | `lib/programmes/authority/`           | Participant authority grants                |
| Contracts            | `lib/programmes/contracts/`           | Typed programme adapter interfaces          |
| Adapters             | `lib/programmes/adapters/`            | Bridges + labelled mocks                    |

## Programme contracts

| Interface                     | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `ProgrammeSourceAdapter`      | Versioned source lookup and supersession warnings    |
| `ProgrammeDirectoryAdapter`   | Service/scheme directory search                      |
| `HumanNavigatorAdapter`       | Navigator search, assignment, handover               |
| `ParticipantAuthorityPolicy`  | Scoped authority evaluation                          |
| `MissionDependencyAdapter`    | Mission/case dependency graph (bridges `Case` today) |
| `EvidenceAttachmentService`   | Evidence linking with provenance                     |
| `DocumentChecklistService`    | Required documents per pathway                       |
| `ApplicationPreflightService` | Pre-submission checks (no eligibility decision)      |
| `ProgrammeReferralService`    | Referral drafts (participant approval required)      |
| `ProgrammeOutcomeService`     | Outcome capture                                      |
| `ProgrammeExportService`      | Offline/print pack generation                        |

Mock adapters export `isMock: true` and are clearly labelled.

## Source registry

`ProgrammeSourceRecord` supports:

- Source organisation, jurisdiction, title, type, version
- Effective/expiry/retrieval dates
- Authoritative vs draft/consultation status
- Licence, attribution, source hash
- Affected programmes, review owner, next review, superseding source

**Rule:** Source page changes do not automatically change production rules. Use `ProgrammeSourceImpactReview` workflow.

Optional future link: `regulatorySourceVersionId` → PR #278 `RegulatorySourceVersion`.

## Human navigator foundation

Navigators may assist with: explaining pathways, completing forms, gathering evidence, coordinating providers, escalating uncertainty, connecting to advocacy.

Navigators may **not** automatically receive: complete participant profile, unrelated missions, diagnosis, financial records, health information.

Assignment requires participant approval unless a lawful emergency process outside this programme applies.

## Trust and relationship ledger

Explanatory domain only — **must not issue legal conclusions**.

Explains: who provides a service, who employs the worker, MapAble's role, payment pathway, fee components, cancellation/insurance/complaint responsibility, credentials checked/not checked, conflicts of interest, current consent.

## Feature flags

All programme flags default `false`. Server-side only — never `NEXT_PUBLIC_*`:

- `MAPABLE_PATHWAYS_ENABLED`
- `MAPABLE_TRANSITION_HOME_ENABLED`
- `MAPABLE_KIDS_ENABLED`
- `MAPABLE_LIFESPAN_ENABLED`
- `MAPABLE_HOME_ENABLED`
- `MAPABLE_AT_LIFECYCLE_ENABLED`
- `MAPABLE_WORK_RETENTION_ENABLED`
- `MAPABLE_CARER_CONTINUITY_ENABLED`
- `MAPABLE_REGIONAL_CAPACITY_ENABLED`
- `MAPABLE_RIGHTS_NAVIGATOR_ENABLED`
- `MAPABLE_INTEGRATION_FOUNDRY_ENABLED`
- `MAPABLE_DATA_COOPERATIVE_ENABLED`

## Related documentation

- `docs/modules/consent.md` — consent scopes and service functions
- `docs/modules/cross-module-orchestration.md` — care/transport/jobs orchestration
- `docs/modules/privacy-and-audit.md` — audit event patterns
- `docs/safety.md` — incident and support ticket flows
- `docs/design-system.md` — accessible UI patterns
- `docs/mapable/platform-provider-patterns.md` — draft-only AI, participant confirmation

## Test foundation

Shared tests under `tests/programmes/` cover:

- Participant ownership and supporter authority
- Cross-tenant access denial
- Source versioning and supersession
- Consent minimisation and navigator field scope
- Human escalation paths
- Audit correlation
- Feature-flag denial
- AI boundary (no eligibility/clinical/payment decisions)
- Accessible non-chat workflow presence
- Mock adapter labelling
