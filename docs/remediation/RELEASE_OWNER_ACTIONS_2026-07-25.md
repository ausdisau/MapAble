# Release owner actions — 2026-07-25

**Verdict:** Production tip **cannot** ship until Vercel Production env is fixed. Live apex remains on stale deploy `dpl_MBD4G6ZZhRQ84iTqx2oc1sqZ3dVK`.

Agents **cannot** set Vercel Production secrets, renew DNS/TLS certificates, or confirm GitHub branch-protection UI. Those steps require the account owner.

---

## Status of the five actions

| #   | Action                                                                | Agent status                                           | Owner status                                   |
| --- | --------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- |
| 1   | Redeploy Production tip (health + JSON-LD)                            | **Blocked** — every recent Production deploy **ERROR** | Fix env (#2), then Redeploy / push `main`      |
| 2   | Set `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` = `https://mapable.com.au` | **Blocked** — no Vercel env write tool                 | **Do this first** in Vercel UI                 |
| 3   | Renew `www` TLS                                                       | Diagnosed only                                         | Renew / re-issue cert (expired **2026-06-25**) |
| 4   | Confirm branch protection in GitHub UI                                | API `403` / empty rulesets                             | Screenshot Settings → Rules/Branches           |
| 5   | Jul 16+ `migrate deploy`                                              | **Held** (A-continue complete)                         | Separate explicit decision                     |

---

## 1–2. Vercel Production env + redeploy (blocking)

**Project:** `mapableau-new` (`prj_iAhQk0b6IhigXw58PFiYfiHSATmW`) · team `mapableau`  
**Latest Production attempt:** `dpl_7BRWChKYqTtro417wesyUz1ikmT3` (commit `3991d763`, merge #398) — **ERROR**  
**Inspector:** https://vercel.com/mapableau/mapableau-new/7BRWChKYqTtro417wesyUz1ikmT3

**Authenticated build failure (fail-closed gate working):**

```text
Error: MapAble production environment validation failed (fail-closed).
NEXT_PUBLIC_APP_URL: Must use https:// in production (insecure HTTP rejected)
NEXTAUTH_URL: Must match NEXT_PUBLIC_APP_URL origin in production
```

### Owner steps (order matters)

1. Vercel → Project **mapableau-new** → **Settings → Environment Variables → Production**
2. Set (do **not** paste values into chat):
   - `NEXTAUTH_URL` = `https://mapable.com.au`
   - `NEXT_PUBLIC_APP_URL` = `https://mapable.com.au`
3. Remove / replace any Production values that are `http://…` or localhost.
4. Confirm Production branch is `main`.
5. **Deployments →** latest failed Production → **Redeploy** (or empty commit / merge to `main`).
6. When `READY`, record deployment ID + commit SHA.
7. Probe (expect JSON, not HTML 404):

```bash
curl -sS https://mapable.com.au/api/health/live
curl -sS https://mapable.com.au/api/health/ready
# Expect no http://localhost in page JSON-LD:
curl -sS https://mapable.com.au/ | grep -oE 'http://localhost[^"]*' || echo 'OK: no localhost'
pnpm audit:https-gate
```

**Live edge today (pre-redeploy):** apex still `dpl_MBD4G6…`; `/api/health/live` + `/ready` → **404 HTML**; JSON-LD still `http://localhost:3000`.

---

## 3. Renew `www.mapable.com.au` TLS

| Host                 | Certificate                                       | Status     |
| -------------------- | ------------------------------------------------- | ---------- |
| `mapable.com.au`     | LE valid until **2026-10-14**                     | OK         |
| `www.mapable.com.au` | LE expired **2026-06-25** (`CN=*.mapable.com.au`) | **FAILED** |

DNS: `www` → `d44077140a…vercel-dns-016.com` (Vercel).

### Owner steps

1. Vercel → Domains → `www.mapable.com.au` → renew / re-verify certificate (or remove + re-add domain).
2. Confirm `https://www.mapable.com.au` validates TLS and **307/308 →** `https://mapable.com.au/`.
3. Until renewed, browsers and `curl` (verify on) will fail on www even though insecure redirect still points at apex.

---

## 4. Confirm GitHub branch protection

Automation result: `gh` branch protection **403**; rulesets API returns `[]`. Overall: `PARTIAL_API_VISIBLE_OWNER_MUST_CONFIRM_UI`.

### Owner steps

1. GitHub → `ausdisau/mapableau-new` → **Settings → Rules / Branches**
2. Ensure `main` requires: PR + ≥1 independent approval, dismiss stale, required checks (CI, Migrations, Migrate from zero, Security, Accessibility, Production claims, Vercel, …)
3. Screenshot and attach to release evidence (do not claim automation verified this).

Helper: `pnpm audit:branch-protection`

---

## 5. Jul 16+ migrations (separate decision)

A-continue §3 checksum/rename on Neon `production` is **done**. Forward migrations still **not** applied:

- `20260716120000_indoor_accessibility_platform` … `20260720120000_at_continuity_wave1` (**12**)

**Default:** keep **held**.  
Only run `prisma migrate deploy` against production after an explicit owner decision, staging-clone rehearsal of those 12, and programme approval for AT Continuity / related flags (keep `MAPABLE_AT_CONTINUITY_ENABLED=false` unless separately approved).

Reply with one of:

- `hold Jul 16+ migrate deploy` (recommended default)
- `yes, rehearse Jul 16+ migrate deploy on Neon wave1-migration-rehearsal only`
- `yes, apply Jul 16+ migrate deploy to Neon production` (requires rehearsal pass first)

---

## Related

- [OWNER_ACTION_REQUIRED_OPS.md](./OWNER_ACTION_REQUIRED_OPS.md)
- [WAVE1_A_CONTINUE_RECONCILIATION.md](./WAVE1_A_CONTINUE_RECONCILIATION.md)
- [HEALTH_ENDPOINT_DIAGNOSIS.md](./HEALTH_ENDPOINT_DIAGNOSIS.md)
- [../operations/production-preflight.md](../operations/production-preflight.md)
