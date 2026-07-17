# MapAble Core Billing Service

Stripe-powered billing for private pay, self-managed NDIS, co-pays, provider subscriptions, and marketplace transactions. NDIS **plan-managed** funding never uses Stripe Checkout — invoices are exported to plan managers (CSV / email-ready JSON; Xero scaffold).

## Stripe SDK (`lib/stripe/`)

Server-only Stripe Node SDK (pinned API version in `lib/stripe/client.ts`):

| Module | Purpose |
|--------|---------|
| `config.ts` | `STRIPE_SECRET_KEY`, webhook secret, price IDs |
| `checkout.ts` | Payment & subscription Checkout sessions |
| `payment-intents.ts` | Legacy `Invoice` payment intents |
| `connect.ts` | Express Connect accounts & onboarding links |
| `portal.ts` | Customer Billing Portal |
| `webhooks.ts` | Signature verification + billing-core & legacy dispatch |
| `index.ts` | Public exports |

**Enable legacy routes:** `STRIPE_SECRET_KEY` + `BILLING_ENABLE_STRIPE=true` or `STRIPE_ENABLED=true`.  
**Billing-core routes:** only require `STRIPE_SECRET_KEY`.

## Architecture

- **Stripe** — payment processing truth (Checkout, Connect, Customer Portal, webhooks).
- **PostgreSQL (Prisma)** — business workflow truth (`BillingInvoice`, `BillingPayment`, `BillingFundingSource`, etc.).
- **Amounts** — integer cents only.
- **Audit** — every material change writes `BillingAuditLog`.
- **PCI** — no card data stored locally; use Stripe-hosted Checkout and Billing Portal.

## Payment flows

### Plan-managed NDIS

1. Participant adds funding source `ndis_plan_managed`.
2. Invoice created in `draft` / `issued`.
3. `POST /api/billing/checkout` returns instructions (no Checkout URL).
4. `POST /api/billing/invoices/export` with `format: csv` or `plan_manager`.

### Self-managed / private card

1. Funding source `ndis_self_managed` or `private_card`.
2. `POST /api/billing/checkout` creates Stripe Checkout (AUD).
3. Webhook `checkout.session.completed` marks invoice `paid` — **never** trust redirect alone.

### Single provider + Connect

When the provider has `stripeConnectedAccountId`, Checkout uses a destination charge:

- `application_fee_amount` = `platformFeeCents`
- `transfer_data.destination` = connected account

### Multiple providers

`providerSplits` on invoice create records `BillingPaymentSplit` rows; separate charges/transfers are stubbed for a later release.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/billing/funding-sources` | List / create funding sources |
| GET/POST | `/api/billing/invoices` | List / create draft invoices |
| POST | `/api/billing/checkout` | Stripe Checkout or plan-managed instruction |
| POST | `/api/billing/connect/create-account` | Express Connect account + onboarding link |
| POST | `/api/billing/connect/onboarding-link` | Refresh onboarding |
| POST | `/api/billing/subscriptions/checkout` | Provider Pro / Employer Pro subscription Checkout |
| POST | `/api/billing/customer-portal` | Stripe Billing Portal URL |
| POST | `/api/billing/invoices/export` | CSV / plan-manager JSON / Xero scaffold |
| POST | `/api/webhooks/stripe` | Signed webhook (raw body) |
| GET | `/api/admin/billing/invoices` | Admin search + flagged list |

## Environment variables

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_CONNECT_CLIENT_ID=
STRIPE_PROVIDER_PRO_PRICE_ID=
STRIPE_EMPLOYER_PRO_PRICE_ID=
BILLING_PLATFORM_FEE_BPS=1000
BILLING_GST_BPS=1000
```

Enable Stripe in development by setting `STRIPE_SECRET_KEY` (and optionally `BILLING_ENABLE_STRIPE=true` for legacy phase-2 guards).

## Webhook setup

1. Stripe Dashboard → Developers → Webhooks → Add endpoint: `https://<host>/api/webhooks/stripe`
2. Events: `checkout.session.*`, `payment_intent.*`, `charge.refunded`, `charge.dispute.created`, `invoice.*`, `customer.subscription.*`, `account.updated`
3. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Local testing (Stripe CLI)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
export STRIPE_WEBHOOK_SECRET=whsec_...
stripe trigger checkout.session.completed
```

## UI

- `/billing` — **Billing & Invoicing Centre** (canonical): overview, invoices, service records, claims, approvals, payments, reconciliation, provider payouts, subscriptions, disputes, credit notes, reports, policy, integrations, settings. See [billing-centre.md](./billing-centre.md).
- `/dashboard/billing` — redirects to `/billing/overview` (compatibility)
- `/dashboard/billing/funding` — billing-core funding sources
- `/dashboard/billing/legacy` — Phase 2 `Invoice` drafts
- `/provider/billing` — Connect onboarding + subscription
- `/admin/billing` — search and flagged payments

## Production checklist

- [ ] Live Stripe keys in secrets manager
- [ ] Webhook endpoint on production URL with signature verification
- [ ] Connect platform settings and OAuth client ID
- [ ] Price IDs for Provider Pro / Employer Pro
- [ ] Database migration applied (`prisma db push` or migrate)
- [ ] Monitor `BillingStripeWebhookEvent` for unprocessed rows
- [ ] Reconciliation job for `BillingPaymentSplit` transfers (future)

## Security

- Secret keys only in server env / `lib/stripe/client.ts`
- Webhook raw body + `constructEvent`
- Idempotent `stripeEventId` storage
- No client-side payment confirmation

## Accessibility

Participant billing UI targets WCAG 2.2 AA: semantic headings, `aria-live` status, visible focus rings, minimum 44px tap targets, screen reader labels on totals and status.

## Future: AbilityPay

Models are prefixed `Billing*` and modular under `lib/billing-core/` so plan-management and AbilityPay can extend exports and funding rules without replacing Stripe primitives.

## Payout system

Governed marketplace payouts (separate charges + transfers) live in `lib/payouts/`. See [payments-ledger.md](./payments-ledger.md), [stripe-connect-onboarding.md](./stripe-connect-onboarding.md), and [payout-demo.md](./payout-demo.md).
