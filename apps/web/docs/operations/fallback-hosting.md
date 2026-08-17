# Fallback hosting guide

Use this guide if Vercel remains unavailable because of billing, domain access,
or project ownership blockers.

## Decision matrix

| Host             | Best fit                                                  | Main caveat                                                          |
| ---------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Cloudflare Pages | Static/edge-first public site, strong CDN and DNS control | Some Next.js server features may need OpenNext/Workers adaptation.   |
| Netlify          | Next.js app hosting with simple project setup             | Verify server/API route support and scheduled jobs before migration. |
| Render           | Long-running Node web service using `next start`          | Free services can sleep; production requires a paid instance.        |
| Railway/Fly.io   | Container-style deployment                                | More infrastructure ownership than Vercel/Netlify.                   |

## Minimum viable fallback

If urgent public uptime is required, deploy the public website pages first and
leave authenticated app workflows disabled until auth/database environment
variables are verified.

Required env vars remain the same:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

## Cloudflare Pages path

1. Keep DNS for `mapable.com.au` on Cloudflare if possible.
2. Evaluate Next.js compatibility with Cloudflare Pages/OpenNext.
3. Set build command:

   ```bash
   pnpm setup:cloud-agent && pnpm build
   ```

4. Configure environment variables in the Cloudflare dashboard.
5. Confirm API routes and NextAuth endpoints work on the selected adapter.

Smoke checks:

```bash
curl https://www.mapable.com.au/api/auth/session
curl https://www.mapable.com.au/api/auth/providers
curl https://www.mapable.com.au/sitemap.xml
```

## Netlify path

1. Connect the GitHub repository.
2. Use pnpm and Node 22.
3. Build command:

   ```bash
   pnpm setup:cloud-agent && pnpm build
   ```

4. Configure the same production env vars.
5. Verify NextAuth callback URL:

   ```text
   https://www.mapable.com.au/api/auth/callback/credentials
   ```

## Render path

Use Render when server execution is more important than edge/static hosting.

Suggested web service:

- Build command: `pnpm setup:cloud-agent && pnpm build`
- Start command: `pnpm start -p $PORT`
- Runtime: Node 22

Do not use a free sleeping service for production participant/provider flows.

## Fallback launch criteria

- `pnpm type-check` passes.
- `pnpm build` passes.
- `/api/auth/session` returns 200.
- `/api/auth/providers` returns 200.
- `/privacy`, `/terms`, `/data-deletion`, `/accessibility-statement` return 200.
- DNS and TLS are active for `www.mapable.com.au`.
- Rollback path is documented for the chosen host.
