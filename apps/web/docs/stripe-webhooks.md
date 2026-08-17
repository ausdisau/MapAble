# Stripe webhooks for payouts

Primary endpoint: `POST /api/webhooks/stripe`

## Requirements

- Raw request body for signature verification
- `STRIPE_WEBHOOK_SECRET` server-only
- Idempotent storage in `BillingStripeWebhookEvent`
- `livemode` logged when mismatched with `MAPABLE_PAYMENTS_MODE`

## Events handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Mark `paid_pending_service` |
| `checkout.session.async_payment_failed` | Mark payment failed |
| `payment_intent.succeeded` | Mark payment received |
| `payment_intent.payment_failed` | Mark failed |
| `charge.refunded` | Block payouts, handle refund workflow |
| `charge.dispute.created` | Block payouts |
| `account.updated` | Sync `PayoutRecipient` + `BillingAccount` |
| `account.external_account.updated` | Audit log |
| `transfer.created` / `transfer.reversed` | Update `PayoutTransfer` |
| `payout.*` | Recipient status + audit |

## Local testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
export STRIPE_WEBHOOK_SECRET=whsec_...
stripe trigger checkout.session.completed
```
