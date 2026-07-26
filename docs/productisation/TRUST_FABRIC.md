# Trust Fabric — Participant Access Receipts and Trust History

**Mode:** internal_alpha  
**Flags (default off):**
- `MAPABLE_TRUST_FABRIC_ENABLED`
- `MAPABLE_PARTICIPANT_ACCESS_HISTORY_ENABLED`

## Scope

- Purpose-bound access receipts (actor, participant, organisation, purpose, field categories, authority, expiry, correlation ID, outcome)
- Participant Access History page (`/dashboard/access-history`)
- Decision Notice contract for consequential deterministic decisions
- Break-glass hardening with after-action review when Trust Fabric is enabled
- Machine-readable portability export

## Non-goals

- No new consent source of truth (`ConsentRecord` remains canonical)
- No automatic authority
- No public publication
- No AI decision authority
- No RightsOS Decision Room / vault / capsules wholesale merge

## Canonical owners

| Concern | Owner |
|---------|--------|
| Access receipts | `lib/trust/fabric/receipt-service.ts` |
| Decision notices | `lib/trust/fabric/decision-notice.ts` |
| Hardened break-glass | `lib/trust/fabric/break-glass.ts` (+ process-local `lib/security/break-glass.ts`) |
| Consent | `lib/consent/consent-service.ts` |
| Communication Passport | `lib/support/communication-passport/service.ts` (hooks receipt on disclosure) |

## Public-claim state

`internal_alpha` — not a certified trust network. Feature flags are not production approval.

## Rollback

Set both flags to `false`. Receipts remain in the database for audit; UI/API return 503.

## Acceptance walkthrough

1. Enable both Trust Fabric flags locally.
2. Disclose a Communication Passport to a worker with purpose → receipt written.
3. As participant, open `/dashboard/access-history` → see actor, purpose, categories, time, authority state.
4. Challenge future use and/or revoke consent via Consent centre.
5. Export JSON bundle of passport subset + history + authority.
6. Admin break-glass without `fieldCategories` rejected when Trust Fabric on; with reason/fields creates receipt and requires after-action.
