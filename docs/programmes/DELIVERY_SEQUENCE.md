# Delivery sequence — connected programmes

## Order

0 → **11 (blocked until Prompt 0 gates pass)** → 1 → 10 → 2–9 → 12

## Prerequisite status (reconciled)

| Dependency                               | Status                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------- |
| Prompt 0 shared foundation               | **this reconciliation PR**                                                                    |
| `CareOSMission` (#252)                   | closed/unmerged — adapter-backed                                                              |
| `AccessPassport` (#273)                  | closed/unmerged — adapter-backed                                                              |
| Platform Assurance registry (#278)       | open, not mergeable — deferred adapter                                                        |
| AURA Waves 4–5 (#272)                    | merged historically; full `lib/aura/` still absent on main — use AI-platform + companion stop |
| AccessPlace / ConsentRecord / AuditEvent | available on main                                                                             |

## Prompt 11 readiness gate

Prompt 11 may begin only when **all** are true:

1. Mergeable Prompt 0 reconciliation branch
2. Green required CI
3. Reviewed schema
4. Resolved source-registry ownership (documented)
5. Current AURA/AI-platform boundary tests passing
6. No duplicate mission / passport / place / consent / audit SoT

Until then: **Prompt 11 must not start.**
