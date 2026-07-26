# Import MapAble-Transport from Replit

Source Repl: [MapAble-Transport](https://replit.com/@ausdisau1/MapAble-Transport) (`@ausdisau1`).

**Deployment URL:** [https://mapabletransport.replit.app](https://mapabletransport.replit.app) — as of the last check this hostname returns Replit’s **“This app isn’t live yet”** page (HTTP 404). The Repl must be **Run → Deploy** (or Reserved VM) before the URL serves app code. You cannot import from the live URL until it is running; use git or a zip export instead.

Check status anytime:

```bash
./scripts/check-replit-transport-deployment.sh
```

This repository (`ausdisau/mapableau-new`) already implements MapAble Transport as part of the monolith. Use this guide when you need to pull changes from the Replit-hosted Repl or reconcile a standalone transport app with production code.

## Quick import (git)

```bash
chmod +x scripts/import-replit-transport.sh
./scripts/import-replit-transport.sh
```

If the default remote fails (Replit often requires auth), copy the HTTPS git URL from the Repl’s **Version control** tab and run:

```bash
REPLIT_GIT_URL='https://<your-replit-git-remote>' ./scripts/import-replit-transport.sh
```

The script clones into `/tmp/mapable-transport-replit` by default (`IMPORT_DIR` to override).

## What is already in this repo

| Area | Location |
| --- | --- |
| Trip scheduling | `lib/transport/`, `app/api/transport/trips/` |
| Legacy bookings | `app/api/transport/bookings/`, `TransportBooking` model |
| Routing | `lib/transport/routing/`, env `TRANSPORT_ROUTING_*` |
| Participant UI | `/dashboard/transport`, `/dashboard/transport/new` |
| Provider / driver | `/provider/transport`, `/driver/trips` |
| Module hub (new) | `/transport` — public module entry aligned with `app/lib/modules.ts` |
| Docs | `docs/modules/transport.md`, `docs/modules/transport-scheduling.md` |

## Merge checklist

1. **Schema** — Diff Replit models against `prisma/schema.prisma` (`TransportTrip`, `TransportBooking`, `DriverProfile`, `Vehicle`).
2. **Auth** — Map Replit users to NextAuth `User` + `UserRoleAssignment` (`transport:read:self`, `transport_operator`, etc.).
3. **API** — Prefer extending `app/api/transport/*` and `lib/transport/transport-response.ts` (permissions + `nextActions`) instead of parallel stacks.
4. **UI** — Port pages into `app/transport/` and `app/dashboard/transport/`; keep `mapableSectionCardClass` / Core shell patterns.
5. **Maps / GPS** — Wire live tracking only with `TRANSPORT_LIVE_TRACKING_ENABLED` and consent; routing stays advisory.
6. **Verify** — `pnpm test tests/transport-scheduling-routing.test.ts` and `docs/qa/phase-3.md`.

## Deployment target

Production for this codebase is documented in [neon.md](./neon.md) (Vercel project linked to `ausdisau/mapableau-new`). Replit Reserved VM deployments are separate; after merge, deploy via the main repo only.

## When automated import is blocked

Cloud agents cannot pass Replit’s Cloudflare challenge. Provide either:

- A **git remote URL** with credentials, or  
- A **zip export** from Replit placed in the workspace for a one-off merge.
