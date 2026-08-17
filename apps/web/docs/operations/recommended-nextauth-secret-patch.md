# NextAuth secret policy (finding #1) — option C implemented

## Policy

MapAble uses a **hybrid** auth secret policy:

| Environment                                     | Behavior                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel production** (`VERCEL_ENV=production`) | Fail closed. `NEXTAUTH_SECRET` (min 16 chars) is required. No repo fallback.                                                                              |
| **Vercel preview** (`VERCEL_ENV=preview`)       | Fail closed unless a **platform-injected** preview secret is set: `NEXTAUTH_SECRET` or `MAPABLE_PREVIEW_AUTH_SECRET` in the Vercel **Preview** env group. |
| **Local development / tests**                   | Dev-only fallback so `/api/auth/*` stays usable without Vercel env. Not used on deployed builds.                                                          |
| **Other production hosts**                      | Set `MAPABLE_ENFORCE_PRODUCTION_ENV=true` and `NEXTAUTH_SECRET` (≥16). Deploy gate does **not** accept `AUTH_SECRET` / `SESSION_SECRET` aliases.          |

## Canonical secret contract (2026-07-20)

| Variable                                           | Role                                                                                                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `NEXTAUTH_SECRET`                                  | **Canonical** JWT/session signing secret for production deploy gate and preferred runtime secret                     |
| `MAPABLE_PREVIEW_AUTH_SECRET`                      | Preview-only signing secret (Vercel Preview env group)                                                               |
| `AUTH_SECRET` / `SESSION_SECRET`                   | Legacy **runtime signing aliases** in `resolveNextAuthSecret()` only — not accepted by `assertDeployedProductionEnv` |
| Data encryption keys (`NDIS_ENCRYPTION_KEY`, etc.) | Dedicated keys only — never fall back to session secrets                                                             |

## Vercel setup

1. **Production** — set `NEXTAUTH_SECRET` (32+ random bytes) in the Production environment.
2. **Preview** — set either:
   - `NEXTAUTH_SECRET` scoped to Preview, or
   - `MAPABLE_PREVIEW_AUTH_SECRET` scoped to Preview (dedicated preview signing key)

Never commit preview/production secrets to the repository.

## Runtime behavior when misconfigured

- `resolveNextAuthSecret()` returns `undefined` on deployed production/preview without a valid secret.
- Guarded routes return **503** with `AUTH_SECRET_MISSING` (middleware).
- Password reset signing returns `null`; 2FA token helpers throw if invoked without a secret.
- NextAuth `authOptions.secret` is `undefined`, so session issuance is blocked.

## Verification

```bash
pnpm check:integrations-env   # validates env by deployment tier
pnpm test tests/resolve-nextauth-secret.test.ts
```

Implemented in `lib/auth/nextauth-env.ts` and `middleware.ts`.
