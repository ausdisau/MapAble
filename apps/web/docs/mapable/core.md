# MapAble Core (main branch)

## `/core` route

The platform hub lives at **`/core`** (`app/core/`).

Supporting directories:

- `components/core/` — shared shell (header, footer, hub cards)
- `lib/platform/core-ui/navigation.ts` — hub links (aligned with routes on this branch)

## Run locally

```bash
pnpm install
pnpm dev
```

Visit [http://localhost:3000/core](http://localhost:3000/core).

## Platform integrations

Open-source engines (MapLibre, Keycloak, Temporal, n8n, Directus, Metabase, FHIR, telehealth, scheduling, ERPNext) connect through `lib/integrations/` with feature flags and admin health at `/admin/integrations`.

Validate optional integration env vars:

```bash
pnpm check:integrations-env
```

See [docs/integrations/environment.md](docs/integrations/environment.md).
