# Accessibility widget decision — AccessiBe vs first-party panel

**Status:** `OWNER_ACTION_REQUIRED` for production cut-over  
**Extract PR:** focused remediation from stale #371/#372 (this branch)  
**Related:** #388 runtime hardening (CSP / third-party script inventory)

## Decision record

| Option                                | Production default today                                           | Notes                                                                                        |
| ------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| AccessiBe overlay (`AccessiBeWidget`) | **ON** when first-party flag is off                                | Third-party script from `acsbapp.com`; conflicts with strict CSP nonce enforce               |
| MapAble Accessibility Panel           | **OFF** (`NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL` unset/false) | First-party presentation preferences; localStorage private by default; optional account sync |

## Flag contract

| Variable                                     | Default       | Effect when `true`                                                             |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_MAPABLE_FIRST_PARTY_A11Y_PANEL` | unset / false | Mounts `AccessibilityPreferencesProvider` + panel; **does not** load AccessiBe |

Accessibility CI sets the flag to `true` so Playwright covers the panel path. Production must not flip this without:

1. Explicit product + accessibility lead approval
2. Accessibility statement / user communication about AccessiBe removal
3. Manual AT matrix still recorded (NVDA, VoiceOver, TalkBack, keyboard, zoom, high-contrast, reduced-motion) — currently `NOT_RUN`
4. CSP preview evidence if AccessiBe hosts are removed from allowlists (#388)

## Out of scope for this extract

- Marketing redesign / logo churn from #371/#372
- Access Independence MVP (#372) tenant/consent expansion
- Claiming WCAG 2.2 AA conformance
- Enabling the flag in production

## Recommended cut-over sequence (human)

1. Merge this focused extract with flag **default false**
2. Preview with flag on; complete manual AT checklist in `docs/qa/public-ui-accessibility-remediation.md`
3. Decide AccessiBe retire date; update accessibility statement
4. Set flag on preview → staging → production only after approval
