# MapAble payments ledger

Internal ledger for Stripe Connect marketplace payouts. MapAble is the **source of business workflow truth**; Stripe is the **payment processing truth**.

## Terminology

| Term | Meaning |
|------|---------|
| **Charge / PaymentIntent / Checkout** | Money collected from payer on the MapAble platform account |
| **Transfer** | Money moved from MapAble platform balance to a connected account |
| **Payout** | Money moved from connected account Stripe balance to external bank (Stripe-managed) |
| **Platform fee** | MapAble commission retained on platform balance |
| **Transfer group** | Stripe grouping key tying charge, transfers, and ledger rows to one booking |

Never use "escrow" in product copy without legal approval. Use **payout hold**, **pending service payment**, or **transfer pending confirmation**.

## Model map

| Ledger concept | Prisma model |
|----------------|--------------|
| Service payment | `BillingInvoice` + `BillingPayment` |
| Line items | `BillingInvoiceLineItem` |
| Recipient splits | `BillingPaymentSplit` |
| Connected account | `PayoutRecipient` |
| Stripe transfer record | `PayoutTransfer` |
| Batch processing | `PayoutBatch` |
| Active holds | `PayoutBlock` |
| Audit trail | `BillingAuditLog` |
| Accounting export | `AccountingExport` |

## Payout status lifecycle

1. `none` — draft / awaiting payment
2. `paid_pending_service` — paid, awaiting service delivery confirmation
3. `service_completed` — service attested and confirmed
4. `payout_pending` — splits ready for admin transfer
5. `partially_paid_out` / `paid_out` — transfers created

## Split status

`pending_service` → `ready` → `transfer_created` → `transferred`

Blocked paths: `blocked`, `failed`, `reversed`, `canceled`

## Module layout

- `lib/payouts/` — governance layer on top of `lib/billing/core/`
- `lib/stripe/` — Stripe SDK wrappers
- API: `/api/payout-recipients/*`, `/api/payouts/*`, `/api/payments/create-checkout-session`

See also: [billing.md](./billing.md), [stripe-connect-onboarding.md](./stripe-connect-onboarding.md), [stripe-webhooks.md](./stripe-webhooks.md)
