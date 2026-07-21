# Accessibility manual evidence matrix

**Do not claim WCAG conformance.**  
Automated Playwright/axe coverage is necessary but not sufficient.  
**Status:** all manual rows `NOT_RUN` until a human tester records evidence.

## Automated coverage (repository)

| Check                      | Evidence                                                    | Status                                                                                       |
| -------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Playwright + axe smoke     | Accessibility workflow                                      | `VERIFIED` on `main` post-#380; #382 repaired tips SUCCESS (heap retune) — re-check each tip |
| Authenticated pilot routes | Seeded storage-state; `A11Y_SKIP_AUTH_ROUTES=0` in workflow | Must not be silently skipped                                                                 |

## Manual matrix

| ID  | Method                                    | Tester | Device | Browser | Date | Journey | Result | Defect IDs | Evidence link | Status    |
| --- | ----------------------------------------- | ------ | ------ | ------- | ---- | ------- | ------ | ---------- | ------------- | --------- |
| M1  | Keyboard-only                             |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M2  | NVDA + Chrome                             |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M3  | NVDA + Firefox                            |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M4  | VoiceOver + Safari                        |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M5  | TalkBack + Chrome                         |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M6  | 200% zoom / reflow                        |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M7  | 400% zoom / reflow                        |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M8  | Windows High Contrast                     |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M9  | Prefers reduced motion                    |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M10 | Screen magnification                      |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M11 | Switch / voice navigation consideration   |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |
| M12 | Cognitive clarity / plain-language errors |        |        |         |      | G1–G9   |        |            |               | `NOT_RUN` |

## Release rule

Serious or critical failures on protected pilot journeys are **release blockers**. Do not mark manual checks passed without human evidence.
