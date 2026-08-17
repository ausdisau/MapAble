# Accounting reconciliation

## CSV export

`GET /api/payouts/export/[paymentId]` returns reconciliation columns:

- paymentId, bookingId, invoiceNumber
- payerType, fundingSourceType
- grossAmount, platformFee, netTransfer
- stripePaymentIntentId, stripeChargeId, stripeTransferId
- transferGroup, status, timestamps

## Xero

`buildXeroInvoicePayload` and `buildXeroBillOrSpendMoneyPayload` return placeholder payloads until Xero API is configured.

## Rules

- Exports are deterministic
- Stripe IDs included for reconciliation
- NDIS line item codes included when present on line items
- Do not export sensitive disability/health details unless explicitly approved
