# MapAble Core — development phases

Consolidated reference for Phases 1–12 (formerly separate `README_MAPABLE_CORE_PHASE_*.md` files).

## Table of contents
- [Phase 1](#phase-1)
- [Phase 2](#phase-2)
- [Phase 3](#phase-3)
- [Phase 4](#phase-4)
- [Phase 5](#phase-5)
- [Phase 6](#phase-6)
- [Phase 7](#phase-7)
- [Phase 8](#phase-8)
- [Phase 9](#phase-9)
- [Phase 10](#phase-10)
- [Phase 12](#phase-12)

---

## Phase 1 {#phase-1}

Phase 1 delivers the platform spine: identity, roles, participant profiles, accessibility preferences, organisations, consent, notifications, audit events, and care/transport booking primitives.

## Run locally

```bash
pnpm install
cp .env.example .env   # set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

Sign in with seed users (password matches existing seed hash — same as `alice@example.com` in legacy seed):

- `participant@mapable.test` — participant dashboard
- `admin@mapable.test` — admin console

## Key routes

| Area | Routes |
|------|--------|
| Dashboard | `/dashboard`, `/dashboard/profile`, `/dashboard/accessibility`, `/dashboard/consent`, `/dashboard/bookings` |
| Admin | `/admin`, `/admin/participants`, `/admin/organisations`, `/admin/bookings`, `/admin/audit-events` |
| Provider | `/provider/onboarding` |

## Key models

`User`, `UserRoleAssignment`, `ParticipantProfile`, `AccessibilityProfile`, `Organisation`, `ConsentRecord`, `Notification`, `AuditEvent`, `Booking`, `BookingSegment`

## Environment variables

- `DATABASE_URL` — PostgreSQL
- `NEXTAUTH_SECRET` — session signing
- `NEXTAUTH_URL` — app URL (e.g. `http://localhost:3000`)
- `NDIS_ENCRYPTION_KEY` — optional; falls back to `NEXTAUTH_SECRET` for NDIS number encryption

## Limitations (Phase 1)

- No live transport tracking, payments, or NDIS API
- Email/SMS/push delivery stubbed (in-app notifications only)
- Manual provider verification
- Single primary role per user (multi-role table ready)

## Phase 2

Incident management, automated provider checks, Stripe/Xero, dispatch, marketplace, and mobile apps.

---

## Phase 2 {#phase-2}

Phase 2 adds the operational layer on top of Phase 1: secure messaging, support tickets, documents, funding sources, invoice drafts, billing preflight, Stripe/Xero placeholders, provider booking acceptance, booking timelines, and admin operations views.

## Run

```bash
pnpm install
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

## New routes

| Area | Routes |
|------|--------|
| Messages | `/dashboard/messages`, `/provider/messages`, `/admin/messages` |
| Support | `/dashboard/support`, `/admin/support`, `/provider/support` |
| Documents | `/dashboard/documents`, `/admin/documents`, `/provider/documents` |
| Funding | `/dashboard/funding` |
| Invoices | `/dashboard/invoices`, `/admin/invoices`, `/provider/invoices` |
| Provider bookings | `/provider/bookings` |
| Admin ops | `/admin/operations` |

## Environment

See `.env.example`. Stripe and Xero are disabled unless explicitly configured.

## Limitations

- Local document storage only (`.data/documents`)
- Stripe/Xero are placeholders, not production integrations
- No NDIS API, budget checks, or live dispatch
- Virus scanning status is `not_configured` only

## Phase 3

Care/transport module depth, worker profiles, vehicles, calendar, and cross-module orchestration.

---

## Phase 3 {#phase-3}

Phase 3 adds the first service-module layer: **Care**, **Transport**, **Inclusive Jobs**, **Unified Calendar**, **Provider capacity**, and **Cross-module orchestration**.

## What was built

- Care requests and care shifts with participant approval and invoice draft hooks
- Worker profiles, availability windows, and capacity blocks
- Transport booking details, vehicles, and drivers
- Jobs foundation and job applications with sensitive adjustment handling
- Unified calendar (list view default)
- Orchestration for linked transport and invoice lines
- Admin service operations dashboard

## Main routes

| Area | Participant | Provider | Employer | Admin |
|------|-------------|----------|----------|-------|
| Care | `/dashboard/care` | `/provider/care` | — | `/admin/care` |
| Transport | `/dashboard/transport` | `/provider/transport` | — | `/admin/transport` |
| Jobs | `/dashboard/jobs` | — | `/employer/jobs` | `/admin/jobs` |
| Calendar | `/dashboard/calendar` | `/provider/calendar` | `/employer/calendar` | `/admin/service-ops/calendar` |
| Service ops | — | — | — | `/admin/service-ops` |

## Models

`CareRequest`, `CareShift`, `WorkerProfile`, `AvailabilityWindow`, `CapacityBlock`, `TransportBooking`, `Vehicle`, `DriverProfile`, `Job`, `JobApplication`, `CalendarEvent`, `OrchestrationEvent`

## Permissions

See `lib/auth/permissions.ts` — Phase 3 adds `care:*`, `transport:*`, `jobs:*`, `calendar:*`, `admin:service-ops`.

## Configuration

```env
CALENDAR_EXTERNAL_SYNC_ENABLED=false
TRANSPORT_LIVE_TRACKING_ENABLED=false
TRANSPORT_ROUTING_ENABLED=false
JOBS_PUBLIC_BOARD_ENABLED=true
ORCHESTRATION_ENABLED=true
```

## Deploy

```bash
npx prisma db push
npx prisma generate
pnpm prisma db seed
```

## Limitations

No AI matching, live GPS, route optimisation, full NDIS claims, or external iCal sync.

## Phase 4 preview

Matching foundation, marketplace search, live tracking, worker timesheets, incident reporting, NDIS line intelligence.

See also: [care](modules/care.md), [transport](modules/transport.md), [jobs](modules/jobs.md), [calendar](modules/calendar.md), [cross-module orchestration](modules/cross-module-orchestration.md), [provider capacity](modules/provider-capacity.md), [Phase 3 QA](../qa/phase-3.md).

---

## Phase 4 {#phase-4}

Phase 4 adds intelligence and governance: **matching**, **provider search**, **trip tracking**, **driver web app**, **timesheets**, **incidents**, **service agreements**, **NDIS line-item suggestions**, **smart contract runner**, **attestations**, and **admin analytics**.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Configuration

See `.env.example` — `MATCHING_ENGINE_ENABLED`, `SMART_CONTRACT_RUNNER_ENABLED`, `TRANSPORT_LIVE_LOCATION_ENABLED=false`, etc.

## Main routes

| Module | Routes |
|--------|--------|
| Matching | `/admin/matching`, `/api/matching/*` |
| Search | `/dashboard/find-support` |
| Driver | `/driver/trips` |
| Tracking | `/api/transport/:id/tracking` |
| Timesheets | `/api/timesheets/*` |
| Incidents | `/dashboard/incidents/new` |
| Analytics | `/admin/analytics` |
| Contracts | `/api/contracts/run` |

## Limitations

No AI matching, no NDIS Commission auto-reporting, no live GPS by default, no native mobile app.

## Phase 5

AI-assisted matching, NDIA API readiness, native mobile scaffold, advanced route optimisation.

See [incidents](modules/incidents.md) and [Phase 4](#phase-4) module list above.

---

## Phase 5 {#phase-5}

Phase 5 adds **regulated pilot maturity and production-readiness** on top of Phases 1–4. It scaffolds AI-assisted matching with fairness checks, advanced provider verification, NDIS pricing catalogue management, mature Xero/Stripe integration boundaries, mobile API contracts, route optimisation, accessibility map data, support coordinator and plan manager portals, employer ATS-lite, reporting, developer API platform, compliance evidence, security readiness (SOC 2 / ISO 27001 scaffolding), and NDIA API readiness — **without** unsafe automation or false compliance claims.

## Architecture (`lib/`)

| Module | Path | Purpose |
|--------|------|---------|
| AI matching | `lib/ai/matching` | Reviewable AI ranking atop Phase 4 rules |
| Fairness | `lib/fairness` | Bias and suitability flags |
| Provider verification | `lib/provider/verification` | Cases, checks, risk ratings |
| NDIS pricing | `lib/ndis/pricing` | Catalogue import, validate, apply |
| Xero | `lib/xero` | Safe invoice sync (no sensitive notes) |
| Stripe billing | `lib/billing/stripe-billing` | Private-pay, webhooks, refunds |
| Mobile shell | `mobile-contracts/` | Future native app contracts |
| Route optimisation | `lib/transport/route-optimisation` | Placeholder travel plans |
| Accessibility map | `lib/access/accessibility-map` | Places, features, links |
| Support coordinator | `lib/support/coordinator` | Consent-gated portal |
| Plan manager | `lib/support/plan-manager` | Invoice review (no NDIA submit) |
| Employer ATS | `lib/employment/ats` | Pipeline, interviews, adjustments |
| Reporting | `lib/reporting` | Snapshots, small-cell suppression |
| Developer API | `lib/api/developer` | Apps, hashed keys, scopes |
| Compliance evidence | `lib/compliance/evidence` | Controls, retention dry-run |
| Security readiness | `lib/security/readiness` | SOC2/ISO scaffolding |
| NDIA readiness | `lib/ndis/readiness` | Evidence bundles, dry-run only |

## What Phase 5 does **not** add

- Autonomous AI assignment
- Real NDIA / PACE claim submission
- NDIS Commission auto-reporting
- SOC 2 or ISO 27001 certification
- Production native mobile app
- Full fleet route optimisation
- Unrestricted public API to participant sensitive data

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Configuration

See `.env.example` — integrations default **off** (`AI_MATCHING_ENABLED=false`, `XERO_ENABLED=false`, `NDIA_REAL_SUBMISSION_ENABLED=false`).

## Phase 6 recommendations

Native mobile production build, real-time dispatch, provider quality dashboard, approved NDIA API pilot (if formally authorised), data warehouse automation, partner sandbox, multi-region DR.

---

## Phase 6 {#phase-6}

Phase 6 adds **production and ecosystem launch** tooling: launch readiness, dispatch console, provider quality, AI governance, partner sandbox, accessibility accreditation, open data (gated), government report drafts, disaster recovery exercises, evidence automation, board reporting, and community governance.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules (`lib/`)

| Module | Service |
|--------|---------|
| `launch-readiness` | Production checklist |
| `dispatch-console` | Care/transport/incident queues |
| `provider-quality` | Explainable quality scores |
| `ai-governance` | Model monitors & incidents |
| `partner-sandbox` | Test apps (no prod participant data) |
| `accessibility-accreditation` | Scored cases with disclaimers |
| `open-data` | Privacy-safe exports (flag-gated) |
| `government-reporting` | Draft packs only |
| `disaster-recovery` | Exercise evidence |
| `evidence-automation` | SOC/ISO snapshot jobs |
| `board-reporting` | Aggregate board metrics |
| `community-governance` | Meetings & decisions |
| `mobile-production` | Release checklists |

## Admin routes

`/admin/launch-readiness`, `/admin/dispatch`, `/admin/provider-quality`, `/admin/ai-governance`, `/admin/partner-sandbox`, `/admin/accessibility-accreditation`, `/admin/open-data`, `/admin/disaster-recovery`, `/admin/evidence-automation`, `/admin/board-reporting`, `/admin/community-governance`

## APIs

`GET/POST /api/admin/launch-readiness`, `/api/admin/dispatch`, `/api/admin/provider-quality`, `/api/admin/ai-governance`, `/api/admin/partner-sandbox`, `/api/admin/board-reporting`, `/api/admin/community-governance`, `/api/admin/open-data`, `/api/admin/government-reporting`, `/api/admin/evidence-automation`

## Limitations

- No autonomous dispatch or assignment
- No legal certification claims for accreditation
- Open data and government reporting default **disabled**
- No SOC 2 / ISO certification from evidence jobs

## Phase 7 next

Mobile release hardening, operator dispatch, payment reconciliation, multi-tenant admin, enterprise/government portals.

---

## Phase 7 {#phase-7}

Phase 7 adds **live pilot and scale operations**: mobile release hardening, operator dispatch, payment reconciliation, plan manager pilot, NDIA pilot (flag-gated), public transparency, multi-tenant admin, enterprise and government portals, public beta, social impact, and scale planning.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `multi-tenant-admin` | Tenant boundaries |
| `payment-reconciliation` | Stripe + Xero + MapAble matching |
| `operator-dispatch` | Reassign, cancel resolutions |
| `provider-onboarding-automation` | Onboarding task workflows |
| `plan-manager-pilot` | Partner exports |
| `ndia-pilot` | Approval-gated dry runs only |
| `accreditation-public-program` | Published profiles |
| `public-transparency` | Approved publications |
| `enterprise-provider` | Org-scoped console |
| `government-portal` | Aggregate council data |
| `public-beta` | Cohort feedback |
| `social-impact` | Outcomes with suppression |
| `scale-plan` | Board-approved milestones |
| `mobile-release` | Release blockers |
| `ai-monitoring-dashboard` | Fairness trend snapshots |
| `dr-exercises` | Automated DR steps |

## Public routes

- `/enterprise-provider` — provider admin console (permission `enterprise:console`)
- `/government-partner` — disabled unless `GOVERNMENT_PARTNER_PORTAL_ENABLED=true`
- `/transparency` — approved publications
- `/accreditation` — published accreditation profiles

## Admin routes

- `/admin/payment-reconciliation`
- `/admin/operator-dispatch`
- `/admin/mobile-release`
- `/admin/provider-onboarding`
- `/admin/plan-manager-pilot`
- `/admin/tenants`
- `/admin/public-beta`
- `/admin/social-impact`
- `/admin/scale-plan`
- `/admin/ndia-pilot`
- `/admin/accreditation-public`
- `/admin/ai-monitoring`
- `/admin/public-transparency`
- `/admin/government-portals`
- `/admin/dr-exercises`

## Admin APIs

`GET`/`POST` under `/api/admin/` for: `payment-reconciliation`, `operator-dispatch`, `mobile-release`, `provider-onboarding`, `plan-manager-pilot`, `tenants`, `ndia-pilot`, `accreditation-public`, `ai-monitoring`, `public-transparency`, `government-portals`, `dr-exercises`, `public-beta`, `social-impact`, `scale-plan`.

## Feature flags (`.env.example` Phase 7)

| Flag | Default |
|------|---------|
| `MULTI_TENANT_PARTNER_ADMIN_ENABLED` | true |
| `PUBLIC_BETA_ENABLED` | false |
| `ENTERPRISE_PROVIDER_CONSOLE_ENABLED` | true |
| `GOVERNMENT_PARTNER_PORTAL_ENABLED` | false |
| `SOCIAL_IMPACT_MEASUREMENT_ENABLED` | true |
| `NDIA_PILOT_ENABLED` | false |

## Limitations

- NDIA pilot does not submit claims without `NDIA_PILOT_ENABLED` and governance approval
- Government portal disabled unless `GOVERNMENT_PARTNER_PORTAL_ENABLED=true`
- Reconciliation uses placeholder matching logic
- DR automation records steps only — human sign-off required

## Phase 8 next

App store release process, transport network rollout, national insights, API versioning.

---

## Phase 8 {#phase-8}

Phase 8 adds **repeatable national infrastructure**: app store release process, transport network rollout, compliance renewals, settlement batches, national insights, public API v1/v2 versioning, SLA and grant reporting, external security audit packs, assessor tools, data trust council, and platform status.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `app-store-release` | Store submission checklist |
| `transport-network-rollout` | Regional rollout tracking |
| `compliance-renewals` | Control renewal calendar |
| `settlement-batches` | Invoice settlement batches |
| `national-insights` | Suppressed aggregate snapshots |
| `api-versioning` | v1 stable, v2 draft policy |
| `sla-reporting` | Placeholder SLA reports |
| `grant-reporting` | Grant outcome reports |
| `external-security-audit` | Audit evidence packs |
| `assessor-tools` | Assessor case workflow |
| `platform-status` | `/status` health checks |
| `data-trust-council` | Council meeting records |
| `partner-marketplace` | Listings (flag-gated off) |

## Public routes

- `/status` — platform health (runs checks on each visit)
- `/insights/national` — published national snapshots
- `/assessor` — assessor portal (`assessor:portal` permission)

## API versions

- `/api/v1/places` — stable default
- `/api/v2/places` — draft expanded response shape

## Admin routes

`/admin/app-store-release`, `/admin/transport-network`, `/admin/compliance-renewals`, `/admin/settlement-batches`, `/admin/national-insights`, `/admin/api-versioning`, `/admin/sla-reporting`, `/admin/grant-reporting`, `/admin/security-audit-packs`, `/admin/data-trust-council`, `/admin/partner-marketplace`

Matching `GET`/`POST` under `/api/admin/*` plus `/api/admin/platform-status` and `/api/assessor/cases`.

## Feature flags

| Flag | Default |
|------|---------|
| `APP_STORE_RELEASE_PROCESS_ENABLED` | true |
| `NATIONAL_INSIGHTS_ENABLED` | true |
| `PARTNER_MARKETPLACE_ENABLED` | false |
| `PUBLIC_API_VERSIONING_ENABLED` | true |
| `SLA_REPORTING_ENABLED` | true |
| `EXTERNAL_SECURITY_AUDIT_READINESS_ENABLED` | true |
| `DATA_TRUST_COUNCIL_ENABLED` | true |

## Limitations

- SLA metrics are placeholders until observability is wired
- Settlement batches use simplified invoice matching
- v2 API remains draft; v1 is default for partners
- Partner marketplace disabled unless explicitly enabled

## Phase 9 next

Mature civic platform: data vault, public decision register, i18n, longitudinal impact.

---

## Phase 9 {#phase-9}

Phase 9 adds a **mature civic platform**: national rollout stages, partner billing, partner API program, assessor network, public decision register, personal data vault, research safe room, provider benchmarking, governance charter, internationalisation, and longitudinal impact waves.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `national-rollout` | National region rollout stages |
| `partner-billing` | Partner organisation billing accounts |
| `partner-api-program` | API partner enrollments (flag-gated) |
| `assessor-network` | Registered assessor directory |
| `public-decision-register` | Published governance decisions |
| `personal-data-vault` | User export/portability requests |
| `research-safe-room` | Ethics-gated synthetic research projects |
| `provider-benchmarking` | Suppressed aggregate benchmarks |
| `governance-charter` | Ratified charter versions |
| `internationalisation` | Locale translation strings |
| `longitudinal-impact` | Impact study waves |

## Public routes

- `/data-vault` — participant data requests (`data_vault:self`)
- `/decisions` — public decision register
- `/governance` — active ratified charter
- `GET /api/i18n/[locale]` — translation bundle
- `GET/POST /api/data-vault` — vault API for authenticated users

## Admin routes

`/admin/national-rollout`, `/admin/partner-billing`, `/admin/partner-api-program`, `/admin/assessor-network`, `/admin/public-decisions`, `/admin/personal-data-vault`, `/admin/research-safe-room`, `/admin/provider-benchmarking`, `/admin/governance-charter`, `/admin/i18n`, `/admin/longitudinal-impact`

Matching `/api/admin/*` endpoints for each module.

## Feature flags

| Flag | Default |
|------|---------|
| `PERSONAL_DATA_VAULT_ENABLED` | true |
| `PUBLIC_DECISION_REGISTER_ENABLED` | true |
| `INTERNATIONALISATION_ENABLED` | true |
| `LONGITUDINAL_IMPACT_ENABLED` | true |
| `PUBLIC_API_PARTNER_PROGRAM_ENABLED` | false |
| `RESEARCH_SAFE_ROOM_ENABLED` | false |

## Limitations

- Data vault requests require human review before export/deletion
- Research safe room disabled unless explicitly enabled
- Benchmarks suppressed for small cohorts — not competitive rankings
- Partner API program enrollment blocked when flag is off

## Phase 10 next

API certification, algorithm register, oversight board, privacy-preserving analytics, outcomes portal.

---

## Phase 10 {#phase-10}

Phase 10 completes the **public-interest operating system**: API certification, public algorithm register, oversight board portal, privacy-preserving analytics, federated research, provider academy, data trust annual reports, sustainability planning, and long-term outcomes.

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `api-certification` | Partner API certification workflow |
| `algorithm-register` | Published algorithm transparency |
| `oversight-board` | Board meetings and decisions |
| `privacy-preserving-analytics` | DP-placeholder analytics runs |
| `federated-research` | Cross-institution agreements (flag-gated) |
| `provider-academy` | Training courses and enrollments |
| `data-trust-annual-report` | Annual accountability reports |
| `sustainability-plan` | Environmental/governance milestones |
| `long-term-outcomes` | Published outcome snapshots |

## Public routes

- `/algorithms` — public algorithm register
- `/oversight` — oversight board portal
- `/outcomes` — long-term outcomes
- `/academy` — provider training (`provider_academy:enroll`)

## Admin routes

`/admin/api-certification`, `/admin/algorithm-register`, `/admin/oversight-board`, `/admin/privacy-analytics`, `/admin/federated-research`, `/admin/provider-academy`, `/admin/data-trust-reports`, `/admin/sustainability-plan`, `/admin/long-term-outcomes`

Matching `/api/admin/*` plus `POST /api/academy/enroll`.

## Feature flags

| Flag | Default |
|------|---------|
| `PUBLIC_ALGORITHM_REGISTER_ENABLED` | true |
| `OVERSIGHT_BOARD_PORTAL_ENABLED` | true |
| `PRIVACY_PRESERVING_ANALYTICS_ENABLED` | true |
| `SUSTAINABILITY_PLAN_ENABLED` | true |
| `API_CERTIFICATION_PROGRAM_ENABLED` | false |
| `FEDERATED_RESEARCH_ENABLED` | false |

## Limitations

- Privacy analytics uses placeholder differential privacy — not production-grade DP
- API certification and federated research disabled unless explicitly enabled
- Algorithm register is transparency only — not regulatory certification
- Outcomes suppressed for small cohorts per Phase 5 thresholds

## Phases 6–10 complete

See `docs/mapable/cursor-prompts-phases-6-10.md` for the full roadmap. Phase 11 (accountability portal, constitutional safeguards) is documented as preview only — not implemented here.

---

## Phase 12 {#phase-12}

Phase 12 delivers **federated institutional accountability** and completes themes from the deferred **Phase 11 preview** (national accountability portal, constitutional safeguards, community governance membership, transport investment modelling, certified API ecosystem at scale, research federation at scale).

There was no separate Phase 11 implementation branch — Phase 12 absorbs that scope plus institutional permanence (continuity plans, civic audit index, federated accountability partners).

## Deploy

```bash
npx prisma db push && npx prisma generate && pnpm prisma db seed
```

## Modules

| Module | Purpose |
|--------|---------|
| `national-accountability` | Published accountability reports |
| `constitutional-safeguards` | Platform safeguard articles |
| `community-governance-membership` | Public membership directory (labels only) |
| `transport-investment-modelling` | Scenario models with suppression |
| `certified-api-ecosystem` | Certified partner API listings (flag-gated) |
| `research-federation-at-scale` | Approved federation nodes (flag-gated) |
| `institutional-continuity` | Succession and continuity checkpoints |
| `civic-audit-index` | Annual civic audit publications |
| `federated-accountability` | Cross-jurisdiction partner links |

## Public routes

- `/accountability` — national accountability portal
- `/safeguards` — constitutional safeguards
- `/membership` — community governance directory
- `/investment-models` — transport investment scenarios

## Admin routes

`/admin/national-accountability`, `/admin/constitutional-safeguards`, `/admin/community-membership`, `/admin/transport-investment`, `/admin/certified-api-ecosystem`, `/admin/research-federation-nodes`, `/admin/institutional-continuity`, `/admin/civic-audit-index`, `/admin/federated-accountability`

Matching `/api/admin/*` for each.

## Feature flags

| Flag | Default |
|------|---------|
| `NATIONAL_ACCOUNTABILITY_PORTAL_ENABLED` | true |
| `CONSTITUTIONAL_SAFEGUARDS_ENABLED` | true |
| `COMMUNITY_GOVERNANCE_MEMBERSHIP_ENABLED` | true |
| `TRANSPORT_INVESTMENT_MODELLING_ENABLED` | true |
| `INSTITUTIONAL_CONTINUITY_ENABLED` | true |
| `CIVIC_AUDIT_INDEX_ENABLED` | true |
| `FEDERATED_ACCOUNTABILITY_ENABLED` | true |
| `CERTIFIED_API_ECOSYSTEM_AT_SCALE_ENABLED` | false |
| `RESEARCH_FEDERATION_AT_SCALE_ENABLED` | false |

## Limitations

- Investment models are scenarios only — not financial or government advice
- Membership directory publishes labels only — no PII
- API ecosystem and research federation require explicit flags
- Safeguards are operational principles — not legal constitutional documents

## MapAble Core phases

Phases 1–5 (baseline), 6–10 (documented in `docs/mapable/cursor-prompts-phases-6-10.md`), and **Phase 12** complete the civic platform arc. Phase 11 preview items are implemented here.

---
