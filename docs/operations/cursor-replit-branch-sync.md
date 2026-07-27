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
| `vite.config.replit.ts`, `drizzle.config.replit.ts`, `tailwind.config.replit.ts`, `components.replit.json`, `tsconfig.replit.json`, `package.replit.json` | **Replit** | Renamed / isolated overlay configs |
| `package.json` scripts | **Merge both** | Keep `pnpm`/`next` scripts and Replit `dev`/`build` entrypoints |

**Promotion path (Replit → production):** Port through `ports/mapableau-new/`
(see [`ports/mapableau-new/INTEGRATION.md`](../../ports/mapableau-new/INTEGRATION.md)),
then open a Cursor PR into `app/`/`lib/`. Do not merge Replit UI wholesale into
Next routes.

## Wire Replit Repl to GitHub

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
   - For seed/data against **Supabase**, set `DATABASE_URL` to the full Postgres URI from Supabase → Project Settings → Database (not just `*.supabase.co`). Neon hosts use the WebSocket driver; Supabase and other Postgres hosts use `pg`.
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
./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit
./scripts/sync-cursor-replit-branches.sh push-replit-into-cursor
./scripts/sync-cursor-replit-branches.sh check-secrets
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

Or via package.json: `pnpm sync:cursor-replit -- report`.

## Day-to-day commands

### Replit pulls Cursor work

```bash
git fetch origin
./scripts/sync-cursor-replit-branches.sh pull-cursor-into-replit
# or: git merge origin/cursor-main
npm install
npx tsx --test server/__tests__/*.test.ts
git push origin replit-agent
```

### Cursor integrates Replit work

```bash
git fetch origin
git checkout -b cursor/replit-sync-$(date +%Y%m%d)-a08f origin/main
git merge origin/replit-agent
# resolve using path ownership matrix above
pnpm type-check && pnpm test
# open PR → main; then refresh sync branches
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

### After any merge to `main`

```bash
./scripts/sync-cursor-replit-branches.sh refresh-from-main
```

This fast-forwards (or merges) `cursor-main` and `replit-agent` to `origin/main`
and pushes both.

## CI drift advisory

Workflow: `.github/workflows/sync-cursor-replit-branches.yml`

- Runs weekly and on pushes to `replit-agent` / `cursor-main`
- Produces a drift report artifact
- **Does not auto-merge** — human gate for cross-stack merges

## Related docs

- [replit-imports.md](./replit-imports.md) — Repl zip/git import scripts
- [replit-mapable-unified-import.md](./replit-mapable-unified-import.md) — Unified shell merge checklist
- [design/imports/replit-mapable-integration-map.html](../../design/imports/replit-mapable-integration-map.html) — UI asset map
