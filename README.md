# MapAble

Disability support platform — care, transport, bookings, billing, and participant-facing services. Built with Next.js (App Router), TypeScript, PostgreSQL, and Prisma.

## Getting started

### Prerequisites

- Node.js 18+
- pnpm 10.12.1+
- PostgreSQL (local or [Neon](docs/operations/neon.md))

### Install and run

```bash
pnpm install
cp .env.example .env   # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate deploy
npx prisma db seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Platform hub: [http://localhost:3000/core](http://localhost:3000/core).

Seed users (see [core phases — Phase 1](docs/mapable/core-phases.md#phase-1)): `participant@mapable.test`, `admin@mapable.test`.

### Cursor cloud agent setup

Before running build, type-check, lint or tests in a fresh cloud agent, install
dependencies from the lockfile and generate Prisma Client:

```bash
pnpm setup:cloud-agent
```

This runs `pnpm install --frozen-lockfile` followed by `prisma generate`.

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Production server |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm type-check` | TypeScript |
| `pnpm test` | Vitest |
| `pnpm setup:cloud-agent` | Install locked dependencies and generate Prisma Client for cloud agents |
| `pnpm check:integrations-env` | Validate optional integration env vars |

### Database

The data model lives in a single schema: `prisma/schema.prisma`. Apply changes with `npx prisma migrate deploy` (or `npx prisma db push` in local dev).

## Project layout

```
.
├── app/                      # Next.js App Router
│   ├── api/                  # Route handlers (REST, webhooks, transport, care, …)
│   ├── admin/                # Admin console (bookings, care, transport, governance, …)
│   ├── dashboard/            # Participant dashboard (bookings, care, cases, safety, …)
│   ├── provider/             # Provider portal
│   ├── care/                 # Care module pages
│   ├── core/                 # Platform hub (/core)
│   ├── access/               # Accessible places
│   ├── driver/, worker/      # Field worker UIs
│   └── …                     # employer, plan-manager, assessor, billing, …
├── components/               # React UI (admin, care, transport, core shell, …)
├── lib/                      # Domain logic (~165 packages: auth, billing, care, cases, …)
│   ├── auth/                 # Sessions, permissions, roles
│   ├── integrations/       # Keycloak, Temporal, n8n, Directus, …
│   ├── transport/              # Trips, dispatch, eligibility
│   ├── transport-routing/        # OSRM / routing adapters
│   ├── cases/                  # Case management + AI engine
│   ├── intelligence/            # CareOS and synthetic Intelligence Mainframe
│   └── …
├── prisma/
│   ├── schema.prisma         # Unified PostgreSQL schema
│   ├── migrations/           # SQL migrations
│   └── seed*.ts              # Seed scripts
├── docs/
│   ├── mapable/              # Core hub, phases 1–12, Cursor prompts
│   ├── modules/              # Feature guides (care, transport, cases, …)
│   ├── operations/           # Neon, ops notes
│   ├── integrations/         # Env var reference
│   ├── intelligence/           # Intelligence Mainframe synthetic-mode guidance
│   └── qa/                   # QA checklists
├── apps/
│   └── realtime-server/      # Socket.IO server (pnpm workspace)
├── mcp/
│   └── av/                   # Autonomous-vehicle MCP server
├── mobile-contracts/         # Mobile API / screen contracts
├── tests/                    # Vitest (`*.test.ts`)
├── types/                    # Shared TypeScript types
├── scripts/                  # CLI helpers (Neon env, integrations check, …)
├── data/
│   └── imports/              # Access KML/GeoJSON imports (often gitignored)
├── public/                   # Static assets
└── schemas/                  # JSON validation schemas
```

Config at repo root: `package.json`, `tsconfig.json`, `next.config.ts`, `middleware.ts`, `vercel.json`, `vitest.config.ts`.

## Documentation

Detailed guides live under `docs/`. This file is the only project README at the repository root.

### Platform

| Doc | Description |
| --- | --- |
| [docs/mapable/core.md](docs/mapable/core.md) | `/core` hub and integrations |
| [docs/mapable/ui.md](docs/mapable/ui.md) | Core UI shell |
| [docs/mapable/core-phases.md](docs/mapable/core-phases.md) | Phases 1–12 — routes, models, deploy |
| [docs/mapable/cursor-prompts-phases-6-10.md](docs/mapable/cursor-prompts-phases-6-10.md) | Cursor prompt packs (phases 6–10) |
| [docs/mapable/cursor-five-year-masterplan.md](docs/mapable/cursor-five-year-masterplan.md) | Cursor five-year strategic masterplan |

