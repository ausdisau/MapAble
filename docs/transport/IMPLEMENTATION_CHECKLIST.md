# MapAble Transport — Implementation Checklist

Governing docs: [PRODUCT_REQUIREMENTS.md](./PRODUCT_REQUIREMENTS.md), [CURRENT_STATE_AUDIT.md](./CURRENT_STATE_AUDIT.md), [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md), [`.cursor/rules/mapable-transport.mdc`](../../.cursor/rules/mapable-transport.mdc).

**Verification default after each implementation prompt:** `pnpm type-check` && `pnpm build` (plus relevant `pnpm test -- …`).

**Status values:** `[ ]` pending · `[~]` in progress · `[x]` complete · `[D]` deferred · `[B]` blocked · `[O]` out of scope

---

## Prompt 0 — Ledger and Cursor rule

- [x] Create `.cursor/rules/mapable-transport.mdc` and `docs/transport/*` (this ledger)
- Depends on: none
- Touch paths: `.cursor/rules/`, `docs/transport/`
- Acceptance: five artefacts agree; no runtime changes

---

## Production MVP path

### Prompt 1 — Routes and application shell

- [x] Goal: Preserve public `/transport`; add pack route aliases and role-aware shells without fake data
- Depends on: Prompt 0
- Touch paths: `app/transport/**`, `app/dashboard/transport/**`, `components/transport/*`, `lib/transport/feature-status.ts`, `lib/transport/transport-ui-access.ts`
- Acceptance: anonymous `/transport`; auth for request/profile/dashboard/trips; unauthorised operator/driver get accessible denial; aliases work; no hard-coded fare/ETA/funding; type-check + build
- Done: 2026-07-17 — pack paths + `TransportFeatureStatus` local config; canonical list/detail remain under `/dashboard/transport`

### Prompt 2 — Domain model and Prisma migration

- [ ] Goal: Add missing transport tables (profiles, quotes, consents, pricing rules, protected locations, operator members, etc.) without breaking Care/`Booking`
- Depends on: Prompt 0 (ADR-2)
- Touch paths: `prisma/schema.prisma`, `prisma/migrations/`, `types/transport*.ts`, seed factories
- Acceptance: migrate empty + existing dev DB; Care still compiles; shared Zod/DTOs; no exact address in general event payloads; type-check + build + `npx prisma migrate`

### Prompt 3 — State machine, eligibility, audit

- [ ] Goal: Deterministic transitions, eligibility, audit ledger before new UI
- Depends on: Prompt 2
- Touch paths: `lib/transport/transport-status-service.ts`, eligibility/assignment/event/audit modules, `lib/platform/av-framework/trip-transitions`, `tests/**`
- Acceptance: full transition/eligibility tests; no route UI required; type-check + build

### Prompt 4 — Authorisation, consent, location privacy

- [ ] Goal: Role-aware serializers; consent; location crypto/protection
- Depends on: Prompts 2–3
- Touch paths: `lib/transport/transport-access-policy.ts`, privacy/crypto modules, consent APIs, tests
- Acceptance: cannot obtain exact address by ID guessing; pre-assignment masked; driver access expires; exact-location audit; type-check + build

### Prompt 5 — Typed transport API module

- [ ] Goal: Reconcile/extend App Router APIs; stop new UI posting sole transport domain to generic `/api/bookings`
- Depends on: Prompts 2–4
- Touch paths: `app/api/transport/**`, `app/api/provider/transport/**`, `app/api/driver/transport/**`, services, integration tests
- Acceptance: shared request/response types; dashboard endpoint; ownership/idempotency/forbidden transitions tested; type-check + build

### Prompt 6 — Routing, provider, access-fit, quote adapters

- [ ] Goal: Honest adapter layer; sandbox fixtures; fail closed when misconfigured
- Depends on: Prompts 2, 5
- Touch paths: `lib/transport/routing/**`, quote/access-fit services, env validation, tests
- Acceptance: deterministic sandbox quotes/estimates; production fails closed; fit reasons; type-check + build

### Prompt 7 — Participant Transport Access Profile

