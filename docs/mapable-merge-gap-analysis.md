# MapAble REPL ↔ mapableau-new Gap Analysis

**Date:** 2026-07-27  
**Status:** Decision-ready — input for the port task  
**Audience:** Technical leads and non-technical stakeholders

---

## Executive Summary

MapAble 4.0 (this Replit project, "the REPL") and `ausdisau/mapableau-new` ("mapableau-new") are two separate products built on incompatible stacks. A literal file-merge is not possible. mapableau-new is the richer, more production-hardened codebase and should be the **canonical base**. The REPL contains eight significant capabilities that do not exist in mapableau-new and are worth porting; the rest is either already covered there (often more completely) or is clearly superseded. The recommended migration path is to port REPL-unique features into mapableau-new and continue development there, rather than trying to modernise the REPL's stack in-place.

---

## 1. Stack & Architecture Comparison

| Dimension | MapAble REPL (this project) | mapableau-new |
|---|---|---|
| **Framework** | Express.js API + React 18 + Vite (SPA) | Next.js 15 App Router (SSR/RSC) |
| **Language** | TypeScript | TypeScript |
| **ORM** | Drizzle ORM | Prisma |
| **Database** | Neon PostgreSQL (`NEON_DATABASE_URL`) | Neon PostgreSQL + Supabase option |
| **Auth** | Express sessions + Auth0 SSO (Google/Microsoft PKCE) | next-auth v4 + passkey credentials + Keycloak + Twilio 2FA |
| **AI / LLM** | OpenAI via Replit AI Integrations | Vercel AI SDK (`@ai-sdk/openai-compatible`) + Gemini |
| **Payments** | Stripe (Payment Intents, Link, BECS, Connect) | Stripe (richer: customer portal, billing claims, payouts, reconciliation) |
| **Accounting** | QuickBooks Online (OAuth 2, invoice push/pull, webhooks) | Xero (tenant connection, contact/invoice sync) |
| **Usage metering** | Orb (care_hours, transport_km events) | None detected |
| **Email** | AgentMail (Replit connector — send, reply, inbox management) | SendGrid (`@sendgrid/mail`) |
| **Object storage** | Replit Object Storage (multi-bucket abstraction: `default`, `assets`) | Supabase Storage |
| **Package manager** | npm | pnpm |
| **Deploy target** | Replit (port 5000, Express serves static + API) | Vercel (Next.js serverless, Vercel env) |
| **Testing** | `node:test` + tsx | Vitest + Playwright (a11y + e2e) |
| **Schema size** | ~35 Drizzle tables across 8 schema files | 564 Prisma models in a single schema file |
| **Schema migration** | `drizzle-kit push` (primary) + hand-written idempotent SQL files | `prisma migrate deploy` (production) / `prisma migrate dev` (local) |

**Key incompatibility:** The REPL runs Express on port 5000 with a Vite SPA client. mapableau-new is a Next.js App Router project deployed to Vercel. These are entirely different runtime models; there is no in-place upgrade path.

---

## 2. Feature / Domain Coverage Matrix

