# Import MapAble-Unified from Replit

Source Repl: [MapAble-Unified](https://replit.com/@ausdisau1/MapAble-Unified) (`@ausdisau1`).

`mapableau-new` is the production home of the unified MapAble platform. The Replit **MapAble-Unified** Repl was the earlier integrated shell (auth, module hub, shared schema). Use this guide to pull Repl changes or reconcile drift.

## Quick sync (recommended)

```bash
chmod +x scripts/sync-replit-unified.sh scripts/import-replit-unified.sh
./scripts/sync-replit-unified.sh
```

This imports the Repl (when git or zip is available), then writes a drift report under `/tmp/mapable-unified-sync-report/`.

## Quick import (git or zip)

```bash
./scripts/import-replit-unified.sh
```

If the default remote fails (Replit often requires auth), copy the HTTPS git URL from the Repl’s **Version control** tab and run:

```bash
REPLIT_GIT_URL='https://<your-replit-git-remote>' ./scripts/import-replit-unified.sh
```

Or export a zip from Replit (**⋮ → Download as zip**) and run:

```bash
REPLIT_ZIP_PATH='/path/to/MapAble-Unified.zip' ./scripts/import-replit-unified.sh
./scripts/sync-replit-unified.sh report
```

The script clones into `/tmp/mapable-unified-replit` by default (`IMPORT_DIR` to override).

## Deployment probe

```bash
./scripts/check-replit-unified-deployment.sh
```

Checks `https://mapable-unified.replit.app` (override with `REPLIT_DEPLOY_URL`).

Or import both Care and Unified together:

```bash
./scripts/import-replit-mapable.sh both
```

## What is already in this repo

| Area | Location |
| --- | --- |
| Platform hub | `/core` — `app/core/`, `components/core/`, `lib/platform/core-ui/` |
| Module registry | `app/lib/modules.ts` (Care, Transport, Jobs, Foods, …) |
| Auth & roles | `lib/auth/`, NextAuth routes under `app/api/auth/` |
| Unified schema | `prisma/schema.prisma` (single source of truth) |
| Cross-module flows | `lib/orchestration/`, [cross-module-orchestration.md](../modules/cross-module-orchestration.md) |
| Phases reference | [docs/mapable/core-phases.md](../mapable/core-phases.md) |
| Billing spine | `lib/billing/`, Stripe webhooks under `app/api/stripe/` |

## Merge checklist

1. **Schema** — Treat `prisma/schema.prisma` in this repo as authoritative; diff Repl models and migrate with `prisma migrate dev`, not ad-hoc SQL.
2. **Navigation** — Align Repl hub links with `lib/platform/core-ui/navigation.ts` and `CORE_HUB_SECTIONS`; avoid duplicate `/dashboard` vs module routes.
3. **Modules** — Map Repl module entry points to `app/lib/modules.ts` keys and existing routes (`/care`, `/transport`, `/employment`, …).
4. **Auth** — Consolidate on NextAuth session + `lib/auth/permissions.ts`; do not import parallel auth stacks.
5. **Env** — Merge Repl secrets into `.env.example` categories (see [integrations/environment.md](../integrations/environment.md)).
6. **Verify** — `pnpm type-check`, `pnpm test`, and smoke-test `/core` plus one route per touched module.

## Relationship to other Repls

| Repl | Role in monorepo |
| --- | --- |
| MapAble-Unified | Platform shell, auth, hub, shared schema |
| MapAble-for-Care | Care module depth — see [replit-mapable-for-care-import.md](./replit-mapable-for-care-import.md) |
| MapAble-Transport | Transport module — see [replit-mapable-transport-import.md](./replit-mapable-transport-import.md) (PR #117) |

## Deployment target

Production deploys from `ausdisau/mapableau-new` via Vercel; see [neon.md](./neon.md).

## When automated import is blocked

Cloud agents cannot pass Replit’s Cloudflare challenge. Provide either:

- A **git remote URL** with credentials, or
- A **zip export** from Replit placed in the workspace for a one-off merge.