- [ ] Goal: `/transport/profile` create/edit/consent against real API
- Depends on: Prompts 2, 4, 5
- Touch paths: `app/transport/profile/**` or dashboard equivalent, `components/transport/*`, mobility schema
- Acceptance: save/reload; required vs preferred; a11y; type-check + build

### Prompt 8 — Trip request and quote flow

- [ ] Goal: Production wizard at `/transport/request`; remove prototype shortcuts
- Depends on: Prompts 5–7
- Touch paths: `NewTransportTripForm.tsx` (refactor), request pages, quote UI
- Acceptance: request → sandbox quotes → accept → trip detail; draft recovery; no hard-coded fares/funding badges; type-check + build

### Prompt 9 — Participant dashboard and trip detail

- [ ] Goal: Truthful dashboard + role-aware trip detail
- Depends on: Prompts 5, 8
- Touch paths: `app/dashboard/transport/**`, list/detail components
- Acceptance: forbidden cross-participant access; empty/loading/error states; type-check + build

### Prompt 10 — Operator dispatch and fleet

- [ ] Goal: Quote, assign, dispatch, fleet eligibility workspace
- Depends on: Prompts 3–6, 5
- Touch paths: `app/provider/(console)/transport/**`, dispatch/fleet components
- Acceptance: ineligible assignment blocked server-side; list without map; type-check + build

### Prompt 11 — Driver mobile field workspace

- [ ] Goal: Prestart, state events, location consent, offline queue
- Depends on: Prompts 3–5, 10
- Touch paths: `app/driver/**`, driver API routes, offline queue client
- Acceptance: sandbox trip assigned→complete; failed prestart blocks; offline replay once; type-check + build

### Prompt 12 — Real-time updates and notification fallbacks

- [ ] Goal: Authenticated role-filtered updates + polling fallback
- Depends on: Prompts 4, 5, 9–11
- Touch paths: existing realtime/session infra, transport hooks, notifications, webhooks redaction
- Acceptance: different safe payloads per role; reconnect resync; type-check + build

### Prompt 13 — Evidence, incidents, complaints, attestations

- [ ] Goal: Completion review, evidence, incidents, complaints, attestations
- Depends on: Prompts 5, 11–12
- Touch paths: evidence/safety services, incidents, complaint UI, attestations
- Acceptance: dispute/serious incident → billing hold; permissioned evidence; type-check + build

### Prompt 14 — Pricing, funding, invoicing, Stripe, Xero

- [ ] Goal: Versioned pricing rules; honest funding labels; invoice/export
- Depends on: Prompts 2, 6, 13
- Touch paths: pricing rules, billing-core adapters, admin pricing UI
- Acceptance: historical amount stable after new rule version; adapters disable safely; type-check + build

### Prompt 15 — Care + Transport bundling

- [ ] Goal: Explicit “Plan transport” from care; conflict workflows; calendar
- Depends on: Prompts 5, 8–9; care booking services
- Touch paths: care UI actions, orchestration config `lib/config/y2-orchestration.ts`, calendar
- Acceptance: no silent auto-book; no cross-module private leaks; type-check + build

### Prompt 18 — Accessibility, offline, security, privacy retention

- [ ] Goal: Hardening pass across transport surfaces
- Depends on: Prompts 7–15 (MVP UI/API present)
- Touch paths: all transport client/server; `docs/transport/SECURITY_AND_PRIVACY.md`
- Acceptance: no critical axe on core routes; retention documented; type-check + build

### Prompt 19 — Test pyramid, CI, pilot fixtures

- [ ] Goal: Reproducible unit/integration/e2e/a11y/security regression + seed
- Depends on: Prompts 3–15, 18
- Touch paths: `tests/**`, `.github/workflows/**`, prisma seed factories
- Acceptance: fresh clone migrate/seed/test; no live external calls; type-check + build + new test commands

### Prompt 20 — Release readiness and public truth sync

- [ ] Goal: End-to-end audit; sync public copy; close ledger
- Depends on: Prompts 1–15, 18–19, PC-0–PC-4 as applicable
- Touch paths: public `/transport`, release docs, `.env.example`, runbooks
- Acceptance: go/no-go per capability; public copy matches flags; type-check + build + release suite

