# Implementation foundation — Prompt 0 (reconciled)

## Authority split

1. **Participant** — primary decision-maker
2. **ParticipantAuthorityGrant** + `ConsentRecord` — explicit scoped authority
3. **AI / AURA proposals** — explain/search/draft only (AI-platform ceilings)
4. **Deterministic services** — only path for consequential outcomes

Models never become decision-makers. Flags never grant authority or production claims.

## Shared modules

| Module                         | Path                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| Flags                          | `lib/config/programme-flags.ts`                                |
| Invariants                     | `lib/programmes/safety-invariants.ts`                          |
| Audit (→ AuditEvent)           | `lib/programmes/audit.ts`                                      |
| Source registry                | `lib/programmes/source-registry/`                              |
| Authority                      | `lib/programmes/authority/`                                    |
| Navigator                      | `lib/programmes/navigator/`                                    |
| Trust ledger                   | `lib/programmes/trust-ledger/`                                 |
| Mission adapter (interim Case) | `lib/programmes/adapters/case-mission-adapter.ts`              |
| Place adapter                  | `lib/programmes/adapters/access-place-adapter.ts`              |
| Passport adapter               | `lib/programmes/adapters/access-passport-adapter.ts`           |
| Platform Assurance bridge      | `lib/programmes/adapters/platform-assurance-source-adapter.ts` |
| AURA/AI execution gate         | `lib/programmes/aura/execution-gate.ts`                        |

## Feature flags

Twelve `MAPABLE_*_ENABLED` flags — server-side only, default **false**.  
No `NEXT_PUBLIC_` equivalents. Disabled programmes refuse writes.  
Synthetic adapters must remain labelled (`isMock: true`).

## Safety invariants (summary)

Participant primacy; explicit authority; no diagnosis/capacity inference; unknown stays unknown; no eligibility/funding/payment/safeguarding decisions by models; specific disclosure; memory/credential ≠ consent; recommendation ≠ determination; chat not only pathway; essential access not subscription-gated; paid placement does not change trust; complaints escalation available; audit correlation required; feature flag required.

## Testing expectations

See `tests/programmes/` — foundation suite plus current-main compatibility (place, passport adapter, AURA gate, source ownership, isolation).
