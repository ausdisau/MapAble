# Import MapAble-Marketplace from Replit

Source Repl: [MapAble-Marketplace](https://replit.com/@ausdisau1/MapAble-Marketplace) (`@ausdisau1`).

This repository implements the **participant marketplace frontend** at `/marketplace`. Use this guide to pull Repl changes or reconcile a standalone Replit shop with production code.

## Quick import (git)

```bash
chmod +x scripts/import-replit-marketplace.sh
./scripts/import-replit-marketplace.sh
```

If the default remote fails, copy the HTTPS git URL from the Repl’s **Version control** tab:

```bash
REPLIT_GIT_URL='https://<your-replit-git-remote>' ./scripts/import-replit-marketplace.sh
```

Default clone directory: `/tmp/mapable-marketplace-replit` (`IMPORT_DIR` to override).

## What is already in this repo

| Area | Location |
| --- | --- |
| Module hub | `/marketplace` — browse, product detail, cart |
| Catalog (dev) | `lib/marketplace/catalog.ts` — static product list until Prisma model exists |
| Public API | `GET /api/marketplace/products`, `GET /api/marketplace/products/[productId]` |
| Cart + checkout UI | `components/marketplace/MarketplaceClient.tsx` (localStorage cart) |
| Orders / payment | `POST /api/billing/invoices` with `serviceType: "marketplace"` → billing centre |
| Module registry | `app/lib/modules.ts` → `href: "/marketplace"` |
| B2B partner listings | `PartnerMarketplaceListing` + `/admin/partner-marketplace` (Phase 8, flag-gated) |

## Merge checklist

1. **Catalog** — Diff Repl product schema against `lib/marketplace/catalog.ts` or add a `MarketplaceProduct` Prisma model and seed script.
2. **Cart** — Prefer server-side cart session if Repl used DB carts; keep billing invoice as order record.
3. **Checkout** — Route all payments through `lib/billing/core/` (GST, plan-managed export, Stripe checkout).
4. **Copy** — Avoid “NDIS approved” badges; use support item references and plan-manager review language.
5. **UI** — Port pages into `app/marketplace/`; keep layout nav aligned with Care/Transport module shells.
6. **Verify** — `pnpm test tests/marketplace-catalog.test.ts tests/billing-core.test.ts`

## When automated import is blocked

Provide a **git remote URL** with credentials or a **zip export** from Replit.
