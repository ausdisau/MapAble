# mapableau-new Integration Guide

## What this package contains

Port-ready implementations of eight REPL-unique capabilities, rewritten against
mapableau-new's stack (Next.js 15 App Router, Prisma, Vercel). Nothing here is
Replit-specific; everything uses standard Node fetch, Prisma, and next-auth.

```
ports/mapableau-new/
  prisma/
    additions.prisma          ← new Prisma models (append to schema.prisma)
  src/
    lib/
      orb/
        client.ts             ← Orb usage-metering client
      ndis/
        proda-client.ts       ← PRODA OAuth2 + API client
        abn-utils.ts          ← ABN validation + ABR registry lookup
      billing/
        quickbooks/
          client.ts           ← QB OAuth2 + API request helper
          sync.ts             ← QB invoice push/pull
        auto-debit.ts         ← BECS auto-debit scheduler
      email/
        agentmail.ts          ← AgentMail HTTP client (no Replit proxy)
      grocery/
        supplier/
          types.ts            ← shared types
          adapters.ts         ← all supplier adapters + factory
      chat/
        guardrails/
          classify.ts         ← input classifier (pure, Edge-safe)
          policy.ts           ← NDIS policy pack
          audit.ts            ← DB write helpers + side-effect dispatcher
    app/
      api/
        billing/
          orb/setup/route.ts        ← POST /api/billing/orb/setup
          orb/usage/route.ts        ← GET  /api/billing/orb/usage
          becs/mandate/route.ts     ← BECS mandate CRUD
          auto-debit/tick/route.ts  ← Vercel Cron auto-debit tick
          quickbooks/auth/route.ts  ← QB OAuth connect/callback/disconnect
          quickbooks/webhook/route.ts ← QB payment webhook
          quickbooks/sync/route.ts  ← QB manual sync
        ndis/
          proda/plan/route.ts       ← GET/POST participant plan
          proda/claims/route.ts     ← GET/POST NDIS claims
          proda/status/route.ts     ← GET PRODA config status (admin)
        abn/
          lookup/route.ts           ← POST ABN lookup
          verify/route.ts           ← POST worker ABN verify
        email/
          inboxes/route.ts          ← GET/POST AgentMail inboxes
          send/route.ts             ← POST send email
        grocery/
          supplier/sync/route.ts    ← POST admin grocery sync
          supplier/status/route.ts  ← GET grocery supplier status
        chat/
          guardrails/classify/route.ts ← POST classify turn
          guardrails/flags/route.ts    ← GET/PATCH safeguarding flags
        webhooks/
          orb/route.ts              ← POST Orb billing webhook
```

---

## Phase 1: Schema additions

### 1a. Append Prisma models

Append the entire contents of `prisma/additions.prisma` to mapableau-new's
`prisma/schema.prisma`. **Read the file first** — it includes:
- New models: `BecsMandate`, `NdisPlanCache`, `NdisClaim`, `GroceryProduct`,
  `GroceryOrder`, `GroceryOrderItem`, `ChatGuardrailAuditLog`,
  `SafeguardingConcernFlag`, `SafeguardingIncidentDraft`,
  `SafeguardingComplaintDraft`, `SafeguardingConsentRecord`
- Inline comments for **User model field additions** (must be added to the
  existing `User` block, not as a new model)

### 1b. Add User model fields

Add these fields to the existing `User` model in `prisma/schema.prisma`:

```prisma
// Orb usage metering
orbCustomerId        String?
orbSubscriptionId    String?

// QuickBooks Online
qbAccessToken        String?
qbRefreshToken       String?
qbRealmId            String?
qbTokenExpiresAt     DateTime?

// BECS Direct Debit (Stripe AU)
autoDebitEnabled          Boolean   @default(false)
defaultBecsPaymentMethodId String?
autoDebitGraceDays        Int       @default(2)

// Stripe Connect
stripeAccountId       String?
stripeChargesEnabled  Boolean  @default(false)

// Relations
becsMandates     BecsMandate[]
ndisPlanCaches   NdisPlanCache[]
groceryOrders    GroceryOrder[]   @relation("GroceryOrderParticipant")
```

### 1c. Add Worker model fields

Add to the existing `Worker` model:
```prisma
abn         String?
abnVerified Boolean @default(false)
```

### 1d. Add Invoice model fields

Add to the existing `Invoice` / `BillingInvoice` model:
```prisma
qbInvoiceId     String?
qbSyncStatus    String?
qbSyncError     String?
qbLastSyncedAt  DateTime?
orbGenerated    Boolean  @default(false)
```

### 1e. Generate migration

```bash
pnpm prisma migrate dev --name "add-repl-port-models"
```

---

## Phase 2: Install packages

```bash
pnpm add orb-billing
# stripe is already installed in mapableau-new
# (no new packages needed for the other modules — they use standard fetch)
```

---

## Phase 3: Copy library files

Copy the contents of `src/lib/` to mapableau-new's `src/lib/` (or wherever the
project keeps its lib directory). Adjust import paths if mapableau-new uses a
different alias than `@/lib/`.

Key import assumptions:
- `@/auth` — next-auth v5 auth() helper
- `@/lib/db` — Prisma client singleton (`export const prisma = ...`)
- Route handlers use `from "next/server"` (Next.js 15 App Router)

---

## Phase 4: Copy API route handlers

Copy `src/app/api/` to mapableau-new's `src/app/api/`. The route paths are
designed not to conflict with existing mapableau-new routes.

