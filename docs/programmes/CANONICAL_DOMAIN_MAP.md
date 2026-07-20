# Canonical domain map — MapAble programmes (reconciled)

Authoritative source: **repository code on current `main`**, not closed PR descriptions.

## Status vocabulary

| Status            | Meaning                                                 |
| ----------------- | ------------------------------------------------------- |
| available on main | Model/service present and usable                        |
| adapter-backed    | Absent or interim; programmes use a replaceable adapter |
| open PR           | Proposed elsewhere; not a dependency                    |
| closed/unmerged   | Must not be treated as landed                           |
| deferred          | Intentionally out of Prompt 0                           |
| blocked           | External/human gate                                     |

## Identity and tenancy

| Concept                    | Canonical                             | Status                     | Notes                                                                   |
| -------------------------- | ------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| Person identity            | `User`                                | available on main          | Single auth identity                                                    |
| Tenancy                    | `Organisation` + `OrganisationMember` | available on main          | Server-derived tenant only                                              |
| Participant profile        | `ParticipantProfile`                  | available on main          | Demographics                                                            |
| Presentation prefs         | `AccessibilityProfile`                | available on main          | Operational UI/access prefs                                             |
| Functional access passport | `AccessPassport`                      | **closed/unmerged** (#273) | **Adapter-backed** via Communication Passport over AccessibilityProfile |
| Communication Passport     | TS projection                         | available on main          | `lib/communication-passport/` — not a second SoT                        |
| Consent                    | `ConsentRecord`                       | available on main          | Extend via services; no parallel ledger                                 |
| Scoped delegation          | `ParticipantAuthorityGrant`           | **this PR**                | Purpose/field/action/expiry grants                                      |
| Audit                      | `AuditEvent`                          | available on main          | Programme correlation via metadata; no sensitive payloads               |

### Duplicates — do not extend

| Legacy                                     | Canonical              | Rule                                                      |
| ------------------------------------------ | ---------------------- | --------------------------------------------------------- |
| `AccessiblePlace`                          | `AccessPlace`          | New programme writes → `AccessPlace` only                 |
| `FhirConsentRecord` / micro-consent as SoT | `ConsentRecord`        | Micro-consent gates actions; ConsentRecord is sharing SoT |
| Speculative `CareOSMission` tables         | Interim `Case` adapter | No DDL until reviewed mission SoT lands                   |

## Mission and coordination

| Concept                  | Target          | Current                           | Status                                                                 |
| ------------------------ | --------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Mission graph            | `CareOSMission` | **Absent** (#252 closed/unmerged) | **adapter-backed** — `CaseMissionAdapter` / `MissionDependencyAdapter` |
| Starting Work projection | —               | `StartingWorkJourneyProjection`   | available on main — temporary; not CareOSMission                       |
| Mission portfolio        | —               | `lib/mission-portfolio/`          | available on main — read-only projection                               |

**Rule:** Programme code must not write speculative mission tables. Replace the Case adapter through the interface when a mission SoT is accepted.

## Places

| Concept               | Canonical         | Status                                   |
| --------------------- | ----------------- | ---------------------------------------- |
| Public place identity | `AccessPlace`     | available on main — `lib/access-map/`    |
| Legacy place          | `AccessiblePlace` | available on main — **read/legacy only** |

Why `AccessiblePlace` still exists: historical data and older routes. Paths that could dual-write must be inventoried in Access domain ownership; **programme services are forbidden from creating `AccessiblePlace`**.

## Source registry ownership

| Concern                               | Owner                                      | Status                                   |
| ------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| Programme evidence / guidance sources | `ProgrammeSourceRecord` (+ impact reviews) | **this PR**                              |
| Regulatory versioning for assurance   | `RegulatorySourceVersion` (proposed #278)  | open PR / not mergeable — **deferred**   |
| Bridge                                | `PlatformAssuranceSourceAdapter`           | adapter-backed, `productionReady: false` |

Prefer one shared source/version spine later; do **not** copy #278’s model into programmes.

## AI / AURA boundary (current main)

| Layer                          | Status            | Role                                                   |
| ------------------------------ | ----------------- | ------------------------------------------------------ |
| `lib/aura/` Agent OS           | absent            | Not a dependency                                       |
| AI-platform authority ceilings | available on main | `READ_ONLY_EXPLAIN` … `NO_OPERATIONAL_AUTHORITY`       |
| Companion Stop AURA            | available on main | Device-local stop                                      |
| Programme execution gate       | **this PR**       | Proposal-only models; stop + authority + tenant checks |

Programme adapters may read governed proposals. Models cannot publish, certify, approve, consent, refer, book, pay, or execute. Executable paths require participant authority and deterministic services. Stop state invalidates execution eligibility.

## Care, transport, billing, jobs

Reuse existing writers — do not fork:

- Care / Transport / Billing / Jobs / Calendar / Incidents / Complaints / Messaging

## Programmes introduced here

Source registry, participant authority grants, navigator foundation, trust relationship ledger — additive, flag-gated, default false.
