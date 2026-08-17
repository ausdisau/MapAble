# Cursor ↔ Replit branch sync

Two-branch Git workflow so Replit and Cursor can share work without breaking
either runtime.

| Branch | Role |
| --- | --- |
| `replit-agent` | Replit write branch (Repl default checkout) |
| `cursor-main` | Integration/read branch for Replit to consume Cursor merges |
| `main` | Production truth for Next.js / Vercel; Cursor feature PRs land here |

**Naming constraint:** GitHub rejects a branch literally named `cursor` because
hundreds of `cursor/*` branches exist. The integration branch is **`cursor-main`**.

**Supersedes:** `cursor/replit-agent-main-reconcile-a08f` (stale; do not reuse).

## Dual-runtime map

| Runtime | Entry | Key paths |
| --- | --- | --- |
| Cursor / Vercel (production) | `pnpm dev` → Next 15 | `app/`, `components/`, `lib/`, `prisma/` |
| Replit (dev + autoscale) | `npm run dev` → Express+Vite :5000 | `client/`, Express `server/*`, `shared/`, Drizzle `migrations/`, `.replit` |
| Port layer (Replit → Next) | copy from package | `ports/mapableau-new/` |

Next typecheck allowlists production paths in `tsconfig.json` and excludes the
Replit overlay. Replit root configs are renamed `*.replit.*` so they cannot
override Next Tailwind / Vite / Drizzle config.

## Path ownership (merge conflict rules)

| Path glob | Owner on conflict | Notes |
| --- | --- | --- |
| `app/**`, `components/**`, `lib/**`, `prisma/**`, `tests/**`, `packages/**` | **Cursor** | Next production surface |
| `client/**`, `server/**` (except `server/admin`, `server/agents`, `server/api`), `shared/**`, root `migrations/**` | **Replit** | Express+Vite+Drizzle stack |
| `ports/mapableau-new/**` | **Replit** | Port-ready Next routes; promote into `app/`/`lib/` via Cursor PR |
| `server/admin/**`, `server/agents/**`, `server/api/**` | **Cursor** | CareOS server modules used by Next API routes |
| `.replit`, `replit.md`, `replit.nix`, `attached_assets/**` | **Replit** | Repl config + reference assets |
| `tsconfig.json`, `pnpm-lock.yaml`, `next.config.ts`, `tailwind.config.js` | **Cursor** | Next CI/build |
| `vite.config.replit.ts`, `drizzle.config.replit.ts`, `tailwind.config.replit.ts`, `components.replit.json`, `tsconfig.replit.json`, `package.replit.json`, `scripts/load-env-file.sh`, `.env.replit.example` | **Replit** | Renamed / isolated overlay configs + Cursor-local env loader |
| `package.json` scripts | **Merge both** | Keep `pnpm`/`next` scripts and Replit `dev`/`build` entrypoints |

**Promotion path (Replit → production):** Port through `ports/mapableau-new/`
(see [`ports/mapableau-new/INTEGRATION.md`](../../ports/mapableau-new/INTEGRATION.md)),
then open a Cursor PR into `app/`/`lib/`. Do not merge Replit UI wholesale into
Next routes.

## Out of Replit credits (Cursor-only workaround)

Replit Agent and Secrets edits are **not required**. Run the Express+Vite overlay
in Cursor (or any local Node host) and keep syncing via GitHub.

1. Bootstrap once: `npm run bootstrap:replit-deps`
2. Copy env template (gitignored): `cp .env.replit.example .env.replit`
3. Choose a mode:
   - **UI only:** leave `DATABASE_URL` unset — seed skips, server still serves `:5000`
   - **With data:** set `DATABASE_URL` to the full Supabase (or Neon) Postgres URI in
     `.env.replit` (or Cursor Cloud environment secrets). Host alone is not enough.
4. Run:
   - `npm run dev:replit` → http://127.0.0.1:5000
   - `npm run test:replit`
5. Commit/push to `replit-agent` or open a Cursor PR to `main` as usual.
   When Replit credits return, pull `replit-agent` and paste the same URI into
   Replit Secrets once — no Agent needed for that.

`scripts/run-replit.sh` loads `.env.replit` then `.env` automatically (process
env always wins). Do not commit either file.

## Wire Replit Repl to GitHub (optional until credits return)

In the Repl (**Tools → Version control → GitHub**):

1. Connect `ausdisau/mapableau-new`.
2. Set the default branch to **`replit-agent`**.
3. Pull on start.
4. Bootstrap Replit deps (root `package.json` is the Next app; Replit deps live in `package.replit.json`):
   `npm run bootstrap:replit-deps`
