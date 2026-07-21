# Accessibility widget decision (runtime hardening pointer)

**Full extract + flag contract:** PR **#389** (`cursor/accessibility-remediation-panel-42fc`)  
**Status:** production cut-over remains `OWNER_ACTION_REQUIRED`

## Decision for #388 CSP preview

| Choice                                                                                      | Implication for CSP enforce preview                                                                      |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Keep AccessiBe (default on `main` / this branch until #389 lands)                           | `acsbapp.com` hosts likely need allowlisting **or** disable AccessiBe in the CSP-enforce preview session |
| First-party MapAble Accessibility Panel (`NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL=true`) | Preferred path for nonce-friendly enforce; lands via #389 with flag default **false**                    |

Do **not** enable production CSP enforce or remove AccessiBe from production in this PR.

## Recording

Use `scripts/preview/csp-enforce-preview-smoke.md` to record which widget mode was
active during flag-on preview evidence (`NOT_RUN` until performed).