If mapableau-new already has routes at these paths, merge carefully:
- `/api/billing/` — mapableau-new has billing routes; check for conflicts
- `/api/email/` — mapableau-new uses SendGrid; these routes add AgentMail inbox
  management alongside it (not a replacement)

---

## Phase 5: Wire environment variables

See `ENV_MAPPING.md` for the complete mapping.

Key secrets to add in Vercel project settings:
```
ORB_API_KEY
ORB_WEBHOOK_SECRET
NDIS_PRODA_CLIENT_ID
NDIS_PRODA_CLIENT_SECRET
NDIS_PRODA_DEVICE_NAME
NDIS_PRODA_ORG_ID
QB_CLIENT_ID
QB_CLIENT_SECRET
QB_REDIRECT_URI
AGENTMAIL_API_KEY
ABR_GUID
STRIPE_BECS_DISABLED          (set to "1" to disable BECS)
STRIPE_CONNECT_ENABLED        (set to "1" to enable Stripe Connect)
STRIPE_PLATFORM_FEE_BPS       (default 500 = 5%)
CRON_SECRET                   (for auto-debit cron authorization)
```

---

## Phase 6: Configure Vercel Cron (auto-debit)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/billing/auto-debit/tick",
      "schedule": "0 */4 * * *"
    }
  ]
}
```

The endpoint is gated by `Authorization: Bearer <CRON_SECRET>` when
`CRON_SECRET` is set. Vercel Cron automatically includes this header.

---

## Phase 7: Wire SMS alerts for safeguarding

The chat guardrail classifier calls `sendSmsAlert` when a critical safety
category is detected. mapableau-new already has Twilio 2FA; reuse that client:

In `src/app/api/chat/guardrails/classify/route.ts`, replace:
```ts
// Wire to mapableau-new's Twilio SMS service
console.warn("[guardrails] SMS alert (not wired):", message);
```
with:
```ts
import { sendSms } from "@/lib/notifications/twilio"; // adjust path
await sendSms(process.env.SAFEGUARDING_ALERT_PHONE!, message);
```

Set `SAFEGUARDING_ALERT_PHONE` in Vercel environment variables to the on-call
phone number for safeguarding alerts.

---

## Phase 8: Wire Orb events to care and transport completion

Orb usage metering fires when a care session or transport trip is completed.
Add these calls in mapableau-new's care and transport completion handlers:

```ts
// On CareServiceLog completion:
import { ingestCareHoursEvent, orbEnabled } from "@/lib/orb/client";
if (orbEnabled() && user.orbCustomerId) {
  await ingestCareHoursEvent(user.id, hoursDecimal, tierCode, serviceLogId);
}

// On TransportBooking completion:
import { ingestTransportKmEvent, orbEnabled } from "@/lib/orb/client";
if (orbEnabled() && user.orbCustomerId) {
  await ingestTransportKmEvent(user.id, kmDecimal, tierCode, tripId);
}
```

---

## Phase 9: Wire QB sync to invoice lifecycle

QB invoice sync should fire on invoice creation and payment. Add to
mapableau-new's invoice creation server action / route:

```ts
import { pushInvoiceToQb } from "@/lib/billing/quickbooks/sync";
import { qbEnabled } from "@/lib/billing/quickbooks/client";

// After invoice created:
if (qbEnabled() && user.qbAccessToken) {
  await pushInvoiceToQb(prisma, user.id, invoice.id, getUser, getInvoice);
}
```

---

## Phase 10: accessiBe widget (trivial)

Add to mapableau-new's root `layout.tsx`:
```tsx
{process.env.NEXT_PUBLIC_ACCESSIBE_SITE_KEY && (
  <Script
    src="https://acsbapp.com/apps/app/dist/js/app.js"
    strategy="lazyOnload"
    onLoad={() => {
      // @ts-expect-error acsbJS is injected by the script
      window.acsbJS?.init({
        statementLink: "", footerHtml: "",
        hideMobile: false, hideTrigger: false,
        language: "en", position: "left",
        leadColor: "#1B6EB5", triggerColor: "#1B6EB5",
        triggerRadius: "50%", triggerPositionX: "left",
        triggerPositionY: "bottom",
      });
    }}
  />
)}
```

Add `NEXT_PUBLIC_ACCESSIBE_SITE_KEY` to Vercel environment variables.

---

## Decision: QuickBooks alongside Xero

mapableau-new already has Xero. There are two options:

**Option A (recommended):** Keep both integrations. QB users re-auth via
`/api/billing/quickbooks/auth` and continue using QB. Xero users use the
existing Xero flow. The user's accounting integration is determined by whether
`qbRealmId` is set on their User record.

**Option B:** Migrate all QB users to Xero (requires contacting affected
operators, exporting QB data, and re-importing into Xero). Only recommended if
simplifying the codebase is a higher priority than continuity for existing
QB-connected operators.

---

## Decision: Geo map layer infrastructure

The REPL has a layer-based GIS model (map_layers, map_features, map_categories).
mapableau-new has AccessPlace (venue-centric). Two options:

**Option A:** Adopt AccessPlace as the geo model. The REPL's community barrier
reports map to `AccessPlaceReport`; the REPL's map layers map to
`AccessibilityFeature`. This reduces schema surface area.

**Option B:** Port the REPL's layer/feature/category tables as-is. This
preserves the 4-domain-tab map experience but adds ~6 new Prisma models.

The gap analysis recommends evaluating this decision based on whether the
domain-tab UI is a user-facing requirement going forward.
