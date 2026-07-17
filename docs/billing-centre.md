# MapAble Billing and Invoicing Centre

Participant-safe financial operations layer for Care, Transport, Jobs, Foods, Moves, Marketplace, Academy, provider subscriptions, commissions, and private-pay services.

Canonical UI: **`/billing`** (legacy `/dashboard/billing` redirects here).

## Architecture

| Concern | Source of truth |
|---------|-----------------|
| Workflow (invoices, approvals, disputes, claims packs) | PostgreSQL / Prisma (`BillingInvoice`, centre models) |
| Card payments & subscriptions | Stripe (Checkout, webhooks, Connect) |
| Accounting export | Xero adapter (modular; not live until credentials configured) |
| NDIS price caps | Versioned `PricingPolicy` / `PricingPolicyVersion` / `PricingRule` |
| Service evidence | `BillingServiceRecord` + `BillingServiceEvidence` projecting Care/Transport/etc. |

Amounts are **integer cents** only. Issued invoice amounts are immutable — corrections use credit notes.

## Financial safeguards

- Evidence before billing: charge generation refuses unlocked service records.
- No hardcoded NDIS prices in UI; missing verified policy → `policy_review_required`.
- Explicit invoice state machine with permissioned transitions and audit rows.
- AI Billing Copilot may draft/explain only — never submits claims or releases payouts.
- Official NDIA claiming gateway is **disabled** until credentials and specs are configured.
- Exports containing participant identifiers write audit events.

## Setup

1. Apply migrations: `npx prisma migrate deploy`
2. Generate client: `npx prisma generate`
3. Seed demo scenarios (simulated): `pnpm seed:billing-centre`
4. Configure Stripe / Xero env vars (see `.env.example`)

## Permissions

Billing centre uses `billing:*` permissions (see `lib/auth/permissions.ts`), mapped onto existing roles (`participant`, `family_member` as nominee, `support_worker`, `provider_admin`, `plan_manager`, `mapable_admin`, etc.).

## Simulated vs live

| Integration | Status |
|-------------|--------|
| Stripe Checkout / webhooks | Live when `STRIPE_SECRET_KEY` + webhook secret configured |
| Stripe Connect payouts | Config-gated; provider onboarding required |
| Claims mock / CSV / plan-manager pack | Simulated / export-only |
| Official NDIA submit | Disabled |
| Xero sync | Scaffold + idempotent facade; not live without OAuth |

Demo seed data and claim references are labeled `[SIMULATED]`.

## Key modules

- `lib/billing/` — domain services (money, policy, invoicing, claims, reconciliation, payouts, copilot)
- `lib/billing-core/` — Stripe checkout / Connect / legacy billing helpers
- `app/billing/` — workspaces
- `app/api/billing/` — route handlers
- `types/billing.ts` — shared types

## Tests

```bash
pnpm test tests/billing-money.test.ts tests/billing-state-machine.test.ts tests/billing-policy.test.ts tests/billing-claims-gateway.test.ts tests/billing-permissions.test.ts tests/billing-a11y.test.tsx
```
