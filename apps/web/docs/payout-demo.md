# Payout demo (development)

Route: `/dev/payout-demo` (disabled in production)

## Stripe test mode

1. Set `STRIPE_SECRET_KEY=sk_test_...` and `MAPABLE_PAYMENTS_MODE=test`
2. Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Use test card `4242 4242 4242 4242`

## Seed data

```bash
npx tsx prisma/seed-payouts.ts
```

## Demo flow

1. Create payout recipients via API or seed
2. Create booking payment with `createBookingPayment`
3. Complete Checkout in test mode
4. Attest + confirm service via booking APIs
5. Admin processes transfer at `/admin/payouts`
6. Export CSV from `/api/payouts/export/[paymentId]`

## Reset

Re-run seed or delete test rows in `PayoutRecipient`, `BillingPaymentSplit`, `PayoutTransfer`.
