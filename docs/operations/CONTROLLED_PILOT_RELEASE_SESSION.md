# Controlled-pilot release session (ordered)

**Canonical boundary:** [CONTROLLED_PILOT_CHARTER.md](./CONTROLLED_PILOT_CHARTER.md)  
**Purpose:** Single human session covering manual accessibility + golden journeys with **synthetic data only**.  
**Status:** entire session `NOT_RUN` until a named tester records outcomes.  
**Rule:** Automated CI does not substitute for this session. Do not claim WCAG conformance.

## Session metadata

| Field                | Value                          |
| -------------------- | ------------------------------ |
| Tester               |                                |
| Date / time          |                                |
| Commit SHA           |                                |
| Deployment ID        |                                |
| URL                  |                                |
| Device               |                                |
| OS                   |                                |
| Browser              |                                |
| Assistive technology |                                |
| Role                 |                                |
| Synthetic account    |                                |
| Overall              | PASS / FAIL / STOP / `NOT_RUN` |

## Part A — Manual accessibility matrix (ordered)

| Order | Method                                                  | Device / OS / Browser        | Result | Defect severity | Evidence ref | Status                       |
| ----- | ------------------------------------------------------- | ---------------------------- | ------ | --------------- | ------------ | ---------------------------- |
| 1     | Keyboard only                                           |                              |        |                 |              | `NOT_RUN`                    |
| 2     | NVDA                                                    | Windows + browser recorded   |        |                 |              | `NOT_RUN`                    |
| 3     | VoiceOver                                               | macOS/iOS + browser recorded |        |                 |              | `NOT_RUN`                    |
| 4     | TalkBack                                                | Android + browser recorded   |        |                 |              | `NOT_RUN`                    |
| 5     | 200% zoom                                               |                              |        |                 |              | `NOT_RUN`                    |
| 6     | 400% reflow                                             |                              |        |                 |              | `NOT_RUN`                    |
| 7     | Windows High Contrast                                   |                              |        |                 |              | `NOT_RUN`                    |
| 8     | Prefers reduced motion                                  |                              |        |                 |              | `NOT_RUN`                    |
| 9     | Mobile portrait                                         |                              |        |                 |              | `NOT_RUN`                    |
| 10    | Mobile landscape                                        |                              |        |                 |              | `NOT_RUN`                    |
| 11    | Switch or voice-control (if qualified tester available) |                              |        |                 |              | `NOT_RUN` / `NOT_APPLICABLE` |

Cross-check: [../accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md](../accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md).

## Part B — Golden journeys (synthetic data only)

For **each** journey record: prerequisites, steps, expected, actual, evidence reference, accessibility observation, audit-event reference, defect severity, pass/fail, rollback, stop condition.

| ID  | Journey                                       | Status                                     |
| --- | --------------------------------------------- | ------------------------------------------ |
| G1  | Registration / authentication                 | `NOT_RUN`                                  |
| G2  | Accessibility preferences                     | `NOT_RUN`                                  |
| G3  | Consent grant / narrow / expire / revoke      | `NOT_RUN`                                  |
| G4  | Provider discovery (no paid ranking)          | `NOT_RUN`                                  |
| G5  | Manually reviewed Care request                | `NOT_RUN`                                  |
| G6  | Transport request (no availability guarantee) | `NOT_RUN`                                  |
| G7  | Confirmation / cancellation                   | `NOT_RUN`                                  |
| G8  | Incident escalation (human only)              | `NOT_RUN`                                  |
| G9  | Audit history                                 | `NOT_RUN`                                  |
| G10 | AT Continuity                                 | `BLOCKED` until #382 gates; else `NOT_RUN` |

Detail register: [CONTROLLED_PILOT_GOLDEN_JOURNEYS.md](./CONTROLLED_PILOT_GOLDEN_JOURNEYS.md).

## Stop conditions

Follow the charter release stop conditions. Critical safety/privacy/isolation defects are **not waivable**.

## Rollback

Disable capability flags; revert preview deploy; preserve audit rows; update ledger honestly (`FAILED` / `NOT_RUN` — never invent pass).
