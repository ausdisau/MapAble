# Canonical domain map — MapAble programmes

This document records canonical domain decisions for the twelve connected MapAble programmes. Use **accepted repository implementations** where they exist; do not create parallel systems.

## Identity and tenancy

| Concept                 | Canonical model                               | Location                                        | Notes                                                |
| ----------------------- | --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Person identity         | `User`                                        | `prisma/schema.prisma`                          | Single auth identity                                 |
| Tenancy                 | `Organisation` + `OrganisationMember`         | schema                                          | Care/transport org spine                             |
| Roles                   | `UserRoleAssignment`, `MapAbleUserRole`       | schema + `lib/auth/permissions.ts`              | Multi-role table ready                               |
| Participant profile     | `ParticipantProfile`                          | schema                                          | Demographics, NDIS refs                              |
| Presentation prefs      | `AccessibilityProfile`                        | schema                                          | Stable cross-module UI/access prefs                  |
| Functional requirements | `AccessPassport`                              | **Target:** PR #273 (`AiAccessPassport` rename) | Participant-selected functional needs; not diagnosis |
| Delegation              | `ConsentRecord` + `ParticipantAuthorityGrant` | schema + this PR                                | Field/purpose/expiry-specific sharing                |

### Duplicates — do not extend for new programmes

| Legacy                             | Canonical                   | Rule                                |
| ---------------------------------- | --------------------------- | ----------------------------------- |
| `Provider`, `ProviderProfile`      | `Organisation` + membership | Application services remain writers |
| `AccessiblePlace`                  | `AccessPlace`               | New writes to `AccessPlace` only    |
| `FhirConsentRecord`, micro-consent | `ConsentRecord`             | Extend scopes; don't fork           |

## Mission and coordination

| Concept                    | Canonical (target)   | Interim on `main`                | Notes                                 |
| -------------------------- | -------------------- | -------------------------------- | ------------------------------------- |
| Mission / dependency graph | `CareOSMission`      | `Case` + `CaseLink`              | Bridge via `MissionDependencyAdapter` |
| Mission events             | `CareOSMissionEvent` | `CaseNote`, `OrchestrationEvent` | Post-merge: single event stream       |
| Cross-module orchestration | `OrchestrationEvent` | `lib/orchestration/`             | Idempotency keys preserved            |

**Rule:** No new programme may create a parallel case-management system when mission models can be extended.

## Consent and authority

| Concept              | Canonical                        | Service                                                     |
| -------------------- | -------------------------------- | ----------------------------------------------------------- |
| Sharing records      | `ConsentRecord`                  | `lib/consent/consent-service.ts`                            |
| Micro-consent gates  | `MICRO_CONSENT_ACTIONS`          | `lib/consent/micro-consent-service.ts`                      |
| Scoped delegation    | `ParticipantAuthorityGrant`      | `lib/programmes/authority/participant-authority-service.ts` |
| Coordinator (legacy) | `SupportCoordinatorRelationship` | Link optional to `NavigatorAssignment`                      |

## Audit and events

| Concept               | Canonical                         | Notes                                       |
| --------------------- | --------------------------------- | ------------------------------------------- |
| Audit trail           | `AuditEvent`                      | `lib/audit/audit-event-service.ts`          |
| Programme correlation | `correlationId` in audit metadata | `lib/programmes/audit.ts`                   |
| Outbox (target)       | PR #252                           | Not on `main`; don't duplicate              |
| In-memory ledger      | `lib/ledger/`                     | Hash chain for copilot drafts only; not SoR |

## Places and access intelligence

| Concept               | Canonical                     | Extension                                          |
| --------------------- | ----------------------------- | -------------------------------------------------- |
| Public place identity | `AccessPlace`                 | `AccessPlaceSource` for provenance                 |
| Living Access Twin    | `AccessPlace` + twin metadata | PR #273 `AiLivingTwinMeta`                         |
| Route/fit evidence    | Access Intelligence engines   | AURA may explain; deterministic services authorise |

## Care, transport, jobs, calendar

Existing application-service writers — **reuse, don't duplicate:**

- Care: `CareRequest`, `CareShift`, `CareBooking` — `lib/care/`
- Transport: `TransportTripRequest`, `TransportTrip` — `lib/transport/`
- Jobs: `Job`, `JobApplication` — existing jobs domain
- Calendar: `CalendarEvent`
- Billing: `BillingInvoice`, `Invoice`, NDIS claiming
- Incidents: `IncidentReport` — safeguarding escalation
- Complaints: `Complaint`, engagement submissions
- Messaging: `Conversation`, `Message`
- Provider verification: `ProviderVerificationCase`

## AI boundary (AURA)

| Layer                  | Role                                                        |
| ---------------------- | ----------------------------------------------------------- |
| AURA                   | Explain, simulate, propose (L3_PROPOSE ceiling on open PRs) |
| Deterministic services | Authorise consequential outcomes                            |
| Application services   | Execute writes                                              |
| AI tools               | **Never** write directly to production records              |

## Programme-specific foundations (this PR)

| Foundation          | Models / services                                        |
| ------------------- | -------------------------------------------------------- |
| Source registry     | `ProgrammeSourceRecord`, `ProgrammeSourceImpactReview`   |
| Human navigator     | `NavigatorProfile` … `NavigatorFeedback`                 |
| Trust ledger        | `ServiceRelationshipRecord`, `TrustRelationshipSnapshot` |
| Programme contracts | `lib/programmes/contracts/*`                             |
| Feature flags       | `MAPABLE_*_ENABLED` — server-side only                   |

## Twelve programmes — domain extension points (not implemented in Prompt 0)

Each programme extends shared foundations; see `DELIVERY_SEQUENCE.md`:

1. Pathways — pathway programmes, referrals, navigator exchange
2. Transition Home — discharge coordination, home readiness
3. Kids — family authority, child participation
4. Lifespan — scheme transitions, continuity
5. Home — property access twin, tenancy
6. AT Lifecycle — equipment passport, repair/loan
7. Work Retention — employment mission, adjustments
8. Carer Continuity — backup/respite, handover
9. Regional Capacity — hub/spoke, mutual aid
10. Rights Navigator — fee comparison, complaints
11. Integration Foundry — partner certification
12. Data Cooperative — contributor governance
