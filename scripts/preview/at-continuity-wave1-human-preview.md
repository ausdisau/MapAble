# AT Continuity Wave 1 — human preview checklist

**PR:** #382  
**Flag:** `MAPABLE_AT_CONTINUITY_ENABLED` must remain **`false`** in preview unless explicitly testing writers with synthetic data.  
**Do not use real participant information.**

## Pass / fail fields

| Field | Value |
| ----- | ----- |
| Preview URL | |
| Tester | |
| Date | |
| Environment | preview / local |
| Flag state observed | |
| Overall result | PASS / FAIL / STOP |

## Expected evidence

| Step | Expected | Pass? | Notes |
| ---- | -------- | ----- | ----- |
| No public AT Continuity participant routes exposed | No new `/api/at-*` or marketing claim pages from this PR | | |
| Flag default false | Writers refuse when unset / not `"true"` | | |
| Synthetic journey (flag on in isolated session only) | asset → outage → backup → repair ref → care/transport/work deps → human-approved notification → audit ids | | |
| Notification without approval | Refused | | |
| Clinical / emergency copy | Refused | | |
| Audit metadata | Identifiers + safe enums only; no sensitive free text | | |

## Accessibility observations

| Observation | Result | Defect |
| ----------- | ------ | ------ |
| Keyboard reachability of any exposed admin/pilot UI (if present) | | |
| Screen reader label clarity | | |
| Error language plain and non-clinical | | |

## Stop conditions

- Real participant data appears → **STOP**
- Clinical suitability / emergency-response / NDIS registration claim → **STOP**
- Notification send without human approval → **STOP**
- Public route accidentally exposes AT Continuity writers → **STOP**

## Rollback conditions

- Keep `MAPABLE_AT_CONTINUITY_ENABLED=false`
- Revert preview deploy / PR tip
- On non-prod only: revert migration `20260720120000_at_continuity_wave1` if schema must be removed
- Preserve audit rows; do not delete evidence
