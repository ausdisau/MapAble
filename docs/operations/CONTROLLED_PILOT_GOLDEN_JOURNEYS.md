# Controlled-pilot golden journeys

**Slice:** invitation-only controlled pilot  
**Data rule:** synthetic test data only — never real participant information  
**Status:** all journeys `NOT_RUN` until humans execute and record pass/fail  
**Flags:** keep high-risk capabilities fail-closed

For each journey record: prerequisites, synthetic data, roles, tenant isolation, consent, accessibility observations, audit evidence, negative tests, rollback, pass/fail, stop conditions.

## Journey register

| ID | Journey | Prerequisites | Roles | Status |
| -- | ------- | ------------- | ----- | ------ |
| G1 | Registration and authentication | Pilot cohort allowlist; NextAuth configured in preview/staging | participant | `NOT_RUN` |
| G2 | Participant accessibility preferences | G1 | participant | `NOT_RUN` |
| G3 | Consent grant, narrowing, expiry, revocation | G1; ConsentRecord paths | participant, delegate | `NOT_RUN` |
| G4 | Provider discovery without paid-ranking influence | Provider finder; ranking flags false | participant | `NOT_RUN` |
| G5 | Care request with manual provider review | Care domain; human review required | participant, provider admin | `NOT_RUN` |
| G6 | Transport request with no mock-routing availability claim | Transport; mock provider must not claim live routing | participant | `NOT_RUN` |
| G7 | Participant confirmation and cancellation | G5 or G6 | participant | `NOT_RUN` |
| G8 | Incident escalation without autonomous safeguarding | Incidents; human pathway only | participant, worker, admin | `NOT_RUN` |
| G9 | Audit-history inspection | AuditEvent readable to authorised role | admin / participant as permitted | `NOT_RUN` |
| G10 | AT Continuity (equipment → outage → backup → repair ref → dependency links → human-approved notification → audit) | PR #382 eligible (CI green + flag still false unless explicit pilot enable) | participant, worker, admin | `NOT_RUN` / `BLOCKED` until #382 green |

## Shared stop conditions

- Any real participant data introduced → **stop**
- Any clinical suitability / emergency-response / NDIS registration claim surfaced → **stop**
- NDIA submit or auto payment approval path reachable → **stop**
- Tenant isolation failure → **stop** and open SEV
- Serious/critical accessibility defect on protected journey → **release blocker**

## Rollback

Disable capability flags; revert preview deploy; preserve audit rows; do not delete evidence.
