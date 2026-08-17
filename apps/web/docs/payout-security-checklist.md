# Payout security checklist

## Environment

- [ ] `STRIPE_SECRET_KEY` server-only
- [ ] `STRIPE_WEBHOOK_SECRET` server-only
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only if client Stripe.js used
- [ ] `MAPABLE_PAYOUTS_ENABLED` set intentionally per environment

## Auth

- [ ] Workers see only their payout splits
- [ ] Provider admins see only their organisation
- [ ] Participants see only their payments
- [ ] Admin money-moving actions require confirmation

## Stripe

- [ ] Webhook signature verification with raw body
- [ ] Idempotency keys on transfer creation
- [ ] No duplicate transfers on retry (same idempotency key)
- [ ] `livemode` mismatch logged

## Data

- [ ] Amounts stored as integer cents
- [ ] No bank account numbers in database or logs
- [ ] No raw card data stored
- [ ] Accounting exports exclude sensitive health data by default

## Payout gates

- [ ] Transfers blocked until service completion
- [ ] Refunds/disputes block unreleased splits
- [ ] No auto-reversal without admin review (MVP)

## Pre-live review

- [ ] Full test-mode E2E demo
- [ ] Webhook reconciliation
- [ ] Access-control audit
- [ ] Accounting / legal review
