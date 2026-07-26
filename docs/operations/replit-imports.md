# Replit imports (MapAble)

Guides for pulling code from `@ausdisau1` Repls into `ausdisau/mapableau-new`.

| Repl | Script | Ops doc |
| --- | --- | --- |
| [MapAble-for-Care](https://replit.com/@ausdisau1/MapAble-for-Care) | `scripts/import-replit-care.sh` | [replit-mapable-for-care-import.md](./replit-mapable-for-care-import.md) |
| [MapAble-Unified](https://replit.com/@ausdisau1/MapAble-Unified) | `scripts/sync-replit-unified.sh` | [replit-mapable-unified-import.md](./replit-mapable-unified-import.md) |
| [MapAble-Transport](https://replit.com/@ausdisau1/MapAble-Transport) | `scripts/import-replit-transport.sh` | [replit-mapable-transport-import.md](./replit-mapable-transport-import.md) |
| [MapAble-Marketplace](https://replit.com/@ausdisau1/MapAble-Marketplace) | `scripts/import-replit-marketplace.sh` | [replit-mapable-marketplace-import.md](./replit-mapable-marketplace-import.md) |

## Import both Care and Unified

```bash
chmod +x scripts/import-replit-*.sh scripts/import-replit-mapable.sh
./scripts/import-replit-mapable.sh both
```

With per-Repl git remotes (when Replit auth is required):

```bash
REPLIT_CARE_GIT_URL='https://...' \
REPLIT_UNIFIED_GIT_URL='https://...' \
./scripts/import-replit-mapable.sh both
```

## Getting a git remote from Replit

1. Open the Repl in the browser.
2. **Tools → Version control**.
3. Copy the HTTPS git URL (or connect GitHub and push, then clone from GitHub).
4. Re-run the import script with `REPLIT_GIT_URL` or the per-Repl override.

## Automated import limits

Cloud agents and CI cannot pass Replit’s Cloudflare challenge. Clones fail with HTTP 403 until you provide an authenticated git URL or a zip export.

## After clone

Each ops doc lists merge targets and verification commands. Prefer extending existing `app/`, `lib/`, and `prisma/schema.prisma` paths over adding parallel stacks.

## Integrated in this repo (without Replit clone)

The monorepo already wires the Unified shell and Care module:

| Repl concept | Monorepo location |
| --- | --- |
| MapAble-Unified hub | `/core`, `lib/platform/core-ui/navigation.ts`, `components/core/` |
| MapAble-for-Care | `/care`, `lib/care/`, `app/api/care/` |
| MapAble-Transport | `/transport`, `lib/transport/` (see transport import doc) |
| MapAble-Marketplace | `/marketplace`, `lib/marketplace/`, checkout via billing-core |

Module registry links in `app/lib/modules.ts` resolve to live routes (`/care`, `/transport`, `/marketplace`, `/dashboard/jobs`, plus coming-soon stubs for Foods/Moves/Kids).

Verify: `pnpm test tests/mapable-core-ui.test.ts tests/module-routes.test.ts tests/marketplace-catalog.test.ts tests/care-mvp.test.ts`
