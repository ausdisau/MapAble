# Platform provider patterns (internal)

Rights-safe marketplace patterns for MapAble: trust-first onboarding, draft-only AI, participant confirmation, and admin supervision.

## Feature flags

See `lib/config/platform-patterns.ts` and environment variables such as `ONBOARDING_GATE_ENABLED`, `JOURNEY_PERSISTENCE_ENABLED`, `AGENT_RUN_PERSISTENCE_ENABLED`.

## Modules

| Area | Path |
|------|------|
| Onboarding | `lib/onboarding/` |
| Intake / categories | `lib/care/intake-service.ts`, `lib/care/support-category-classifier.ts` |
| Journey graph | `lib/journey/journey-service.ts` |
| Matching MVP | `lib/matching/matching-service.ts` |
| Booking graph | `lib/bookings/graph/` |
| Consent sharing | `lib/consent/require-consent.ts`, `components/consent/ConsentSharingPanel.tsx` |
| Transparent billing | `lib/billing/core/transparent-billing.ts` |
| Trust & safety | `lib/trust/safety/queue-service.ts` |
| Agent runs | `lib/ai/agent-ops/agent-run-service.ts` |
| Reliability (advisory) | `lib/reliability/reliability-service.ts` |

## Rules

- No auto-assign, auto-send invoices, or NDIS eligibility automation.
- High-risk agent runs block downstream actions until reviewed.
- Reliability metrics are advisory only.
