# MapAble controlled-pilot charter (canonical)

**Authority:** This file is the single source of truth for the invitation-only controlled pilot boundary.  
**Other docs must cross-link here** rather than restating competing policy.  
**Slice:** invitation-only controlled pilot — **not** broad NDIS production.  
**Last refreshed:** 2026-07-21  
**Inspected `origin/main`:** `7009e9de7c815267577404c324231c504077372e` (reference `3f406c37` is an ancestor; main advanced via #279)

Status vocabulary: `VERIFIED` | `FAILED` | `NOT_RUN` | `BLOCKED` | `OWNER_ACTION_REQUIRED` | `NOT_APPLICABLE`

## Purpose

Run a small, staffed, human-reviewed pilot of MapAble Care and Transport journeys with invited adult participants so the organisation can learn operationally without claiming NDIS registration, WCAG conformance, clinical suitability, emergency response, or broad production readiness.

## Pilot structure (Decision 1)

| Parameter                    | Decision                                                                                           |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Participants                 | 5–10 invited **adult** participants                                                                |
| Geography                    | One **NSW** operating region                                                                       |
| Providers                    | Two or three **manually approved** providers                                                       |
| Duration                     | Four weeks                                                                                         |
| Hours                        | Staffed pilot hours only — Mon–Fri **09:00–17:00 Australia/Sydney**, excluding NSW public holidays |
| Care / Transport progression | **Human review** before every request progresses                                                   |
| Automation                   | No unattended or fully automated service delivery                                                  |

Machine-readable mirror: `lib/pilot/controlled-pilot-baseline.ts` (fail-closed validation for missing owner fields when invoked).

## In-scope journeys

| ID  | Journey                                                          | Gate                                                                  |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| G1  | Registration and authentication                                  | Human session `NOT_RUN`                                               |
| G2  | Participant digital accessibility preferences                    | Human session `NOT_RUN`                                               |
| G3  | Consent grant, narrowing, expiry, revocation                     | Human session `NOT_RUN`                                               |
| G4  | Provider discovery without paid-ranking influence                | Human session `NOT_RUN`                                               |
| G5  | Care request with manual provider review                         | Human session `NOT_RUN`                                               |
| G6  | Transport request without guaranteed routing/availability claims | Human session `NOT_RUN`                                               |
| G7  | Participant confirmation and cancellation                        | Human session `NOT_RUN`                                               |
| G8  | Incident reporting with human escalation                         | Human session `NOT_RUN`                                               |
| G9  | Audit-history inspection                                         | Human session `NOT_RUN`                                               |
| G10 | AT Continuity                                                    | `BLOCKED` until #382 migration + human gates pass; flag remains false |

Detail forms: [CONTROLLED_PILOT_GOLDEN_JOURNEYS.md](./CONTROLLED_PILOT_GOLDEN_JOURNEYS.md), [CONTROLLED_PILOT_RELEASE_SESSION.md](./CONTROLLED_PILOT_RELEASE_SESSION.md).

## Explicitly excluded

| Capability                                         | Status                                |
| -------------------------------------------------- | ------------------------------------- |
| NDIA claim submission                              | Hard-off / `BLOCKED`                  |
| Automated payments                                 | Hard-off / `BLOCKED`                  |
| Automated invoice approval                         | Hard-off / `BLOCKED`                  |
| PBS generation or recommendation                   | Hard-off / `BLOCKED`                  |
| Clinical recommendations                           | Hard-off / `BLOCKED`                  |
| Emergency dispatch / emergency-response claims     | Hard-off / `BLOCKED`                  |
| Autonomous safeguarding decisions                  | Hard-off / `BLOCKED`                  |
| Automated provider selection / unreviewed matching | Hard-off / `BLOCKED`                  |
| Production CSP enforcement                         | Hard-off / `BLOCKED`                  |
| AT Continuity before separate release gate         | `BLOCKED`                             |
| Geoscape capabilities before licensing/privacy     | `BLOCKED` (train separate from pilot) |

Do **not** expose unfinished or internal-only capabilities merely to satisfy pilot scope.

## Plain-language pilot notices (required)

Participants and providers must see notices that state, in plain language:

1. MapAble is **not** an emergency service.
2. Call **000** for an emergency.
3. Requests are **manually reviewed** during staffed pilot hours.
4. Submission does **not** guarantee provider or transport availability.
5. Participants can **withdraw consent** and leave the pilot.
6. Serious safety, privacy, or accessibility issues may **suspend** a workflow or the entire pilot.

UI copy implementation evidence remains `OWNER_ACTION_REQUIRED` / `NOT_RUN` until recorded on the release session.

## Human-review boundaries

- Provider selection: **human decision only**
- Care / Transport progression: human review before progression
- Participant communications: **human-approved templates only**
- Safeguarding: human escalation only — no autonomous decisions
- Release approval: one **independent** approver (not the implementer)

## Emergency disclaimer

MapAble is not an emergency service. Call 000 in an emergency. No product surface may claim emergency dispatch or emergency-response capability.

## Suspension rules

Suspend the affected workflow (or the entire pilot) when any [release stop condition](#release-stop-conditions) is met. Suspension does not require a documentation waiver.

## Consent and withdrawal

Consent grant, narrowing, expiry, and revocation remain in-scope (G3). Inability to revoke consent is a **non-waivable** blocker. Withdrawal from the pilot must be available without penalty to essential safety reporting obligations required by law (legal advice remains owner/specialist).

## Accessibility commitments

- Automated Playwright/axe is necessary but **not** sufficient.
- Manual AT matrix and keyboard/zoom/HCM/reduced-motion evidence required before real-participant enable.
- Do **not** claim WCAG conformance.
- First-party panel (#389) remains flag-off until approved; AccessiBe cut-over is reversible and owner-gated.

## Data-minimisation rules

- Synthetic data for all pre-enable testing — **no real participant data** in engineering/CI.
- Pilot cohort: collect only data necessary for the in-scope journeys.
- No disability inference, assistive-technology detection, or accessibility-preference analytics for advertising/ranking.
- No paid-ranking influence on provider discovery.

## Incident escalation

Follow [INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md) and the responsibility matrix below. Privacy/safeguarding owner owns participant-impacting incidents. Technical incident owner owns platform SEV response during staffed hours.

## Operational targets (Decision 2 — recommended, not achieved)

| Control                    | Pilot decision                                              | Evidence status                                                        |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| RTO                        | 4 hours                                                     | `NOT_RUN` until restore exercise measures it                           |
| RPO                        | 1 hour                                                      | `NOT_RUN` until PITR exercise measures it                              |
| Backup retention           | 30 days, subject to Neon plan verification                  | `OWNER_ACTION_REQUIRED`                                                |
| Critical alert ack         | 15 minutes during staffed hours                             | `OWNER_ACTION_REQUIRED`                                                |
| High alert ack             | 30 minutes during staffed hours                             | `OWNER_ACTION_REQUIRED`                                                |
| Release approval           | One independent approver                                    | `OWNER_ACTION_REQUIRED`                                                |
| Production flag changes    | Recorded release decision required                          | Process documented; evidence `OWNER_ACTION_REQUIRED`                   |
| Serious defect handling    | Suspend affected workflow                                   | Policy `VERIFIED` (this charter); exercises `NOT_RUN`                  |
| Emergency boundary         | Not an emergency service                                    | Policy `VERIFIED` (this charter)                                       |
| Rate limiting              | Distributed service required before sensitive pilot enables | `BLOCKED` — no approved store ([RATE_LIMITING.md](./RATE_LIMITING.md)) |
| Rate-limit failure mode    | Fail closed for sensitive mutations                         | Policy; implementation pending store                                   |
| General public degradation | Read-only or unavailable-safe mode                          | `OWNER_ACTION_REQUIRED`                                                |
| Provider selection         | Human decision only                                         | Policy `VERIFIED` (this charter)                                       |
| Participant communications | Human-approved templates only                               | Policy `VERIFIED` (this charter)                                       |

## Responsibility matrix (Decision 3)

Do **not** invent names. Separation required: implementer ≠ final release approver.

| Role                                           | Name | Contact | Deputy | Availability | Acknowledgement | Approval date | Status                  |
| ---------------------------------------------- | ---- | ------- | ------ | ------------ | --------------- | ------------- | ----------------------- |
| Pilot and release owner                        |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |
| Technical incident owner                       |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |
| Privacy and safeguarding owner                 |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |
| Independent accessibility and release reviewer |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |
| Database recovery operator                     |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |
| Provider operations contact                    |      |         |        |              |                 |               | `OWNER_ACTION_REQUIRED` |

## Release order (Decision 4 — recommend only; agents do not merge)

1. **#388** — owner Preview flag-on CSP evidence + independent security review → merge first → production CSP **report-only**
2. **#389** — rebase after #388 human-merge → combined CSP/panel testing → manual a11y/privacy → reversible AccessiBe cut-over → panel flag false until approved
3. **#382** — staging migration recon + PITR/restore + human walkthrough → merge with AT Continuity **disabled**
4. **Geoscape** — separate from pilot readiness; after licensing/privacy: merge #367 then retarget/rebase #384; depth ≤3; **no fifth PR**

## Release gates (must be evidence-backed)

| Gate                                              | Status                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Canonical HTTPS Production env                    | `OWNER_ACTION_REQUIRED`                                                |
| Apex health live/ready deployed                   | `OWNER_ACTION_REQUIRED` (repo routes exist; apex 404 as of 2026-07-21) |
| Branch protection + independent approval          | `OWNER_ACTION_REQUIRED`                                                |
| Distributed rate limiting for sensitive mutations | `BLOCKED`                                                              |
| Monitoring/alerts configured                      | `OWNER_ACTION_REQUIRED`                                                |
| Backup/PITR + restore exercise (measured RTO/RPO) | `NOT_RUN`                                                              |
| Human release session (AT + golden journeys)      | `NOT_RUN`                                                              |
| Named roles in responsibility matrix              | `OWNER_ACTION_REQUIRED`                                                |
| Production CSP enforce remains hard-off           | `VERIFIED` (code gate)                                                 |
| High-risk flags default false                     | `VERIFIED` (repository defaults)                                       |

## Release stop conditions

Mandatory blockers (documentation alone cannot waive; critical safety/privacy/isolation defects are **not waivable**):

- Serious or critical accessibility failure
- Cross-participant or cross-provider data exposure
- Consent bypass or inability to revoke consent
- Authentication or authorisation bypass
- Unsafe audit logging
- Safeguarding workflow acting autonomously
- Unapproved external notification
- Failed migration reconciliation
- Failed restore/PITR exercise
- Missing independent approval
- Missing incident owner
- Missing monitoring for a pilot-critical service
- Sensitive endpoints using only process-local rate limiting
- Production URLs failing the HTTPS gate
- Health endpoints unavailable on the pilot apex
- Unsupported availability, clinical, emergency, NDIS registration, or WCAG claims

Any non-critical exception requires: named owner, rationale, duration, compensating control, and independent approval.

## Rollback authority

| Authority                       | Who                                                                     | Status                          |
| ------------------------------- | ----------------------------------------------------------------------- | ------------------------------- |
| Disable capability flags        | Technical incident owner + pilot owner                                  | `OWNER_ACTION_REQUIRED` (named) |
| Revert Vercel production deploy | Deploy authority (see [SERVICE_OPERATIONS.md](./SERVICE_OPERATIONS.md)) | `OWNER_ACTION_REQUIRED`         |
| Suspend pilot / workflow        | Pilot owner or privacy/safeguarding owner                               | `OWNER_ACTION_REQUIRED`         |

Preserve audit rows. Do not delete evidence during rollback.

## Exit criteria

Pilot may exit (graduate, pause, or stop) only when the pilot owner records one of:

- Planned four-week end with evidence pack archived; **or**
- Stop condition triggered; **or**
- Owner decision to pause with compensating controls documented.

Graduation to broader service is **out of scope** of this charter and remains **NO-GO** without new evidence.

## Evidence-status summary

| Area                                              | Status                                  |
| ------------------------------------------------- | --------------------------------------- |
| Charter adopted in repository                     | `VERIFIED` (this file on #388)          |
| Owner role assignments                            | `OWNER_ACTION_REQUIRED`                 |
| Human release session                             | `NOT_RUN`                               |
| Real-participant enable                           | `BLOCKED` / **NO-GO** until gates clear |
| Broad NDIS / claims / payments / prod CSP enforce | **NO-GO**                               |

## Cross-links (do not duplicate policy)

- Owner release pack: [../remediation/OWNER_ACTION_REQUIRED_OPS.md](../remediation/OWNER_ACTION_REQUIRED_OPS.md)
- Golden journeys: [CONTROLLED_PILOT_GOLDEN_JOURNEYS.md](./CONTROLLED_PILOT_GOLDEN_JOURNEYS.md)
- Release session: [CONTROLLED_PILOT_RELEASE_SESSION.md](./CONTROLLED_PILOT_RELEASE_SESSION.md)
- Service ops / alerts: [SERVICE_OPERATIONS.md](./SERVICE_OPERATIONS.md)
- Rate limiting: [RATE_LIMITING.md](./RATE_LIMITING.md)
- Evidence ledger: [../remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md](../remediation/PRODUCTION_READINESS_EVIDENCE_LEDGER.md)
- CSP: [../remediation/CSP_ENFORCEMENT.md](../remediation/CSP_ENFORCEMENT.md)
- Geoscape: [../remediation/GEOSCAPE_TRAIN_RETARGET.md](../remediation/GEOSCAPE_TRAIN_RETARGET.md)
