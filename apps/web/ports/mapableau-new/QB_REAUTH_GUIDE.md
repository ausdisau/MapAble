# QuickBooks Re-auth Migration Guide

This guide covers everything needed to migrate QB-connected MapAble operators
to the new Vercel-hosted platform without breaking invoice sync.

---

## Overview

Operators who connected QuickBooks via the old REPL platform have OAuth tokens
that reference `https://<old-replit-domain>/api/quickbooks/callback` as the
redirect URI. That endpoint no longer exists after the platform move.

The re-auth flow replaces those tokens with fresh ones that use the new
`/api/billing/quickbooks/auth` redirect URI.

**No operator data is lost.** Invoice history, QB customer IDs, and accounting
records are all preserved. Only the OAuth session needs to be refreshed.

---

## Step 1 — Update QB_REDIRECT_URI in the Intuit Developer console

**Do this FIRST — before deploying to Vercel and before sending any emails.**

1. Log in to the [Intuit Developer portal](https://developer.intuit.com/) with
   the MapAble developer account.

2. Open your app → **Keys & credentials** → **OAuth 2.0**.

3. Under **Redirect URIs**, add the new URI:
   ```
   https://<your-vercel-domain>/api/billing/quickbooks/auth
   ```
   For example: `https://app.mapable.com.au/api/billing/quickbooks/auth`

4. **Keep the old Replit URI in the list** until all operators have re-linked.
   Both URIs can coexist. Remove the old one only after the migration is
   complete (suggested: 30 days after the notification email is sent).

5. Set `QB_REDIRECT_URI` in Vercel environment variables to match the new URI:
   ```
   QB_REDIRECT_URI=https://app.mapable.com.au/api/billing/quickbooks/auth
   ```

---

## Step 2 — Deploy the new QB auth routes to Vercel

The following files from `ports/mapableau-new/` must be integrated and
deployed before running the migration script:

| Port file | Purpose |
|---|---|
| `src/app/api/billing/quickbooks/auth/route.ts` | OAuth initiate + callback + disconnect |
| `src/app/api/billing/quickbooks/relink-status/route.ts` | Re-link status check for the banner |
| `src/components/billing/QbRelinkBanner.tsx` | Settings page banner |
| `scripts/qb-reauth-notify.ts` | Migration notification script |

See `INTEGRATION.md` §Phase 4 for how to copy route files into mapableau-new.

Verify the `/api/billing/quickbooks/auth` route is live and reachable before
proceeding:
```bash
curl -I https://<your-domain>/api/billing/quickbooks/auth
# Expect: 302 redirect to Intuit OAuth (if QB env vars are set)
# or:     503 (if QB_CLIENT_ID etc. not yet configured)
```

---

## Step 3 — Add the re-link banner to the settings page

The `QbRelinkBanner` component polls `/api/billing/quickbooks/relink-status`
and shows a warning when the operator's token is expired or will expire within
7 days.

### Client component (settings tab with client-side rendering)

```tsx
// src/app/(dashboard)/settings/billing/page.tsx (or equivalent)
import { QbRelinkBanner } from "@/components/billing/QbRelinkBanner";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Add at the top of the billing settings section */}
      <QbRelinkBanner />

      {/* ... rest of the billing settings UI ... */}
    </div>
  );
}
```

### Server component (RSC page with server-side data fetch)

```tsx
import { QbRelinkBannerServer } from "@/components/billing/QbRelinkBanner";

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <QbRelinkBannerServer />
      {/* ... */}
    </div>
  );
}
```

The banner is self-hiding: it renders nothing when the user has no QB
connection or when the connection is healthy.

---

## Step 4 — Run the migration notification script

### Prerequisites

Ensure the following environment variables are set in your shell session:

```bash
# Required
export DATABASE_URL="postgresql://..."       # Production Neon DB connection string
export NEXT_PUBLIC_APP_URL="https://app.mapable.com.au"

# One of:
export AGENTMAIL_API_KEY="..."
export AGENTMAIL_NOTIFICATIONS_INBOX_ID="..."   # AgentMail inbox to send from
# or:
export SENDGRID_API_KEY="..."
export SENDGRID_FROM_EMAIL="noreply@mapable.com.au"
```

### Dry run first (always)

```bash
pnpm tsx scripts/qb-reauth-notify.ts --dry-run
```

Output shows exactly which operators would be emailed. Verify the list matches
expectations before sending live.

### Send live notifications

```bash
pnpm tsx scripts/qb-reauth-notify.ts
```

The script:
1. Queries `User` rows where `qbRealmId IS NOT NULL`
2. Skips users whose tokens appear fresh (> 7 days remaining) unless `--force`
3. Skips users already in `.qb-reauth-run.json` (idempotent re-runs)
4. Sends a branded HTML + plain text email with the re-link URL
5. Logs all sent notifications to `scripts/.qb-reauth-run.json`

### Re-run safely

The script is idempotent. Re-running it will not email operators twice unless
you pass `--force`.

```bash
# Send to a subset for testing
pnpm tsx scripts/qb-reauth-notify.ts --limit=5

# Re-notify everyone (e.g. 2-week follow-up)
pnpm tsx scripts/qb-reauth-notify.ts --force
```

---

## Step 5 — Monitor re-link completion

After sending notifications, check the Neon database periodically to track
how many operators have re-linked:

```sql
-- Operators who still need to re-link
SELECT id, "fullName", email, "qbRealmId", "qbTokenExpiresAt"
FROM "User"
WHERE "qbRealmId" IS NOT NULL
  AND (
    "qbTokenExpiresAt" IS NULL
    OR "qbTokenExpiresAt" < NOW() + INTERVAL '7 days'
  )
ORDER BY "qbTokenExpiresAt" ASC NULLS FIRST;

-- Operators who have successfully re-linked
SELECT COUNT(*)
FROM "User"
WHERE "qbRealmId" IS NOT NULL
  AND "qbTokenExpiresAt" > NOW() + INTERVAL '7 days';
```

---

## Step 6 — Follow-up email (14 days later)

For any operators who have not re-linked after 14 days, send a follow-up:

```bash
pnpm tsx scripts/qb-reauth-notify.ts --force
```

This will re-notify all operators who still have an expired or near-expiry
token, regardless of whether they were previously notified.

---

## Step 7 — Remove the old Replit redirect URI (30 days after migration)

Once all operators have re-linked (or 30 days after the first notification,
whichever comes first):

1. Return to the Intuit Developer portal → your app → **Redirect URIs**.
2. Remove the old Replit URI.
3. Confirm `QB_REDIRECT_URI` in Vercel points only at the new domain.

---

## Sequence diagram

```
Operator                Settings page          /api/billing/quickbooks/*
   |                         |                          |
   | visits settings         |                          |
   |------------------------>|                          |
   |                         | GET /relink-status       |
   |                         |------------------------->|
   |                         |   { needsRelink: true }  |
   |                         |<-------------------------|
   |  shows re-link banner   |                          |
   |<------------------------|                          |
   |                         |                          |
   | clicks "Re-link"        |                          |
   |---------------------------------------------------->|
   |                         |     redirect to Intuit   |
   |<----------------------------------------------------|
   |                                                     |
   | completes Intuit consent screen                     |
   | Intuit redirects to /api/billing/quickbooks/auth    |
   |  ?code=...&realmId=...                              |
   |---------------------------------------------------->|
   |             exchanges code for tokens               |
   |             writes to DB                            |
   |             redirects to /settings?qb=connected     |
   |<----------------------------------------------------|
   |                                                     |
   | banner is gone; invoices sync normally              |
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/billing/quickbooks/auth` returns 503 | `QB_CLIENT_ID`, `QB_CLIENT_SECRET`, or `QB_REDIRECT_URI` not set in Vercel | Add env vars in Vercel dashboard → project settings |
| Intuit shows "Invalid redirect URI" | New URI not added to Intuit Developer console | Complete Step 1 above |
| Banner not appearing on settings page | Component not added to the settings page | Complete Step 3 above |
| Script sends no emails | All users already notified (run log) or tokens appear fresh | Pass `--force` or check `scripts/.qb-reauth-run.json` |
| Token refresh keeps failing | QB refresh token expired (> 100 days unused) | Only fresh OAuth consent fixes this; notification + banner are the solution |
| `AGENTMAIL_API_KEY` or `SENDGRID_API_KEY` not set | Script cannot send emails | Set the relevant env var before running |

---

## Files created for this migration

| File | Purpose |
|---|---|
| `scripts/qb-reauth-notify.ts` | One-time operator notification script |
| `src/app/api/billing/quickbooks/auth/route.ts` | OAuth initiate + callback + disconnect |
| `src/app/api/billing/quickbooks/relink-status/route.ts` | Re-link health check API |
| `src/components/billing/QbRelinkBanner.tsx` | Settings page warning banner (client + server variants) |
| `QB_REAUTH_GUIDE.md` | This document |
