# Controlled-pilot release session (ordered)

**Purpose:** Single human session covering manual accessibility + golden journeys.  
**Status:** entire session `NOT_RUN` until a named tester records outcomes.  
**Rule:** Automated CI does not substitute for this session. Do not claim WCAG conformance.

## Session metadata

| Field                 | Value                          |
| --------------------- | ------------------------------ |
| Tester                |                                |
| Date                  |                                |
| Preview / staging URL |                                |
| Commit SHA            |                                |
| Browser / AT          |                                |
| Overall               | PASS / FAIL / STOP / `NOT_RUN` |

## Part A — Assistive technology (ordered)

| Order | Method                  | Result | Defect severity | Evidence ref |
| ----- | ----------------------- | ------ | --------------- | ------------ |
| 1     | NVDA + Chrome           |        |                 |              |
| 2     | VoiceOver + Safari      |        |                 |              |
| 3     | TalkBack + Chrome       |        |                 |              |
| 4     | Keyboard only           |        |                 |              |
| 5     | 200% / 400% zoom reflow |        |                 |              |
| 6     | Windows High Contrast   |        |                 |              |
| 7     | Prefers reduced motion  |        |                 |              |

Cross-check: `docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md`.

## Part B — Golden journeys (synthetic data only)

Execute in order from `docs/operations/CONTROLLED_PILOT_GOLDEN_JOURNEYS.md`:

G1 registration/auth → G2 preferences → G3 consent → G4 provider discovery → G5 Care → G6 Transport → G7 cancel/confirm → G8 incident escalation → G9 audit history → G10 AT Continuity (only if #382 eligible; flag remains false unless explicit isolated enable).

## Stop conditions (release blockers)

- Real participant data
- Tenant / consent / safeguarding / audit integrity defect
- Serious accessibility defect on a protected journey
- Clinical suitability, emergency-response, NDIS registration, or WCAG conformance claim
- NDIA submit or automated payment/invoice approval path reachable

## Rollback

Disable capability flags; revert preview deploy; preserve audit rows; update evidence ledger honestly (`FAILED` / `NOT_RUN` — never invent pass).
