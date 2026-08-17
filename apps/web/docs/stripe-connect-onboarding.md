# Stripe Connect onboarding

MapAble uses **Stripe Connect Express** accounts for payout recipients (support workers, provider organisations, transport operators).

## Accounts v1 fallback

The installed Stripe SDK uses Express accounts with `controller` properties for transfer-only recipients. Accounts v2 recipient configuration can be adopted when fully supported by the SDK pin.

## Endpoints

| Method | Path |
|--------|------|
| POST | `/api/payout-recipients/create` |
| POST | `/api/payout-recipients/[id]/onboarding-link` |
| GET | `/api/payout-recipients/[id]/status` |
| POST | `/api/payout-recipients/[id]/dashboard-link` |

Legacy provider billing also supports `/api/billing/connect/*`.

## Environment

```env
STRIPE_CONNECT_RETURN_URL=http://localhost:3000/payouts/onboarding/return
STRIPE_CONNECT_REFRESH_URL=http://localhost:3000/payouts/onboarding/refresh
```

## Security

- Onboarding links are returned only to authenticated account holders
- MapAble does not store bank account numbers
- `account.updated` webhook syncs `PayoutRecipient` status

## UI copy

> Stripe handles identity verification and payout details. MapAble does not store your bank account number.