| Feature area | REPL | mapableau-new | Verdict |
|---|---|---|---|
| **Care bookings** | Basic (workers, bookings, shifts, availability, service sessions) | Rich (CareRequest → CareShift → CareBooking → CareServiceLog → CareProgressNote, roster, recurring schedules, risk flags, living-alone safeguards) | **REPL weaker** |
| **Transport** | Transport requests, trip logger, per-km Orb metering, wheelchair options | TransportBooking, driver app, real-time tracking, routing optimisation, TP (Transport for NSW) API, run/dispatch management | **REPL weaker** |
| **Employment / jobs** | Job board with category filters, worker-side job browsing | Full employer pipeline (Job, JobApplication, JobPipelineStage, EmployerCandidateNote, employer accessibility commitments, employment provider API v1) | **REPL weaker** |
| **Accessibility map** | Map with 4 domain tabs (accessibility/care/transport/employment), KML/GeoJSON import, community barrier reports, AI map explorer, personal places, worker coverage zones | AccessPlace database (claimed venues, floor plans, reviews, accreditation, indoor incidents, import jobs, AccessCast journey outlook) | **Different scopes** — REPL has geo/layer infrastructure; mapableau-new has crowd-sourced venue data |
| **NDIS billing / claims** | NDIS price tiers (hardcoded), PRODA API (claim submission, plan cache), ndis_claims table | NdisSupportCategory, NdisSupportItem, NdisPriceCatalogue with versioned import, NdisClaimLine, NdisInvoice, billing copilot, claim batch submit/validate/export, delivery authorisations | **REPL weaker** |
| **Invoicing** | Invoice with Stripe + QB sync, NDIS line items, Orb webhook auto-generation | Full billing lifecycle (BillingAccount, BillingInvoice, BillingPayment, BillingSubscription, BillingClaimBatch, credit notes, disputes, void, approval workflows) | **REPL weaker** |
| **Worker / provider management** | Worker profile, verification checklist, Stripe Connect onboarding, ABN validation | WorkerProfile, WorkerTrustCredential, WorkerOrganisationInvite, provider onboarding admin, provider quality admin | **Equivalent, mapableau-new richer on trust** |
| **AI chatbot** | OpenAI chat with guardrails, safeguarding checks, NDIS policy pack (Quality & Safeguarding Manual v3), incident/complaint/consent draft tools, audit log | Basic Slack-relay chat route only | **REPL richer** |
| **Messaging** | In-app messaging system (messages table, contact sidebar) | Conversation + ConversationParticipant + Message + MessageReadReceipt (richer threading) | **mapableau-new richer** |
| **Grocery delivery** | Full supplier adapters (Open Food Facts, Woolworths, Coles, IGA, CSV, composite), grocery_products/orders/order_items, admin sync | Not present | **REPL unique** |
| **Usage metering** | Orb integration (care_hours, transport_km events → auto-invoicing) | Not present | **REPL unique** |
| **ABN lookup / validation** | ABN checksum validation + ABR registry lookup | Not present | **REPL unique** |
| **QuickBooks Online** | Full OAuth 2, invoice push/pull, webhook, background polling, GST/TaxCodeRef | Not present (uses Xero instead) | **REPL unique** |
| **AgentMail email** | Inbox management, send, reply, label management via Replit connector | Uses SendGrid (outbound only, no inbox management) | **REPL unique (different capability)** |
| **BECS direct debit** | AU bank direct debit via Stripe BECS, mandate lifecycle (pending→active), auto-debit gating | Not detected | **REPL unique** |
| **Replit object storage** | Multi-bucket abstraction (`default`/`assets`), ACL, signed URLs, HTTP `/assets/:bucket/*key` route | Supabase Storage | **Different platforms** |
| **Auth** | Express sessions + Auth0 (email/pw + Google/Microsoft SSO) | next-auth + passkeys + Keycloak + Twilio 2FA | **mapableau-new richer** |
| **Consent management** | Basic (chat consent captured in chat) | Full ConsentRecord model (subject, grantor, creator, revoker, audit trail) | **mapableau-new richer** |
| **Safeguarding / incidents** | Chat guardrails, safeguarding queue, SMS alert, incident draft tools | IncidentReport + updates/actions/evidence, ProviderSafeguardReview, BillingSafeguardAlert, admin escalation (QSC), CareRiskFlag, CareLivingAloneSafeguard | **Both present, different layers** |
| **Organisation / provider structure** | Single-level (provider user) | Organisation model, OrganisationMember, ProviderProfile, ProviderOutletRegistry, ClaimedProvider | **mapableau-new richer** |
| **Service agreements** | Not present | CareServiceAgreement, ServiceAgreement | **mapableau-new unique** |
| **Assessor / navigator** | Not present | AssessorCase, NavigatorProfile, NavigatorRequest, NavigatorAssignment, NavigatorHandover | **mapableau-new unique** |
| **Assistive technology** | Not present | AtEquipmentAsset, AtEquipmentOutage, AtBackupPlan, AtRepairPartnerRef | **mapableau-new unique** |
| **Academy / training** | Not present | Academy enroll API, WorkerTrainingCompletion | **mapableau-new unique** |
| **Engagement / NPS** | Not present | EngagementSubmission, EngagementNpsResponse, EngagementSurveyResponse | **mapableau-new unique** |
| **Budget dashboard** | participant_budgets table, category progress bars, tier indicators | ParticipantFundingSource, BillingFundingSource | **REPL has UI; mapableau-new has funding model** |
| **WCAG / accessiBe** | WCAG 2.2 AA, skip links, accessiBe floating widget | Playwright a11y tests, SearchAccessibilityFeature, AccessibilityProfile | **Different approaches** |

