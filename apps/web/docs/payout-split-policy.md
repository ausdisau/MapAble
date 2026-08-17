# Payout split policy

Policies are config-driven via `lib/payouts/config.ts` (`payoutPolicyDefaults`).

## Default pilot settings

- `zeroFeePilotMode: true` — no platform fee deducted
- `useSeparateChargesAndTransfers: true` — no destination charges for multi-recipient bookings
- `releaseMode: service_attestation_required`
- `reviewWindowHours: 24`
- `requireAdminApprovalForHighValuePayout: true` at $1,000 AUD

## Split types

1. Support worker direct share
2. Provider organisation share
3. Transport operator share
4. MapAble platform fee
5. Admin adjustment / reserve / refund (via `adjustmentsCents`, `reserveCents`)

## Block reasons

- Incomplete recipient onboarding
- Missing service attestation
- Open dispute or safeguarding ticket
- `ProviderPayoutHold`
- Active `PayoutBlock`
