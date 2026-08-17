# Act layer (CSNN Sprint 4)

Flag-gated execution surface for **draft** NDIS billing calculations, honest export packs, and Agent-to-Human (A2H) handoffs from the AURA harness.

## Flags (default off)

| Flag | Role |
|---|---|
| `MAPABLE_ACT_LAYER_ENABLED` | NDIS item draft calculator + timesheet draft amounts + PM/Xero export pack enrichment |
| `MAPABLE_A2H_HANDOFF_ENABLED` | Create `ActHandoff` on AURA `HITL_PENDING` (also requires `MAPABLE_AURA_HARNESS_ENABLED`) |

## What Act does

- Calculates support-item **draft** line items (`draft_requires_review`) for example codes:
  - `10_016_0102_5_3` (employment support)
  - `02_051_0108_1_1` (general transport)
- Produces non-zero timesheet → invoice draft amounts when the Act flag is on
- Emits plan-manager / Xero **export packs** with `status: export_pack_ready` (not live sync)
- Opens A2H handoffs from AURA HITL via in-app `createNotification` (no Firebase/FCM)
- Resolve API writes `HITL_APPROVED` / `HITL_REJECTED` memory — **never** auto-executes billing writes

## What Act does **not** do

- Live Xero OAuth invoice sync as source of truth
- Live NDIA / PACE claim submit
- Automated claim or payment approval (**permanent_prohibit** — see NDIS regulatory gate matrix)
- Silent book / bill

## Ownership

Canonical owner: `lib/act/**`. Billing Centre (`lib/billing/**`) remains invoice SoT; Act drafts feed human review paths only.
