# MapAble 4.0 - NDIS Support Services Super App

## Overview
MapAble 4.0 is a fullstack TypeScript superapp combining core NDIS services:
- **MapAble for Care** - Book verified support workers/carers
- **MapAble for Transport** - Arrange wheelchair-accessible transport
- **MapAble for Employment** - Find disability support jobs
- **MapAble Chat** - AI-powered accessibility-context chatbot
- **Pricing & Billing** - NDIS-aligned tiered pricing with Stripe Link payments & Orb usage metering
- **Budget Tracking** - Real-time NDIS plan budget monitoring

## Architecture
- **Runtime**: Node.js with TypeScript (tsx)
- **Backend**: Express.js
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Database**: Neon PostgreSQL (serverless) via Drizzle ORM
- **AI**: OpenAI (via Replit AI Integrations)
- **Payments**: Stripe (Payment Intents with Link + Card methods)
- **Usage Metering**: Orb (care hours and transport km billing)
- **Auth**: Express sessions with login/logout
- **Routing**: wouter (frontend), Express (backend API)

## Brand Identity
- **Brand**: Australian Disability Ltd / MapAble — tagline "Empowering Independence"
- **Colors**: Primary blue #1B6EB5, teal green #2EAA6E (verified/success), golden yellow #E6A817 (accents)
- **Header**: Gradient blue bar (linear-gradient #14578F → #1B6EB5 → #2384C9)
- **Dark mode**: Deep navy #0F1A2E background

## Running the Project
- **Workflow**: `npm run dev` (runs tsx server/index.ts)
- **Dev server**: Express + Vite on port 5000
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

## Project Structure
```
shared/
  schema.ts              - Drizzle ORM schema (all tables + insert schemas + types)
server/
  index.ts               - Express app setup, session, middleware
  routes.ts              - All API routes (auth, CRUD, payments, webhooks)
  storage.ts             - IStorage interface + DatabaseStorage implementation
  db.ts                  - Neon/Drizzle database connection
  stripe.ts              - Stripe client initialization
  orb.ts                 - Orb REST API client (customers, subscriptions, usage events)
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

## Database Tables
- users (with stripe_customer_id, orb_customer_id, orb_subscription_id)
- workers, bookings, jobs, transport_requests, messages
- pricing_tiers, service_sessions, transport_trips
- invoices (with stripe_payment_intent_id, stripe_payment_status)
- reviews, participant_budgets
- access_context_profiles, chat_sessions, chat_messages
- community_reports

## Stripe & Orb Billing Integration
- **Stripe Link Checkout**: When user clicks "Pay Now" on an invoice, creates a PaymentIntent with `link` + `card` methods, opens embedded Stripe checkout
- **Stripe Webhooks**: POST `/api/webhooks/stripe` handles payment_intent.succeeded/processing/failed → updates invoice status
- **Orb Usage Metering**: Session and trip creation emit usage events (care_hours, transport_km) to Orb
- **Orb Webhooks**: POST `/api/webhooks/orb` handles billing_period_ended → auto-generates invoices
- **Invoice statuses**: draft, submitted, pending, processing, paid, failed
- **Orb customer setup**: POST `/api/billing/setup-orb` creates Orb customer + subscription for a user

## Pricing Engine
- Care tiers: Basic (0-10hrs, $70.23/hr), Standard (11-30hrs, $68/hr), High Support (31+hrs, $65/hr)
- Transport tiers: Basic (0-100km, $0.99/km), Standard (101-300km, $0.90/km), High (301+km, $0.85/km)
- Accessible vehicle surcharge: +$0.15/km
- NDIS item codes on all charges
- Budget usage auto-updated on shift end and trip log