5. Start / test via `.replit` workflows, or:
   - `npm run bootstrap:replit-deps`
   - `npm run dev:replit` (Express+Vite on port 5000)
   - `npm run test:replit` (full suite when `DATABASE_URL`/`NEON_DATABASE_URL` is set; otherwise offline smoke + migration-journal)
   - For seed/data against **Supabase**, set `DATABASE_URL` to the full Postgres URI from Supabase → Project Settings → Database (not just `*.supabase.co`). Neon hosts use the WebSocket driver; Supabase and other Postgres hosts use `pg`. Prefer `.env.replit` in Cursor when Replit Secrets are locked.
6. Push to `origin/replit-agent` after green tests.

### Dual package manifests

| File | Owner | Purpose |
| --- | --- | --- |
| `package.json` + `pnpm-lock.yaml` | Cursor | Next.js / Vercel production |
| `package.replit.json` | Replit | Express+Vite+Drizzle dependency list |

Do **not** overwrite root `package.json` with the Replit manifest. Use
`npm run bootstrap:replit-deps` (installs into `.replit-node_modules/`) and
`npm run dev:replit` / `test:replit` (sets `NODE_PATH` via `scripts/run-replit.sh`).

### Secrets hygiene

- Rotate any Vercel token that was ever committed under `attached_assets/`.
- `.gitignore` blocks `attached_assets/*.key` and `attached_assets/vercelAPI_*.txt`.
- Do not commit `package-lock.json` (ignored; CI uses `pnpm-lock.yaml`).
- Run `./scripts/sync-cursor-replit-branches.sh check-secrets` before push.

## Helper script

```bash
./scripts/sync-cursor-replit-branches.sh report
./scripts/sync-cursor-replit-branches.sh sync-both
./scripts/sync-cursor-replit-branches.sh sync-both --push   # or SYNC_PUSH=1
./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit [--push]
./scripts/sync-cursor-replit-branches.sh push-replit-into-cursor [--push]
./scripts/sync-cursor-replit-branches.sh check-secrets
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

Or via package.json:

```bash
pnpm sync:cursor-replit -- report
pnpm sync:cursor-replit:both
pnpm sync:cursor-replit:both:push
```

`sync-both` is the default day-to-day bridge command: secret-scan, merge
`cursor-main` → `replit-agent`, then `replit-agent` → `cursor-main`, under the
path-ownership matrix. Equal tips are a no-op. `--push` / `SYNC_PUSH=1` pushes
both branches after a successful sync. `report` exits non-zero when path drift
remains.

## Day-to-day commands

### Bidirectional sync (preferred)

```bash
git fetch origin
./scripts/sync-cursor-replit-branches.sh sync-both --push
# Replit overlay:
npm run test:replit
# Cursor / Next surface (when Cursor-owned paths changed):
pnpm type-check && pnpm test
```

### Replit ← Cursor only

```bash
git fetch origin
./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit --push
npm run test:replit
```

### Cursor ← Replit only

```bash
git fetch origin
./scripts/sync-cursor-replit-branches.sh push-replit-into-cursor --push
pnpm type-check && pnpm test
```

`cursor-main` is the integration branch for the bridge — **not** Vercel
production. To ship Replit work to production, promote through
`ports/mapableau-new/` into a Cursor PR against `main`, then refresh:

```bash
# after PR merges to main
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

### After any merge to `main`

```bash
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

This fast-forwards (or merges) `cursor-main` and `replit-agent` to `origin/main`
and pushes both.

## CI drift advisory + human-gated sync

Workflow: `.github/workflows/sync-cursor-replit-branches.yml`

- **Push / weekly schedule:** runs `report` only (fails the job when path drift > 0;
  uploads the report artifact). Does **not** auto-merge.
- **`workflow_dispatch`:** human-gated actions —
  `report`, `check-secrets`, `pull-cursor-into-replit`, `push-replit-into-cursor`,
  `sync-both`, `refresh-from-main`. Merge/refresh actions run `check-secrets`
  first, then `SYNC_PUSH=1`.

Never auto-merge into production `main` from this workflow.

## Related docs

- [replit-imports.md](./replit-imports.md) — Repl zip/git import scripts
- [replit-mapable-unified-import.md](./replit-mapable-unified-import.md) — Unified shell merge checklist
- [design/imports/replit-mapable-integration-map.html](../../design/imports/replit-mapable-integration-map.html) — UI asset map
