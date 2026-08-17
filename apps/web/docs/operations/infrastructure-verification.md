# Infrastructure verification notes

Last verified in this branch:

- `pnpm exec eslint` on infrastructure code changes.
- `pnpm type-check`.
- Focused Vitest coverage for auth, public routes, module routes, home search
  and core UI.
- `pnpm build`.
- Built-server smoke checks:
  - `/`
  - `/api/auth/session`
  - `/api/auth/providers`
  - `/robots.txt`
  - `/sitemap.xml`

## Residual blockers

- Vercel deployment remains blocked until the `ausdisau` billing suspension is
  fixed and the operator has access to the project/domain for `mapable.com.au`.
- Production still needs a real stable `NEXTAUTH_SECRET`; the fallback secret
  only prevents auth endpoints from returning 500 during misconfiguration.
- Full repository lint has known unrelated import-order/parser issues outside
  the touched infrastructure files.
- Full repository tests can require `DATABASE_URL` for Prisma-backed suites.
- Databricks implementation cannot proceed until the user selects an
  authenticated Databricks profile/workspace.
- Twilio promotional messaging should remain unimplemented until channel,
  geography, opt-in, sender registration and compliance ownership are confirmed.