---

## Phase two

### Prompt 16 — Public transit planning and alerts

- [ ] Goal: GTFS / GTFS-RT adapters; advisory itineraries; community reports behind flags
- Depends on: Prompts 6, 18 (MVP stable)
- Touch paths: transit adapters, feature flags, participant transit UI
- Acceptance: fixture sandbox; disabled = unavailable; type-check + build

### Prompt 17 — Reliability, fallback, coordinator, admin compliance

- [ ] Goal: Explainable reliability flags; fallback dispatch; coordinator + admin views
- Depends on: Prompts 10–13, 16 optional
- Touch paths: reliability services, coordinator UI, admin compliance
- Acceptance: no protected-attribute ranking; consent for coordinator; type-check + build

---

## Production claim sprint

### Prompt PC-0 — Production claim registry

- [ ] Goal: Machine-readable claims; public page reads server status
- Depends on: Prompt 0; ideally after Prompt 1 shell
- Touch paths: `shared`/`types` claims, capability service + routes, `TransportCapabilityStatus`, `docs/transport/PRODUCTION_CLAIMS.md`
- Keys: `driver_vehicle_verification`, `trip_status_evidence_review`, `routing_adapters`
- Acceptance: defaults not `production_ready`; no capability promoted by registry alone; type-check + build

### Prompt PC-1 — Driver/vehicle verification dispatch gate

- [ ] Goal: Fail-closed assignment/dispatch eligibility with immutable snapshots
- Depends on: Prompts 2–3, 5, 10, PC-0
- Touch paths: eligibility, assign/dispatch APIs, fleet UI, audits
- Claim gate: promote `driver_vehicle_verification` only when PC-1 criteria met
- Acceptance: impossible to dispatch ineligible assignment via API; type-check + build + tests

### Prompt PC-2 — Trip status, evidence, participant review

- [ ] Goal: Canonical event ledger through participant review
- Depends on: Prompts 3, 5, 9, 11–13, PC-0
- Touch paths: events, realtime, evidence, completion review
- Claim gate: `trip_status_evidence_review`
- Acceptance: one canonical state; dispute blocks settlement; type-check + build + tests

### Prompt PC-3 — Routing adapters advisory truthfulness

- [ ] Goal: Pluggable routing; advisory labels; fail closed
- Depends on: Prompts 6, PC-0
- Touch paths: routing registry, estimate APIs, UI advisory cards
- Claim gate: `routing_adapters` → partner_required / pilot / production_ready per evidence
- Acceptance: missing key ≠ fabricated data; estimates ≠ quotes; type-check + build + tests

### Prompt PC-4 — Production claim promotion review

- [ ] Goal: Documented go/pilot/partner/unavailable/no-go; sync public page
- Depends on: PC-0–PC-3, Prompt 19–20 evidence
- Touch paths: claim registry, `PRODUCTION_CLAIMS.md`, `RELEASE_READINESS.md`, landing copy
- Acceptance: public page matches registry; blockers named; no gate lowering for green status

---

## Recommended order (do not auto-chain agents)

1. Prompt 0 (done in this change set)
2. Prompt 1 (shell/aliases)
3. Prompt PC-0 (claim registry so landing stops diverging)
4. Prompt 2 → 3 → 4 → 5 → 6
5. Prompts 7 → 8 → 9 → 10 → 11
6. Prompts 12 → 13 → 14 → 15
7. Prompt 18 → 19
8. PC-1, PC-2, PC-3 as capabilities mature (can overlap with 10–13 and 6)
9. Prompt 20 + PC-4
10. Phase two: 16 → 17

---

## Ledger close (Prompt 20)

| Item | Status | Notes |
|------|--------|-------|
| Complete | | |
| Deferred | | |
| Blocked by partner/API | | |
| Blocked by policy/legal | | |
| Intentionally out of scope | | |

Do not hide unresolved work. Name blocker, safe fallback, owner role, and next action.
