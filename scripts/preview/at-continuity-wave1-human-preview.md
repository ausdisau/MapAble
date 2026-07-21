# AT Continuity Wave 1 — human preview checklist

**PR:** #382  
**Flag:** `MAPABLE_AT_CONTINUITY_ENABLED` must remain **`false`** in preview unless explicitly testing writers with synthetic data.  
**Do not use real participant information.**

## Pass / fail fields

| Field | Value |
| ----- | ----- |
| Preview URL | `OWNER_ACTION_REQUIRED` — prior deploy `dpl_H9xrsrEVyhLdm2aTWRJQ8a4aEFDr` SIGKILL OOM; retry after build-heap retune |
| Tester | Agent automated gates only; **human tester still required** |
| Date | 2026-07-20 (automated evidence); human date TBD |
| Environment | CI verified; preview URL pending redeploy |
| Flag state observed | Code/default `false` (`VERIFIED` via acceptance tests); live preview observation `NOT_RUN` |
| Overall result | **CONDITIONAL** — CI/Accessibility green; human preview `NOT_RUN` |

## Automated evidence already recorded (not a human substitute)

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| CI | pass | `actions/runs/29788354827` on tip `2933873d` |
| Accessibility | pass | `actions/runs/29788354798` (~10m28s) |
| Domain-ownership false positive | fixed | Comment no longer matches `ConsentRecord` scanner |
| Vitest acceptance journeys | covered in CI | flag-off refuse + synthetic path when enabled in tests |

## Expected evidence

| Step | Expected | Pass? | Notes |
| ---- | -------- | ----- | ----- |
| No public AT Continuity participant routes exposed | No new `/api/at-*` or marketing claim pages from this PR | `VERIFIED` (code search / CI) | Confirm again on preview URL |
| Flag default false | Writers refuse when unset / not `"true"` | `VERIFIED` (unit/acceptance) | Human: observe preview env |
| Synthetic journey (flag on in isolated session only) | asset → outage → backup → repair ref → care/transport/work deps → human-approved notification → audit ids | `VERIFIED` in CI tests | Human preview with synthetic data `NOT_RUN` |
| Notification without approval | Refused | `VERIFIED` (tests) | |
| Clinical / emergency copy | Refused | `VERIFIED` (tests) | |
| Audit metadata | Identifiers + safe enums only; no sensitive free text | `VERIFIED` (tests) | |

## Accessibility observations

| Observation | Result | Defect |
| ----------- | ------ | ------ |
| Keyboard reachability of any exposed admin/pilot UI (if present) | `NOT_RUN` | No public Wave 1 UI; N/A unless pilot UI added |
| Screen reader label clarity | `NOT_RUN` | |
| Error language plain and non-clinical | `VERIFIED` (copy tests) | Still confirm in preview |

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

## Remaining human actions

1. After Vercel redeploy succeeds, paste Preview URL above
2. Walk the synthetic journey with flag on only in an isolated preview session
3. Sign Overall result PASS/FAIL/STOP
