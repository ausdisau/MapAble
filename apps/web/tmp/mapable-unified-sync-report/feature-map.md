# MapAble-Unified (Replit) → mapableau-new feature map

Imported from `G:\Operations\MapAble\UI\MapAble-Unified.zip` on 2026-06-21.

## Stack difference

| Replit MapAble-Unified | mapableau-new |
| --- | --- |
| Express + Vite React | Next.js App Router |
| Drizzle ORM + `migrations/` | Prisma + `prisma/migrations/` |
| wouter routing | Next.js routes |
| `client/src/pages/` | `app/` |
| `server/` API | `app/api/` + `lib/` |

Do not copy files path-for-path. Port **behaviour and schema** into the monorepo stack.

## Replit pages → monorepo targets

| Replit page | Monorepo status |
| --- | --- |
| `care.tsx`, `shifts.tsx` | `/care`, `/care/shifts` — integrated |
| `transport.tsx` | `/transport` — integrated |
| `jobs.tsx`, `job-detail.tsx` | `/dashboard/jobs`, employment routes |
| `dashboard.tsx` | `/dashboard`, `/core` hub |
| `groceries.tsx`, `grocery-*` | `/foods` — coming soon stub only |
| `chat.tsx`, `admin-chat-guardrails.tsx` | `/ask`, care chat — partial |
| `plan-review-prep.tsx` | Not found — candidate import |
| `geo-admin.tsx`, `accessibility-map.tsx` | `/access`, admin geo — partial |
| `budget.tsx`, `pricing.tsx` | billing lib, NDIS pricing — partial |
| `ndis-admin.tsx` | `/admin` NDIS panels — partial |
| `invoices.tsx`, `payment-methods.tsx`, `payouts.tsx` | billing, Stripe Connect — partial |
| `abn-lookup.tsx` | ABN verification service — partial |

## High-value server modules to review

- `server/chat-guardrails.ts` → `lib/care/` or chat safety layer
- `server/grocery-supplier.ts` → future Foods module
- `server/plan-review-brief.ts` → participant plan prep
- `server/orb.ts` → usage metering vs existing billing
- `server/quickbooks.ts` → integrations
- `shared/schema/` → map fields to `prisma/schema.prisma`

## Import locations

- Zip archive: `data/imports/MapAble-Unified.zip` (gitignored)
- Extracted tree: `tmp/mapable-unified-replit/`
- Summary: `tmp/mapable-unified-sync-report/summary.txt`

## Re-run import (Windows)

```powershell
$zip = "G:\Operations\MapAble\UI\MapAble-Unified.zip"
$dest = "C:\Users\jonat\mapableau-new\tmp\mapable-unified-replit"
Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $dest -Force
# flatten MapAble-Unified/ wrapper if present
```
