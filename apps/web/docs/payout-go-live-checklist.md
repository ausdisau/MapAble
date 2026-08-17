# Go-live checklist — Stripe payouts

## Stripe Dashboard

1. Enable Connect on platform account
2. Configure Express branding
3. Webhook endpoint: `https://<host>/api/webhooks/stripe`
4. Subscribe to payout, transfer, account, checkout, charge, payment_intent events
5. Live API keys in secrets manager

## MapAble configuration

1. `MAPABLE_PAYMENTS_MODE=live`
2. `MAPABLE_PAYOUTS_ENABLED=true`
3. `STRIPE_CONNECT_RETURN_URL` / `REFRESH_URL` production URLs
4. Run migration `20260626120000_payout_ledger`
5. `BILLING_PLATFORM_FEE_BPS` as approved by product

## Verification

1. Run full test-mode demo (`docs/payout-demo.md`)
2. Reconcile Stripe dashboard, internal ledger, CSV export
3. Complete [payout-security-checklist.md](./payout-security-checklist.md)
4. Accounting and legal review before first live transfer

## Known MVP limitations

- No automated transfer reversal on refund
- Xero API placeholder only
- Legacy `Invoice` stack not in payout v1
- Accounts v2 recipient config pending SDK support
