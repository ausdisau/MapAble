# AT Continuity Wave 1 — human preview checklist

**PR:** #382  
**Flag:** `MAPABLE_AT_CONTINUITY_ENABLED` must remain **`false`** in preview unless explicitly testing writers with synthetic data.  
**Do not use real participant information.**

## Session metadata (`NOT_RUN` until human fills)

| Field               | Value                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Preview URL         | `https://mapableau-2x62z7uv9-mapableau.vercel.app` (READY tip `8c0f0db3`; later tips may supersede — paste live URL) |
| Preview SHA         |                                                                                                                      |
| Tester              |                                                                                                                      |
| Date                |                                                                                                                      |
| Browser / device    |                                                                                                                      |
| Role                |                                                                                                                      |
| Flag state observed |                                                                                                                      |
| Overall result      | PASS / FAIL / STOP / `NOT_RUN`                                                                                       |

## Automated evidence (not a human substitute)

| Gate                                            | Result                      | Evidence                                         |
| ----------------------------------------------- | --------------------------- | ------------------------------------------------ |
| Flag default false                              | `VERIFIED`                  | `tests/at-continuity/wave1-scaffold.test.ts`     |
| Acceptance journey (synthetic, flag on in unit) | `VERIFIED`                  | `tests/at-continuity/acceptance-journey.test.ts` |
| Unapproved notification refused                 | `VERIFIED`                  | unit                                             |
| Approver must match actor                       | `VERIFIED`                  | unit                                             |
| Cross-participant asset miss fails closed       | `VERIFIED`                  | unit                                             |
| Audit metadata without sensitive free text      | `VERIFIED`                  | unit                                             |
| Accessibility / migrate-from-zero / Security    | `VERIFIED` on repaired tips | GitHub Actions                                   |
| Vercel READY                                    | `VERIFIED` @ 6144 heap      | `dpl_5v31ZBri…`                                  |
| Human synthetic walkthrough                     | `NOT_RUN`                   | this form                                        |

## Expected human steps

| Step                                       | Expected                                                                                              | Pass? | Screenshot / evidence ref | Notes |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ----- | ------------------------- | ----- |
| No public AT Continuity participant routes | No new public `/api/at-*` writers                                                                     |       |                           |       |
| Flag default false in Preview env          | Writers refuse                                                                                        |       |                           |       |
| Synthetic journey (flag on, isolated only) | asset → outage → backup → repair → care/transport/work deps → human-approved notification → audit ids |       |                           |       |
| Notification without approval              | Refused                                                                                               |       |                           |       |
| Clinical / emergency copy                  | Refused                                                                                               |       |                           |       |
| Audit metadata                             | Identifiers + safe enums only                                                                         |       | AuditEvent id:            |       |

## Accessibility observations

| Observation                                   | Result          | Defect severity |
| --------------------------------------------- | --------------- | --------------- |
| Keyboard reachability of any exposed pilot UI | `NOT_RUN` / N/A |                 |
| Screen reader label clarity                   | `NOT_RUN`       |                 |
| Error language plain and non-clinical         | `NOT_RUN`       |                 |

## Stop conditions

- Real participant data → **STOP**
- Clinical suitability / emergency-response / NDIS registration claim → **STOP**
- Notification send without human approval → **STOP**
- Public route exposes AT Continuity writers → **STOP**

## Rollback

- Keep `MAPABLE_AT_CONTINUITY_ENABLED=false`
- Revert preview deploy / PR tip
- Non-prod only: revert migration `20260720120000_at_continuity_wave1` if schema must be removed
- Preserve audit rows

## Migration owner gate

Staging clone / PITR rehearsal: `docs/operations/STAGING_MIGRATION_REHEARSAL.md` — `OWNER_ACTION_REQUIRED` / `NOT_RUN`.
Merge remains blocked on owner evidence + this human form.