---

## 3. Data Model Mapping

### REPL tables → mapableau-new equivalents

| REPL table | mapableau-new equivalent | Notes |
|---|---|---|
| `users` | `User` | REPL has `orb_customer_id`, `orb_subscription_id`, `abn`, `abnVerified`, `qb*` fields not present in mapableau-new |
| `workers` | `Worker` + `WorkerProfile` | mapableau-new splits core worker from extended profile |
| `bookings` | `Booking` + `CareBooking` | mapableau-new has much richer booking lifecycle |
| `jobs` | `Job` + `JobApplication` | Equivalent; mapableau-new adds pipeline stages |
| `transport_requests` | `TransportBooking` | mapableau-new adds driver app, tracking, routing |
| `messages` | `Conversation` + `Message` | mapableau-new adds threading, read receipts |
| `pricing_tiers` | `NdisSupportItemPrice` + `NdisPriceRule` | mapableau-new imports from NDIS price catalogue |
| `service_sessions` | `CareServiceLog` + `CareShift` | mapableau-new adds confirmation, dispute, progress notes |
| `transport_trips` | `TransportBooking` trip records | mapableau-new adds tracking events |
| `invoices` | `Invoice` + `BillingInvoice` + `NdisInvoice` | mapableau-new has separate billing domain |
| `reviews` | `AccessPlaceReview` (places) / worker reviews (implicit in booking) | Different domain — REPL reviews workers; mapableau-new reviews places |
| `participant_budgets` | `ParticipantFundingSource` + `BillingFundingSource` | mapableau-new is more granular |
| `access_context_profiles` | `AccessibilityProfile` | Similar intent |
| `chat_sessions` + `chat_messages` | No equivalent | REPL unique AI chatbot |
| `community_reports` | `AccessPlaceReport` (partial) | REPL is barrier-report focused; mapableau-new is venue-review focused |
| `worker_availability` | `WorkerAvailability` | Equivalent |
| `worker_blockouts` | No direct equivalent | REPL unique |
| `shifts` | `CareShift` | mapableau-new is richer |
| `ndis_plan_cache` | No direct equivalent | REPL PRODA cache unique |
| `becs_mandates` | No equivalent | REPL unique (AU BECS direct debit) |
| `ndis_claims` | `NdisClaimLine` + `BillingClaimItem` | mapableau-new claim model is richer |
| `stripe_webhook_events` | `StripeWebhookEvent` | Equivalent |
| `payout_events` | Stripe Connect payout handling (implicit) | Partial overlap |
| `grocery_products` / `grocery_orders` / `grocery_order_items` | None | REPL unique |
| `map_layers` / `map_features` / `map_categories` | `AccessPlace` / `AccessibilityFeature` | Different abstraction — REPL is layer/feature GIS; mapableau-new is venue-centric |
| `personal_places` | No equivalent | REPL unique |
| `service_regions` | `TransportNetworkRegion` (partial) | Different scope |
| `worker_coverage_zones` | No direct equivalent | REPL unique |
| `geo_audit_log` | `AuditEvent` (general) | Covered by mapableau-new general audit |

