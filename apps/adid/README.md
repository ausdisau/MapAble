# AD.iD identity portal (review-only)

An isolated Next.js application intended to be deployed on a separate protected Vercel project. It is **not** integrated with production Wix Members, MapAble sessions or the existing `neon_auth` identities.

## Technology and boundaries
- Clerk Next.js: sign-in, session issuing, passkeys/MFA as configured in Clerk dashboard. Never trust an unverified JWT or self-declared role.
- Next.js 16 App Router: server-side `auth()`, protected `/dashboard` and `/api/identity/me`. No raw JWT parsing.
- Neon PostgreSQL: optional read-only `public.services` directory, enabled by `ADID_NEON_DIRECTORY_ENABLED=true`; no user reads or identity linking.
- Wix Editor/Velo: public link to protected portal sign-in, **not** a Wix Member login. See `docs/wix-handoff.md`.
- If Clerk or Neon is not configured, no live protected dashboard may be claimed.
- Four service cards are **not** proof of entitlement, cross-app sign-in or availability.

## Local preparation
1. In `apps/adid`, install dependencies using the reviewed lockfile produced in CI (no lockfile committed yet).
2. Copy `.env.example` to `.env.local`; add the Clerk publishable/secret keys for an isolated test tenant. Never put secrets on a Wix page.
3. Leave `ADID_NEON_DIRECTORY_ENABLED=false`. To test public directory, request a reviewed **read-only role** on an isolated Neon branch, with SELECT on `public.services` only, then configure `DATABASE_URL` in the deployment secret manager.
4. Run `npm run typecheck`, `npm test` and `npm run build` and independently test WCAG 2.2 AA sign-in/recovery and mobile responsiveness.
5. Create a separate private/SSO protected Vercel preview **after** a GitHub Login Connection is enabled; root directory `apps/adid`. Do not alter existing MapAble, AD.iD, Wix, AccessiBooks or Disapedia production sites.

## Important: existing data
On 10 November 2026, the AD.iD Neon project was observed in AWS us-east-2 with `neon_auth` schema and `public.services`, `public.user_service_access`, `public.audit_events`. The uploaded `adid-neon-auth-db` Prisma migration creates overlapping `User`, `Session` and `Identity` tables and MUST NOT be deployed unreviewed. The AD.iD project is in US East; resolve Australian data residency before personal account linking.

## Next integration gate
A vetted mapping table should key on **issuer + subject** and only after a user-controlled, independently verified account linking ceremony. Do not link by email alone. Consent must be per app, per scope, revocable and auditable. A future JWT gateway must validate signature via IdP JWKS, issuer, audience, expiry and replay bounds; NextAuth's local session stays independent. Clerk is a candidate, not a production migration decision.

## Styling
The AD.iD Brand Identity reference gives deep Australian blue #1F5897, warm muted red #9D5D61, vivid orange #F0671D. The dashboard follows the screenshot's layout concept (sidebar, service cards, assistance); placeholder example emails/addresses in the brand source must never be published as real data.
