# First-party Accessibility Panel — owner preview checklist (#389)

**Flag:** `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL`  
**Production default:** unset / false (AccessiBe remains)  
**Do not claim WCAG conformance from this checklist.**

## Session metadata (`NOT_RUN` until filled)

| Field            | Value                          |
| ---------------- | ------------------------------ |
| Preview URL      |                                |
| Preview SHA      |                                |
| Tester           |                                |
| Date             |                                |
| Browser / device |                                |
| Flag observed    | off / on                       |
| Overall          | PASS / FAIL / STOP / `NOT_RUN` |

## Flag behaviour

| Check                                                                     | Result    |
| ------------------------------------------------------------------------- | --------- |
| Flag off: AccessiBe script may load; no panel trigger required            | `NOT_RUN` |
| Flag on: exactly one first-party panel instance; AccessiBe **not** loaded | `NOT_RUN` |
| Both never run simultaneously                                             | `NOT_RUN` |
| No conformance / NDIS registration claim in UI copy                       | `NOT_RUN` |

## Privacy

| Check                                                                          | Result    |
| ------------------------------------------------------------------------------ | --------- |
| Preferences stored locally by default (`mapable:accessibility-ui:v1`)          | `NOT_RUN` |
| No disability inference / AT detection                                         | `NOT_RUN` |
| No analytics of preference values                                              | `NOT_RUN` |
| Account sync only when signed-in user opts in; allowlisted digital fields only | `NOT_RUN` |
| Reset clears local settings; sync revocable                                    | `NOT_RUN` |
| Preferences do not affect matching, price, eligibility, or ranking             | `NOT_RUN` |

## Accessibility behaviour (automated ≠ conformance)

| Check                                            | Result    |
| ------------------------------------------------ | --------- |
| Keyboard open / close / Escape                   | `NOT_RUN` |
| Focus trap + restore to trigger                  | `NOT_RUN` |
| Visible focus                                    | `NOT_RUN` |
| Name / role / state for SR                       | `NOT_RUN` |
| Mobile full-screen usable                        | `NOT_RUN` |
| 200% / 400% zoom / reflow                        | `NOT_RUN` |
| High contrast / forced colours                   | `NOT_RUN` |
| Reduced motion                                   | `NOT_RUN` |
| Text size / spacing / contrast / pointer targets | `NOT_RUN` |
| Reset works                                      | `NOT_RUN` |
| Does not disable keyboard or SR fundamentals     | `NOT_RUN` |

## Combined with #388 CSP enforce (Preview only)

Requires Preview env: `MAPABLE_CSP_ENFORCE_PREVIEW=true` **and** `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true`.

| Check                                               | Result    |
| --------------------------------------------------- | --------- |
| No `acsbapp.com` network request                    | `NOT_RUN` |
| No CSP violation caused by the panel                | `NOT_RUN` |
| Preferences persist; hydration stable               | `NOT_RUN` |
| Core content usable without the panel JS (degraded) | `NOT_RUN` |

## Stop conditions

- Preference sync writes non-allowlisted profile fields → **STOP**
- Analytics of accessibility settings → **STOP**
- Both AccessiBe and first-party panel active → **STOP**
- Claiming WCAG / NDIS registration from this PR → **STOP**

## Rollback

1. Unset / set false `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL`
2. Redeploy Preview / production
3. AccessiBe remains the default path until an explicit cut-over approval