### mapableau-new models with no REPL equivalent (selected)

`Organisation`, `OrganisationMember`, `ProviderProfile`, `ProviderOutletRegistry`, `PasskeyCredential`, `ConsentRecord`, `CareRequest`, `CareRecurringSchedule`, `CareServiceAgreement`, `CareProgressNote`, `CareRiskFlag`, `CareLivingAloneSafeguard`, `WorkerTrustCredential`, `DriverProfile`, `TripTrackingSession`, `TransportNetworkRegion`, `IncidentReport`, `NdisPriceCatalogue`, `NdisServiceDeliveryAuthorization`, `ServiceAgreement`, `NavigatorProfile`, `AtEquipmentAsset`, `BillingAccount`, `BillingClaimBatch`, `XeroTenantConnection`, `AccessPlace`, `AccessFloorPlan`, `AccessPlaceClaim`, `AccessibilityAccreditationCase`, `EngagementSubmission`, `WorkerTrainingCompletion`, `BreakGlassAccessSession`, `AiGovernanceIncident`, plus ~430 more governance/convergence/analytics models.

---

## 4. Integrations Comparison

| Integration | REPL | mapableau-new | Action |
|---|---|---|---|
| **Stripe** | Payment Intents, Link, BECS, Connect, webhooks, auto-debit | Richer: customer portal, provider payouts, reconciliation, claim billing | Port BECS mandate lifecycle and auto-debit guard to mapableau-new |
| **Orb (usage metering)** | Full: care_hours + transport_km events, subscription setup, billing_period webhook | **Absent** | Port Orb client and event ingestion — high value |
| **QuickBooks Online** | Full: OAuth 2, invoice push, payment pull, webhook, background poll | **Absent** (mapableau-new uses Xero) | Decide: migrate QB users to Xero, or port QB module alongside Xero |
| **Xero** | **Absent** | XeroTenantConnection, XeroContactLink, XeroInvoiceSyncRecord | No action needed (mapableau-new has this) |
| **AgentMail** | Inbox management, send, reply, label management via Replit connector | **Absent** (uses SendGrid for outbound only) | Port or replace: AgentMail provides inbox management that SendGrid does not |
| **SendGrid** | **Absent** | `@sendgrid/mail` for outbound email | No action needed |
| **Auth0** | SSO via PKCE (Google/Microsoft) | **Absent** (uses Keycloak + next-auth) | Auth0 users need migration strategy to next-auth/Keycloak |
| **NDIS PRODA** | PRODA OAuth2, myplace plan/goals fetch, price guide, claim submission, plan cache | NDIS provider ingestion only (no PRODA client) | Port PRODA module — high effort, high value |
| **Replit Object Storage** | Multi-bucket abstraction with ACL, signed URLs, public streaming | **Absent** (uses Supabase Storage) | Replace with Supabase Storage in mapableau-new; do not port Replit-specific SDK |
| **Supabase** | **Absent** | `@supabase/supabase-js` for storage/DB | No action needed |
| **ABR (ABN lookup)** | ABN checksum validation + ABR GUID registry lookup | **Absent** | Port ABN util + route — low effort, needed for provider onboarding |
| **Twilio** | **Absent** (SMS via notifications module, provider unclear) | Twilio 2FA (`/api/auth/twilio-2fa`) | No action needed |
| **accessiBe** | Floating widget (CDN, async, VITE_ACCESSIBE_SITE_KEY) | Not detected | Port accessiBe widget snippet — trivial effort |
| **OpenAI** | Via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`) | Via Vercel AI SDK (`@ai-sdk/openai-compatible`) | Re-wire chatbot to Vercel AI SDK on port |
| **Gemini** | **Absent** | Via Vercel AI SDK | Available in mapableau-new |

---

## 5. REPL-Unique Features Worth Porting

Listed in priority order (effort: S=days, M=weeks, L=month+):

| # | Feature | What it does | Effort | Risk | Priority |
|---|---|---|---|---|---|
| 1 | **AI Chat Guardrails & Safeguarding** | Routes all LLM turns through NDIS policy pack (Quality & Safeguarding Manual v3), detects prompt injection, safeguarding risks, writes audit records, SMS alerts | M | Medium (policy content must be reviewed) | **High** |
| 2 | **NDIS PRODA API Integration** | PRODA OAuth2, myplace participant plan/goals fetch, Price Guide fetcher, plan data caching, claim submission | L | High (external PRODA OAuth, compliance-sensitive) | **High** |
| 3 | **Orb Usage Metering** | Emits care_hours and transport_km events to Orb, manages subscriptions, handles billing_period webhook for auto-invoicing | M | Medium (requires Orb account + plan config) | **High** |
| 4 | **BECS Direct Debit + Auto-Debit** | AU bank direct debit via Stripe BECS mandates (pending→active lifecycle), auto-debit guard (blocks debit against unverified accounts) | M | Medium (AU-specific Stripe feature, compliance) | **High** |
| 5 | **Grocery Supplier Adapters** | Pluggable catalogue sync (Open Food Facts, Woolworths, Coles, IGA, CSV, composite fallback chain), grocery_products/orders tables, admin sync API | M | Low (self-contained module) | **Medium** |
| 6 | **ABN Lookup & Validation** | Checksum validation + ABR registry API, provider onboarding gate | S | Low (pure utility) | **Medium** |
| 7 | **QuickBooks Online Integration** | OAuth 2, invoice push/pull, HMAC webhook, background payment polling, Australian GST/TaxCodeRef | M | Medium (QB API tokens, must co-exist with Xero) | **Medium** — if existing QB users must be supported; **Low** if migrating to Xero |
| 8 | **AgentMail Inbox Management** | Inbox create/list, send, reply, label management (shift confirmations, invoice emails, support) | S | Low (Replit connector only — must re-implement against AgentMail REST API directly in mapableau-new) | **Medium** |

### Features to leave in the REPL only (not port)

| Feature | Reason |
|---|---|
| Replit Object Storage abstraction | Platform-specific; replace with Supabase Storage |
| accessiBe widget | Trivial snippet — port as a 30-minute copy |
| From-scratch LLM spec | Cursor/GPU work, not app-level porting |
| Geo map layer/feature GIS infrastructure | mapableau-new has a different, richer AccessPlace model; evaluate whether the REPL's geo layer infrastructure adds anything on top |

---

## 6. Recommendation

### 6a. Canonical base: mapableau-new ✓

mapableau-new should be the canonical base. Reasons:

- **564 Prisma models** vs ~35 Drizzle tables: mapableau-new is a far more complete domain model covering care, transport, employment, billing, consent, organisation, AT equipment, navigator, and incident management.
- **Production-hardened CI**: mapableau-new has Vitest unit tests, Playwright a11y and e2e tests, structured migration history, ESLint with zero-warning enforcement, and a formal release process (human release evidence, branch protection audit).
- **Better auth**: Passkeys + Keycloak + Twilio 2FA vs session cookies + Auth0 PKCE.
- **Vercel deployment**: Next.js App Router on Vercel is better suited to the planned scale than Express on Replit.
- **Active development**: 564 models and 12+ seed phases indicate continuous active development.

### 6b. Where the combined result should live

**Recommended: Continue in mapableau-new (external GitHub repo), deployed to Vercel.**

Do **not** attempt to continue in this Replit project. Reasons:

- This REPL runs Express on port 5000 wired to Replit's workflow system — incompatible with Next.js App Router.
- Replit's object storage, AgentMail connector, and AI integrations are platform-specific; they must be replaced with Vercel/Supabase/SendGrid equivalents anyway.
- The REPL has no migration history tooling as robust as Prisma's (`prisma migrate deploy`), and the Drizzle journal is already drifting (see `drizzle-migrations.md` in agent memory).

**Trade-offs of staying on Replit:**
- ✓ Lower immediate effort; no infra change.
- ✗ Would require adopting Next.js or staying on a less capable Express stack long-term.
- ✗ Replit platform limits (compute, storage, auth) are not designed for production NDIS-scale workloads.
- ✗ Existing Replit-specific integrations (AgentMail connector, Replit AI API) have no equivalent outside the platform without re-implementation.

---

## 7. Risks & Migration Considerations

| Risk | Detail | Mitigation |
|---|---|---|
| **Auth model gap** | REPL users have Express session + Auth0 accounts; mapableau-new uses next-auth with `passwordHash` + passkeys. Existing user sessions cannot be carried over. | Plan a one-time auth migration: export Auth0 user emails, invite users to reset passwords in mapableau-new, or configure Auth0 as an external OIDC provider for next-auth. |
| **Billing / NDIS data migration** | REPL has live Orb subscriptions, Stripe customers, QB OAuth tokens, and BECS mandates. These cannot be schema-migrated automatically. | Write a one-off migration script per entity type. Stripe customer IDs can be preserved. QB tokens expire; re-auth will be needed. Orb subscriptions must be re-mapped. |
| **Secrets reconciliation** | REPL uses 30+ env vars; mapableau-new uses a different set (Vercel env). Many keys overlap conceptually but differ in name (`NEON_DATABASE_URL` vs `DATABASE_URL` + `DIRECT_URL`). | Produce an env mapping document before migration. Never commit secrets; use Vercel environment variable management. |
| **Drizzle → Prisma schema gap** | REPL tables with no mapableau-new equivalent (becs_mandates, ndis_plan_cache, grocery_*, geo map tables, personal_places, worker_coverage_zones) must be added to the Prisma schema as new migrations. | Design Prisma models for each REPL-unique table before porting feature code. Follow mapableau-new's migration discipline (`prisma migrate dev` locally, `prisma migrate deploy` in production). |
| **Geo map infrastructure** | The REPL's geo layer/feature/category GIS tables are absent from mapableau-new. mapableau-new has AccessPlace (venue-centric) which is a different abstraction. | Decide whether to adopt AccessPlace as the geo data model, or add the layer-based GIS tables as a parallel domain in Prisma. The former reduces surface area; the latter preserves the map-tab functionality. |
| **PRODA compliance** | PRODA OAuth credentials are sensitive; API access requires registered devices and org IDs. Test environments are separate from production. | PRODA module must be environment-gated (`NDIS_PRODA_BASE_URL` absent → 503, as in the REPL). Do not expose PRODA creds in CI. |
| **QB vs Xero** | mapableau-new has Xero; the REPL has QuickBooks. Some operators may have existing QB connections. | Either: (a) port the QB module alongside Xero as an alternative accounting integration, or (b) migrate QB users to Xero (requires user re-auth + data re-mapping). Decision needed from business. |
| **AgentMail replacement** | AgentMail is accessed via the Replit connectors SDK which only works inside Replit. In mapableau-new, the AgentMail REST API must be called directly (or replaced with SendGrid inbound parsing). | Re-implement AgentMail HTTP client without the Replit connector proxy. The API surface is small (6 endpoints). |

---

## 8. Outline for the Follow-On Port Task

The port task (`Adopt mapableau-new as base + port REPL-unique extras`) should be scoped in this order:

### Phase 0 — Environment setup (prerequisite)
- Clone mapableau-new into the Replit project (or a new Replit project configured for Next.js).
- Reconcile env vars; document the mapping.
- Confirm `pnpm install && prisma generate && pnpm dev` works.

### Phase 1 — Schema additions (data foundation for ported features)
Add Prisma models for each REPL-unique table that does not have a mapableau-new equivalent:
1. `BecsMandate` (BECS direct debit mandates)
2. `NdisPlanCache` (PRODA plan cache)
3. `GroceryProduct`, `GroceryOrder`, `GroceryOrderItem`
4. `MapLayer`, `MapFeature`, `MapCategory`, `PersonalPlace`, `ServiceRegion`, `WorkerCoverageZone`, `GeoAuditLog` (or decide to adopt AccessPlace)
5. `OrbSubscription` / add `orbCustomerId`, `orbSubscriptionId` to `User`
6. `QuickBooksConnection` (if QB is retained)

### Phase 2 — Utility ports (low risk, self-contained)
- ABN validation utility (`shared/abn-utils.ts` → `lib/abn-utils.ts`)
- accessiBe widget snippet

### Phase 3 — Orb usage metering
- Port `server/orb.ts` → `lib/billing/orb.ts`
- Wire care shift completion and transport trip completion to Orb event ingestion
- Port `billing_period_ended` webhook handler

### Phase 4 — BECS + auto-debit
- Port BECS mandate creation/lifecycle routes
- Port auto-debit guard (block debit against `status !== 'active'` mandate)
- Wire Stripe `setup_intent.succeeded` / `mandate.updated` webhook handlers

### Phase 5 — Grocery supplier module
- Port `server/grocery-supplier.ts` adapters (Open Food Facts, Woolworths, Coles, IGA, CSV, composite)
- Port grocery routes and admin sync API

### Phase 6 — AgentMail email
- Re-implement AgentMail HTTP client without Replit connector proxy
- Port inbox management, send, and reply endpoints

### Phase 7 — NDIS PRODA integration
- Port PRODA OAuth2 module, myplace client, plan cache, rate validation
- Port claim submission routes
- Extensive testing against PRODA sandbox before enabling in production

### Phase 8 — AI Chat Guardrails & Safeguarding
- Port chat engine with guardrails framework
- Migrate NDIS policy pack content (Quality & Safeguarding Manual v3)
- Re-wire to Vercel AI SDK (replace Replit AI Integrations)
- Port safeguarding queue, incident draft tools, audit log
- Validate SMS alert path (Twilio is already in mapableau-new)

### Phase 9 — QuickBooks (if retained)
- Port QB OAuth module and invoice push/pull alongside existing Xero integration
- Implement UI toggle for accounting integration choice

### Phase 10 — Geo map layer infrastructure (if adopted)
- Migrate REPL geo layer/feature model or adapt to AccessPlace
- Port KML/GeoJSON import, map explorer AI, worker coverage zones

---

## Appendix: File Cross-Reference

| REPL file | mapableau-new equivalent |
|---|---|
| `server/orb.ts` | No equivalent → `lib/billing/orb.ts` (new) |
| `server/quickbooks.ts` | No equivalent → `lib/billing/quickbooks.ts` (new, optional) |
| `server/agentmail-service.ts` | No equivalent → `lib/email/agentmail.ts` (new) |
| `server/grocery-supplier.ts` | No equivalent → `lib/grocery/supplier.ts` (new) |
| `server/ndis-api.ts` | `app/api/admin/ingest/ndis-providers/route.ts` (partial) → port PRODA client separately |
| `server/chat-engine.ts` + `server/chat-guardrails.ts` | No equivalent → port with Vercel AI SDK |
| `server/auto-debit.ts` | No equivalent → `lib/billing/auto-debit.ts` (new) |
| `shared/abn-utils.ts` | No equivalent → `lib/abn-utils.ts` (new) |
| `server/geo/seed.ts` | No equivalent → port alongside schema additions |
| `server/routes/geo.ts` | No equivalent → `app/api/geo/` (new route group) |

---

*This document was produced from automated analysis of both codebases on 2026-07-27. It should be reviewed by a technical lead before the port task begins.*
