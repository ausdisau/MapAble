# Wave 0 Stabilisation — Findings and Decisions

**Status:** Wave 0 merged via PR #377; repair on `cursor/wave0-stabilisation-repair-2794`

**Base:** `origin/main` @ `b18fbf63` (merge of #377)

**FindingStatus vocabulary:** `verified` | `likely` | `needs_runtime_verification` | `not_present` | `already_remediated`

Wave 0 is controlled-pilot stabilisation only. It does **not** mark any capability `production_ready`. Feature flags are not assurance.

## Protected controlled-pilot slice

In scope for protection (not new product work):

1. Public Accessibility Map
2. Provider Finder
3. Registration and authentication
4. Participant-controlled accessibility preferences and consent
5. Care and transport request intake
6. Manual provider/admin review
7. Participant confirmation, cancellation and audit history

Explicitly remain disabled / unclaimed: live NDIA claim submission; automatic payments or invoice approval; autonomous worker/driver assignment; autonomous safeguarding; AI eligibility/accreditation/safety decisions; production claims for synthetic/mock/scaffold/pilot capabilities; new civic/marketplace/OS/AI-agent domains.

## Decisions

| Topic               | Decision                                                                                                              | Status   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- |
| Canonical host      | Provisional apex `https://mapable.com.au` (absorb PR #344 TLS evidence; www cert renewal is account-owner)            | verified |
| Route compatibility | Permanent redirect `/jobs` → `/employment`                                                                            | verified |
| Dependency audit    | `pnpm ci:prod-audit` fails on unresolved high/critical prod findings; allowlist in `security/advisory-allowlist.json` | verified |
| Capability flags    | Enabling flags fail closed (`=== "true"`); safety gates remain fail-open                                              | verified |
| Security headers    | Baseline headers + CSP-Report-Only; HSTS left to Vercel                                                               | verified |
| Prisma              | No schema or migration changes in Wave 0                                                                              | verified |
| CODEOWNERS          | `@ausdisau` (user owner); teams deferred until GitHub Organisation exists                                             | verified |

## Production environment validation contract

Validators live in `lib/config/canonical-url.ts`. Deployment enforcement is **not** limited to the manual integration-env script:

- `assertDeployedProductionEnv()` in `lib/env/assert-deployed-production-env.ts`
- Invoked from `next.config.ts` (build) and `instrumentation.ts` (Node runtime)
- Enforced when `VERCEL=1` and `VERCEL_ENV=production`, or when `MAPABLE_ENFORCE_PRODUCTION_ENV=true`
- Local / CI / Vercel preview remain usable unless the enforce flag is set

When enforced, validation requires:

| Variable                               | Rule                                                                                                       |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` | At least one required; https only; no localhost/127.0.0.1; no embedded credentials; must match if both set |
| `DATABASE_URL`                         | Required; `postgresql://` / `postgres://`; not localhost on Vercel                                         |
| `DIRECT_URL`                           | Required; same URL shape rules as `DATABASE_URL`                                                           |
| `NEXTAUTH_SECRET`                      | Required (≥16 chars); preview may use `MAPABLE_PREVIEW_AUTH_SECRET`                                        |

Secret values are never printed. Canonical public origin: `lib/config/canonical-url.ts` → metadataBase, robots, sitemap, Open Graph, JSON-LD (`lib/config/json-ld.ts`), and `getAppBaseUrl()`.

## Route compatibility

- Canonical public module: `/employment`
- Compatibility: `/jobs` → `/employment` (permanent)
- Sitemap / marketing nav already use `/employment`
- Accessibility CI inventory updated to `/employment`

## Security advisory exceptions

File: [`security/advisory-allowlist.json`](../../security/advisory-allowlist.json)

Each exception must include: advisory ID, package, path, rationale, owner, compensating control, expiry date. Expired entries fail CI. Wave 0 lands with an **empty** exceptions list after Next.js 15.5.20 + pnpm overrides remediated high production findings.

## Rollback procedure

1. Revert the Wave 0 merge commit (`b18fbf63`) and any subsequent repair merge on `main` (git-safe; no Prisma migrations in Wave 0).
2. `/jobs` returns to 404 until redirect is restored.
3. Capability flags revert to prior fail-open defaults if the revert includes those files.
4. Security headers, deploy-path env gate, and audit gate disappear with the revert.
5. Account-owner Vercel env/domain changes (if applied) must be rolled back separately in the Vercel dashboard.

## Open PR recommendations

| PR                       | Recommendation                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| #344 canonical apex      | **Supersede** (canonical decision absorbed). Optionally retarget to LoginClient network-error UX only. |
| #345 secret scan         | **Leave separate** — no material overlap.                                                              |
| #366 profile avatar      | Leave separate.                                                                                        |
| #371 a11y panel          | Leave separate (product).                                                                              |
| #372 access independence | Leave separate (conflicting; includes migrations — out of Wave 0).                                     |

Do not merge, close, or mark ready from this Wave 0 agent unless separately instructed.

## Account-owner checklist (GitHub / Vercel)

These are human operations — not performed by Wave 0 code:

### GitHub branch protection (`main`)

- [ ] Require a pull request before merging
- [ ] Require at least one independent approving review
- [ ] Dismiss stale pull request approvals when new commits are pushed
- [ ] Require status checks to pass: **CI**, **Migrations**, **Security**, **Accessibility**, **Production claims**
- [ ] Require **Vercel Preview** when the integration is operational
- [ ] Do not allow unrecorded administrator bypass of required checks
- [ ] Do not enable auto-merge for remediation / production-impacting PRs
- [ ] Require branches to be up to date when feasible

### CODEOWNERS / organisation

- [ ] Immediate: CODEOWNERS uses `@ausdisau` (done in Wave 0)
- [ ] Longer-term: create a GitHub Organisation and teams (`mapable-maintainers`, `mapable-security`, `mapable-privacy`, `mapable-safeguarding`, `mapable-billing`) and restore team-based CODEOWNERS

### Vercel / DNS / TLS

- [ ] Renew / re-issue TLS for `www.mapable.com.au`
- [ ] Keep www → apex redirect after www cert is valid
- [ ] Set production env: `NEXTAUTH_URL=https://mapable.com.au`
- [ ] Set production env: `NEXT_PUBLIC_APP_URL=https://mapable.com.au`
- [ ] Confirm `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) for production
- [ ] Confirm `NEXTAUTH_SECRET` ≥ 16 characters, stable, private
- [ ] For Accessibility Map pilot: set `MAP_INTEGRATION_ENABLED=true` and `OPENSTREETMAP_ENABLED=true` only when intended

## Follow-up production-readiness waves

| Wave | Focus                                                                                                                                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Migration baseline and deploy-from-zero proof (remove migrate-from-zero `continue-on-error` debt)                                                                           |
| 2    | Authentication, tenancy and durable break-glass                                                                                                                             |
| 3    | Consent and disclosure canonicalisation                                                                                                                                     |
| 4    | Core golden-journey E2E and authenticated accessibility (Playwright seeds; NVDA; VoiceOver; TalkBack; keyboard-only; 200%/400% zoom; Windows High Contrast; reduced motion) |
| 5    | Distributed rate limits, observability, SLOs and recovery                                                                                                                   |
| 6    | Controlled-pilot release evidence                                                                                                                                           |

## Accessibility follow-up (prepare only — Wave 4)

- Authenticated Playwright seeds
- NVDA / VoiceOver / TalkBack
- Keyboard-only journeys
- 200% and 400% zoom/reflow
- Windows High Contrast
- Reduced motion

No WCAG conformance claim is made by Wave 0.

## Verification notes (repair branch — agent environment)

Ephemeral Postgres: `postgresql://postgres:postgres@localhost:5432/mapable_ci` (same shape as GitHub CI). Commands re-run after repair edits; skipped steps are **not** recorded as pass.

| Check                            | Result                        | Notes                                                                                        |
| -------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile` | pass                          |                                                                                              |
| `prisma validate` / `generate`   | pass                          |                                                                                              |
| `type-check`                     | pass                          |                                                                                              |
| `format:check`                   | pass                          | Prettier on scoped Wave 0 paths                                                              |
| `git diff --check`               | pass                          |                                                                                              |
| `lint`                           | pass                          | app/components/lib/schemas/scripts/ci                                                        |
| `lint:tests`                     | **pre-existing fail on main** | 46-error backlog; not expanded. New/changed tests linted directly with ESLint (pass)         |
| `pnpm ci:prod-audit`             | pass                          | empty allowlist; fail-closed parser                                                          |
| `pnpm build`                     | pass                          | `NODE_OPTIONS=--max-old-space-size=8192`                                                     |
| `pnpm test:a11y`                 | pass                          | 13 passed, 5 auth routes skipped (`A11Y_SKIP_AUTH_ROUTES=1`)                                 |
| `prisma db push` + `pnpm test`   | pass                          | 998 passed, 2 skipped                                                                        |
| Focused Wave 0 unit suites       | pass                          | deploy env, JSON-LD, prod-audit-lib, canonical URL, security headers, `/jobs`, feature flags |

Migrate-from-zero workflow job remains `continue-on-error: true` (Wave 1 debt; not changed).

## Repair follow-up (post-merge of #377)

PR #377 was merged to `main` by the repository owner while CI Format check was red on `docs/remediation/WAVE0_STABILISATION.md` (subsequent CI steps skipped). Repair branch `cursor/wave0-stabilisation-repair-2794` completes:

1. Prettier formatting for `format:check`
2. Deploy-path production env enforcement (`next.config.ts` + `instrumentation.ts` via `assertDeployedProductionEnv`)
3. JSON-LD canonical apex consistency via `buildPublicJsonLd()` / `getCanonicalPublicOrigin()`
4. Fail-closed prod-audit parsing/evaluation (`scripts/ci/prod-audit-lib.ts`) with fixture tests
5. Upload-validation advisory signal integrity (WARN vs FAILED; documented false-positive exclusions)
6. Figma evidence: **blocked** — see `WAVE0_FIGMA_ROUTE_EVIDENCE.md` (placeholder URL only)

### Deferred blockers (unchanged)

- Migrate-from-zero still fails with Prisma P3018 in `20260525000000_mapable_access_phase_1` (Wave 1).
- Five authenticated accessibility routes remain skipped.
- Branch protection, independent approval, production Vercel variables and www TLS renewal are account-owner tasks.
- Overall production readiness requires later waves. Do not mark capabilities `production_ready`.
