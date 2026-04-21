# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a fullstack TypeScript superapp combining core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs
- **MapAble Chat** - AI-powered accessibility-context chatbot
- **Pricing & Billing** - NDIS-aligned tiered pricing with Stripe Link payments & Orb usage metering
- **Budget Tracking** - Real-time NDIS plan budget monitoring
- **Email** - AgentMail integration for sending/receiving emails (shift confirmations, invoices, support)
- **ABN Lookup** - Australian Business Number validation and ABR registry lookup

## Architecture
- **Runtime**: Node.js/TypeScript
- **Backend**: Express.js (primary API + auth + payments)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Database**: Neon PostgreSQL (serverless) via Drizzle ORM
- **AI**: OpenAI (via Replit AI Integrations)
- **Payments**: Stripe (Payment Intents with Link + Card methods)
- **Usage Metering**: Orb (care hours and transport km billing)
- **Auth**: Express sessions with login/logout + Auth0 SSO (Google/Microsoft via PKCE)
- **Routing**: wouter (frontend), Express (backend API)

## Brand Identity
- **Brand**: Australian Disability Ltd / MapAble — tagline "Empowering Independence"
- **Colors**: Primary blue #1B6EB5, teal green #2EAA6E (verified/success), golden yellow #E6A817 (accents)
- **Header**: Gradient blue bar (linear-gradient #14578F → #1B6EB5 → #2384C9)
- **Dark mode**: Deep navy #0F1A2E background

## Running the Project
- **Main Workflow**: `npm run dev` — Express + Vite on port 5000 (primary app)
- **AgentMail Service**: `npx tsx server/agentmail-service.ts` (runs on port 3001 internally)
- **DB push**: `npx drizzle-kit push`

## Environment Variables
- `NEON_DATABASE_URL` / `DATABASE_URL` — Neon PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` — OpenAI API key (via Replit integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` — OpenAI base URL (via Replit integrations)
- `SESSION_SECRET` — Session secret key
- `STRIPE_SECRET_KEY` — Stripe secret API key
- `STRIPE_PUBLISHABLE_KEY` — Stripe publishable key (exposed to frontend)
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret
- `ORB_API_KEY` — Orb API key for usage-based billing
- `AUTH0_DOMAIN` — Auth0 tenant domain (default: `adid.au.auth0.com`)
- `AUTH0_CLIENT_ID` — Auth0 application Client ID
- `AUTH0_CLIENT_SECRET` — Auth0 application Client Secret (required for SSO)
- `VITE_ACCESSIBE_SITE_KEY` — accessiBe widget site key for React frontend
- `ABR_GUID` — Australian Business Register API GUID for ABN lookups (optional; format-only validation works without it)
- `QB_CLIENT_ID` — QuickBooks Online OAuth 2.0 Client ID
- `QB_CLIENT_SECRET` — QuickBooks Online OAuth 2.0 Client Secret
- `QB_REDIRECT_URI` — QuickBooks OAuth callback URI (e.g. `https://<domain>/api/quickbooks/callback`)
- `QB_ENVIRONMENT` — QuickBooks environment: `sandbox` (default) or `production`
- `QB_WEBHOOK_VERIFIER_TOKEN` — QuickBooks webhook verifier token (optional; for webhook HMAC validation)

## Project Structure
```
shared/
  schema.ts              - Barrel export for modular schema files
  schema/                - Domain schema modules (users, marketplace, billing, chat, scheduling, grocery)
server/
  index.ts               - Express app setup, session, middleware
  routes/                - Domain API route modules registered from routes/index.ts
  storage/               - IStorage facade plus per-domain storage modules
  db.ts                  - Neon/Drizzle database connection
  stripe.ts              - Stripe client initialization
  orb.ts                 - Orb REST API client (customers, subscriptions, usage events)
  quickbooks.ts          - QuickBooks Online OAuth 2.0, invoice push/pull, payment sync
  chat-engine.ts         - AI chatbot with OpenAI
  seed.ts                - Database seeding
  vite.ts                - Vite dev server integration
  static.ts              - Production static file serving
client/src/
  App.tsx                - Root app with routing, sidebar, header
  pages/
    invoices.tsx          - Invoice list, Pay Now (Stripe Link), usage metering summary
    budget.tsx            - Budget dashboard with tier indicators
    pricing.tsx           - NDIS pricing tier tables
    dashboard.tsx         - Dashboard with stats
    care.tsx, transport.tsx, jobs.tsx, etc.
  components/            - shadcn/ui components
  hooks/                 - Custom React hooks (useAuth, useToast, etc.)
  lib/                   - queryClient, utils
```

## Database Tables (23)
- users (with stripe_customer_id, orb_customer_id, orb_subscription_id)
- workers, bookings, jobs, transport_requests, messages
- pricing_tiers, service_sessions, transport_trips
- invoices (with stripe_payment_intent_id, stripe_payment_status, qb_invoice_id, qb_sync_status, qb_sync_error, qb_last_synced_at)
- reviews, participant_budgets
- access_context_profiles, chat_sessions, chat_messages
- community_reports
- worker_availability, worker_blockouts, shifts, ndis_plan_cache

## Stripe & Orb Billing Integration
- **Stripe Link Checkout**: When user clicks "Pay Now" on an invoice, creates a PaymentIntent with `link` + `card` methods, opens embedded Stripe checkout
- **Stripe Webhooks**: POST `/api/webhooks/stripe` handles payment_intent.succeeded/processing/failed → updates invoice status
- **Orb Usage Metering**: Session and trip creation emit usage events (care_hours, transport_km) to Orb
- **Orb Webhooks**: POST `/api/webhooks/orb` handles billing_period_ended → auto-generates invoices
- **Invoice statuses**: draft, submitted, pending, processing, paid, failed
- **Orb customer setup**: POST `/api/billing/setup-orb` creates Orb customer + subscription for a user

## QuickBooks Online Integration
- **OAuth 2.0 Connect/Disconnect**: Settings page allows connecting/disconnecting QB account
- **Invoice Push Sync**: MapAble invoices auto-sync to QB on generation and Stripe payment; manual sync via Settings
- **Payment Pull Sync**: QB payments auto-detected via webhook handler (POST `/api/quickbooks/webhook`) and background polling (5-min interval)
- **Sync Status UI**: Per-invoice QB sync badges (synced/error/not synced) on Invoices page with click-to-sync and retry
- **QB Webhook**: HMAC-verified webhook endpoint for real-time payment event detection
- **Invoice Update Sync**: QB re-sync triggers on invoice generation, Stripe payment, and invoice status updates (PATCH `/api/invoices/:id/status`)
- **ItemRef handling**: Auto-finds or creates "NDIS Support Services" item in QB for valid line items
- **GST/Tax**: Proper TaxCodeRef (TAX/NON) and GlobalTaxCalculation for Australian GST

## Key Features
- Dashboard with stats, featured workers, recent jobs
- **Worker Dashboard** — Complete support worker experience with role-based sidebar nav, today's shifts, active shift tracking, compliance alerts, earnings stats, recent reviews. Routes: `/worker/dashboard`, `/worker/profile`, `/worker/shifts`, `/worker/bookings`. APIs: `/api/worker/me`, `/api/worker/dashboard`, `/api/worker/bookings`, `/api/worker/earnings`, `/api/worker/reviews`
- **Role-Based Navigation** — Sidebar and mobile nav show different items for carers (worker-focused) vs participants (service-focused). Client-side route guards redirect non-carers from `/worker/*` pages. Server-side RBAC enforces worker-only transitions (confirm/start/complete shifts)
- Worker directory with search, filtering (verified/transport/accessible)
- Worker detail with booking form, shift timer, reviews, verification checklist
- Job board with category filters (Care/Transport/Support/Employment)
- Transport booking with wheelchair options + trip logger with tier pricing
- AI-powered chat assistant with OpenAI
- NDIS pricing tiers (4 care + 4 transport) with automatic tier calculation
- **Shift Scheduler** — dedicated Shifts page with weekly/monthly calendar views, worker availability management, shift booking with NDIS goal alignment, recurring shift creation (weekly/fortnightly), shift status workflow (scheduled → confirmed → in_progress → completed), automatic service session creation on completion
- **NDIS API Integration** — PRODA authentication module (OAuth2), myplace portal client for participant plan/goals, Price Guide data fetcher for NDIS rates, plan data caching, rate validation against NDIS price guide
- Budget dashboard with category progress bars and tier indicators
- Invoice generation with NDIS line items, Stripe payments, and Orb usage metering
- Messaging system with contact sidebar
- Settings with profile editing and accessibility toggles
- Dark mode toggle
- **WCAG 2.2 AA accessibility** with skip links, ARIA landmarks, live regions, and keyboard navigation
- **accessiBe widget**: Floating accessibility overlay (bottom-left) on all pages; loads from `acsbapp.com` CDN async; branded with MapAble blue (#1B6EB5)

## Pricing Engine
- Care tiers: Basic (0-10hrs, $70.23/hr), Standard (11-30hrs, $68/hr), High Support (31+hrs, $65/hr)
- Transport tiers: Basic (0-100km, $0.99/km), Standard (101-300km, $0.90/km), High (301+km, $0.85/km)
- Accessible vehicle surcharge: +$0.15/km
- NDIS item codes on all charges
- Budget usage auto-updated on shift end and trip log
