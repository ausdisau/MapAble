# MapAble Unified Workspace Router

Status: **draft implementation for code review**, not deployed or publicly enabled.
Repository: `ausdisau/MapAble`, the documented canonical system of record.
Target: the workspace router supplied as an HTML concept on 31 October 2026.

## Decision and implementation boundary

Preserve the original dark, two-column launcher design but implement an internal, accessible web page at `/workspace` inside the existing Next.js application. Preserve the web/mobile separation. Provide actual, allowlisted local process launch scripts **only in a local terminal**. Never claim that browser UI actions started a server or established an Expo tunnel.

## Evidence ledger (inspected 31 October 2026)

| Item | State | Evidence | Consequence |
| --- | --- | --- | --- |
| Unified repository | Verified in repository metadata and README | `ausdisau/MapAble`, `README.md`, `docs/repository-amalgamation.md` | Develop here, not in the migrated standalone repo |
| Imported web history | Documented in repository | import commit `e0a8b6907b25b23eda82fcbc3b722c088861b704` | Display as import provenance, NOT current head or live sync status |
| Web application | Inspected code | `apps/web/package.json`: Next 15, React 18, pnpm | Keep build/install scoped to web |
| Native app | Inspected code | `apps/mobile/package.json`: Expo 57, React 19, npm | Keep separate dependency root |
| Access search integration | Implemented, not live-verified | `apps/web/app/api/access/search/route.ts`; `apps/mobile/src/runtime/mapableApi.ts` | A real read-only API contract can be used for a test search |
| Runtime status | Not established | No authenticated agent/process service supplied | Show not monitored, never fake started or synced |
| Marketplace alpha from former repo | Draft-only in former repo | `ausdisau/mapableau-new` PR #644 | Does not automatically become part of the canonical repository |

## Installed paths

- `apps/web/app/workspace/page.tsx`: authenticated server-side admin route, noindex and fail-closed feature flag.
- `apps/web/components/workspace/UnifiedWorkspaceRouter.tsx`: responsive workspace, command-copy controls, local UI activity and accessible API sandbox.
- `apps/web/lib/workspace/targets.ts`: the two explicit supported app targets and documented repository provenance.
- `apps/web/tests/workspace-router.test.ts`: flag and command allowlist tests.
- `scripts/workspace/dev.mjs`: separate **local-only** Node process manager for web/mobile/both. Does not listen on any network port.
- `scripts/workspace/dev.test.mjs`: allowlist and dry-run tests.

## Enabling the page

1. For local development only, set the **server-side** environment variable `MAPABLE_WORKSPACE_ROUTER_ENABLED=true` in `apps/web/.env.local`. Default is disabled.
2. Sign in as a MapAble admin. The page calls existing `requireAdmin()`; no public visitor, participant, coordinator or ordinary user can access it.
3. Start the web app from the repo root with `corepack enable`, then `pnpm dev:web`.
4. Visit `http://localhost:3000/workspace` after authentication. The browser cannot launch its own hosting process; its controls copy commands and open supported pages.
5. For actual native process orchestration at the repo root use:
   - `node scripts/workspace/dev.mjs web`
   - `node scripts/workspace/dev.mjs mobile`
   - `node scripts/workspace/dev.mjs both`
   - `node scripts/workspace/dev.mjs both --dry-run`
6. End a running local launcher using Ctrl+C in the terminal. Do not expose this runner over HTTP, RPC, a public tunnel or a production server route.

## Contract and data security

- Browser's Access sandbox sends only a user-entered `q` plus fixed `limit=5&sort=relevance` to same-origin `GET /api/access/search`.
- It never asks for or sends device coordinates automatically.
- A returned HTTP response is evidence of a request succeeding, not of verified venue accessibility.
- Data rendering uses React text and encoded parameters, never interpolated `innerHTML`.
- All app launch commands are static allowlisted options, not editable shell input.
- No Google Maps embed API key or third-party script/CDN is used; existing `/access` supplies map/list navigation.
- No billing, Stripe, identity, participant or marketplace controls are modified.
- Logging is labelled **local UI activity**, not a live terminal stream.

## Why the original static HTML cannot be deployed unchanged

- `toggleApp` only flips client-side booleans and writes fabricated Next.js/Metro 'Ready' messages; it never starts or stops a process.
- 'Mono-Repo Sync Active' and 'API Stream Valid' are not backed by health checks.
- `__CODING_CANVAS_MAPS_EMBED_API_KEY__` is a placeholder, not a usable key.
- External Tailwind CDN and inline HTML scripts conflict with production CSP and build conventions.
- `logLine.innerHTML` would become risky if later wired to untrusted logs.
- Browser-side remote shell endpoints would create a dangerous code-execution surface.

## Accessibility and participant rights

Target WCAG 2.2 AA and manual participant-led testing. Keyboard-only navigation, skip link, labelled controls, live-region messages, explicit errors, non-colour status, reduced motion by omission, visible focus, high contrast and responsive reflow are included in the implementation. These still require independent VoiceOver/TalkBack/NVDA, AAC/switch, 200–400% zoom and mobile testing. The landing page is an internal tool; it does not substitute for access to any essential user-facing MapAble service.

## Validation and release gates

Local checks executed for the lightweight process runner:

`node --check scripts/workspace/dev.mjs`
`node --test scripts/workspace/dev.test.mjs`

The Node tests cover `web`, `mobile`, `both`, dry-run and arbitrary target rejection. CI must additionally run `pnpm --dir apps/web exec vitest run tests/workspace-router.test.ts`, focused ESLint/Prettier, full web type-check, existing security checks and accessibility browser tests. Verify results on the *exact final PR head SHA*.

Do not enable in production, modify homepage routing, port former-repo Marketplace PRs, merge, deploy, or change shared auth/payment/data boundaries without an explicit, recorded human release decision.