### Modules

| Doc | Description |
| --- | --- |
| [docs/modules/bookings.md](docs/modules/bookings.md) | Bookings foundation |
| [docs/modules/care.md](docs/modules/care.md) | Care MVP |
| [docs/modules/case-management.md](docs/modules/case-management.md) | Case management (AI-assisted) |
| [docs/modules/calendar.md](docs/modules/calendar.md) | Unified calendar |
| [docs/modules/consent.md](docs/modules/consent.md) | Consent model |
| [docs/modules/cross-module-orchestration.md](docs/modules/cross-module-orchestration.md) | Cross-module flows |
| [docs/modules/incidents.md](docs/modules/incidents.md) | Incident reporting |
| [docs/modules/jobs.md](docs/modules/jobs.md) | Inclusive jobs |
| [docs/modules/privacy-and-audit.md](docs/modules/privacy-and-audit.md) | Privacy and audit |
| [docs/modules/provider-capacity.md](docs/modules/provider-capacity.md) | Provider capacity |
| [docs/modules/transport.md](docs/modules/transport.md) | Transport module |
| [docs/modules/transport-scheduling.md](docs/modules/transport-scheduling.md) | Transport scheduling |
| [docs/modules/accessibility.md](docs/modules/accessibility.md) | Accessibility profiles |
| [docs/modules/admin-dashboard.md](docs/modules/admin-dashboard.md) | Admin dashboard |

Phase 2 and Phase 4 capabilities (messaging, documents, matching, timesheets, Stripe/Xero placeholders, etc.) are documented in [core phases](docs/mapable/core-phases.md#phase-2) and [phase 4](docs/mapable/core-phases.md#phase-4).

### Operations and integrations

| Doc | Description |
| --- | --- |
| [docs/design-system.md](docs/design-system.md) | UI tokens, components, module accents, maps |
| [docs/operations/neon.md](docs/operations/neon.md) | Neon Postgres |
| [docs/operations/replit-imports.md](docs/operations/replit-imports.md) | Import MapAble Repls (Care, Unified, Transport, Marketplace) |
| [docs/billing.md](docs/billing.md) | Billing |
| [docs/integrations/environment.md](docs/integrations/environment.md) | Integration environment variables |
| [docs/safety.md](docs/safety.md) | Safety and incident centre |
| [docs/av-mcp.md](docs/av-mcp.md) | AV / MCP transport |
| [docs/ndia-provider-claiming.md](docs/ndia-provider-claiming.md) | NDIA provider claiming |
| [docs/ROUTING_SLUGS.md](docs/ROUTING_SLUGS.md) | Route slugs |

### QA and mobile

| Doc | Description |
| --- | --- |
| [docs/qa/phase-3.md](docs/qa/phase-3.md) | Phase 3 QA checklist |
| [mobile-contracts/MOBILE_APP_ARCHITECTURE.md](mobile-contracts/MOBILE_APP_ARCHITECTURE.md) | Mobile architecture |
| [mobile-contracts/MOBILE_SCREEN_MAP.md](mobile-contracts/MOBILE_SCREEN_MAP.md) | Mobile screen map |

## Code quality

ESLint, Prettier, Husky, and lint-staged run on commit. See `package.json` scripts.

## Import MapAble-Transport (Replit)

To pull the standalone Repl [@ausdisau1/MapAble-Transport](https://replit.com/@ausdisau1/MapAble-Transport) for comparison or merge, see [docs/operations/replit-mapable-transport-import.md](docs/operations/replit-mapable-transport-import.md) and run `./scripts/import-replit-transport.sh`. The module entry in this app is `/transport`.

## Data imports (Access)

Legacy place data for admin import lives under `data/imports/` (often gitignored when large). Copy `MapAble.kml` or `accessible_locations_merged.geojson` from operations storage, or use **Admin → Access → Import**. GeoJSON expects a FeatureCollection with Point features and properties such as `name`, `category`, or `address`.

## License

ISC
