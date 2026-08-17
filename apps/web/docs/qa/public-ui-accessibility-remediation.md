# Public UI accessibility remediation — manual test checklist

Automated axe/Playwright coverage supports regression detection. **It does not constitute WCAG 2.2 AA conformance.** Manual testing (including disabled participants) remains required before any conformance claim.

Do not mark items passed unless they were actually performed in this environment.

| Area                                                                       | Status  | Notes |
| -------------------------------------------------------------------------- | ------- | ----- |
| Keyboard-only walkthrough (skip → nav → hero → filters → place card → map) | Not run |       |
| NVDA with Firefox or Chrome                                                | Not run |       |
| VoiceOver with Safari                                                      | Not run |       |
| 200% browser zoom                                                          | Not run |       |
| 400% browser zoom / reflow                                                 | Not run |       |
| Windows High Contrast / forced colours                                     | Not run |       |
| Reduced motion (`prefers-reduced-motion`)                                  | Not run |       |
| Mobile screen reader (TalkBack / VoiceOver iOS)                            | Not run |       |
| Switch-control style sequential navigation                                 | Not run |       |
| Voice-control visible-label matching                                       | Not run |       |
| Map list alternative (results without coordinates)                         | Not run |       |
| Cognitive load / plain-language review                                     | Not run |       |
| Participant testing with compensated disabled users                        | Not run |       |

## MapAble Accessibility Panel

| Check                                                                  | Status      | Notes                                                 |
| ---------------------------------------------------------------------- | ----------- | ----------------------------------------------------- |
| Panel opens from header/footer triggers (not a floating map overlay)   | Automated   | `tests/a11y/accessibility-panel.spec.ts`              |
| Escape / close restore focus to trigger                                | Automated   |                                                       |
| Presets + individual controls + reset                                  | Automated   | unit + component + Playwright                         |
| Local storage private by default; no analytics of preference values    | Code review | storage key `mapable:accessibility-ui:v1`             |
| Optional account sync does not overwrite mobility/sensory/share fields | Automated   | `tests/accessibility/digital-preferences-api.test.ts` |
| Panel with every contrast theme / 200% text / 320px reflow             | Automated   | axe-assisted; not a conformance claim                 |
| Keyboard + screen-reader walkthrough with each preset                  | Not run     | Manual AT testing still required                      |
| Forced colours with panel open/closed                                  | Not run     |                                                       |
| Maps remain usable with large cursor / text scale                      | Not run     |                                                       |

Panel behaviour to communicate to users:

- Personalises presentation only; core accessibility is always on.
- Does not guarantee WCAG conformance.
- OS/browser preferences remain respected.
- Reset clears local settings; account sync is opt-in and revocable.

## Known limitations and unresolved risks

- Production default keeps AccessiBe until `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true` is explicitly approved (see `docs/remediation/ACCESSIBILITY_WIDGET_DECISION.md`).
- When the first-party flag is on, AccessiBe is not loaded; communicate overlay removal via the accessibility statement / feedback and point users to Accessibility settings.
- First-party semantics, focus management, and the MapAble Accessibility Panel are the intended remediation path after cut-over.
- Leaflet map markers remain a hybrid DOM/canvas interaction model; list view is the guaranteed alternative.
- Authenticated dashboard shells are skipped in CI without seeded storage state (`A11Y_SKIP_AUTH_ROUTES=1`).
- Social profile icons render only when verified `NEXT_PUBLIC_*_URL` env vars are set.
- NDIS registration wording remains “To be confirmed” until organisation registration is verified — do not invent a number.
- Formal WCAG audit and participant testing are still outstanding.

## Brand asset follow-up

A reviewed horizontal logo asset is preferred for marketing headers. Current committed artwork is retained with accessible naming and fixed dimensions to avoid layout shift.
