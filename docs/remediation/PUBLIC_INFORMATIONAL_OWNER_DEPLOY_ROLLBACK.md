# Owner deployment and rollback — public informational site

**Agents must not** change Vercel settings or deploy Production.  
**Scope:** informational site only. Do not enable CSP enforce, AT Continuity, or a11y panel.

## Deploy checklist

1. Confirm Production branch is `main`.
2. Set (without pasting secrets into chat):
   - `NEXTAUTH_URL=https://mapable.com.au`
   - `NEXT_PUBLIC_APP_URL=https://mapable.com.au`
3. Deploy the **approved remediation commit SHA** (Promotion / Redeploy from that SHA).
4. Verify deployment metadata SHA matches the reviewed SHA.
5. Probe (expect JSON, not HTML):
   - `GET https://mapable.com.au/` → 200
   - Allowlisted informational routes → 200
   - `GET https://mapable.com.au/api/health/live` → 200 `{status:"ok"}` `Cache-Control: no-store`
   - `GET https://mapable.com.au/api/health/ready` → 200 `{status:"ready"}` when DB up, else 503 `{status:"unavailable"}`
6. Confirm CSP remains **report-only** on HTML responses.
7. Confirm high-risk flags remain unset/false in Production.
8. Observe logs/alerts for 5xx and ready 503 spikes (no secret values in tickets).

## Rollback

1. In Vercel → Project → Deployments, promote the last known-good Production deployment (prior `READY` deployment that served apex).
2. Re-probe homepage + `/api/health/live` + `/api/health/ready`.
3. Rollback must **not** require enabling experimental flags.

## Known prior failure

`dpl_D6eih3NnqM4QJvYL3wRTkuiG2ycc` @ `2042a210` failed with:

```text
NEXTAUTH_URL: Must use https:// in production (insecure HTTP rejected)
NEXT_PUBLIC_APP_URL: Must use https:// in production (insecure HTTP rejected)
```

Fix env first; do not weaken `assertDeployedProductionEnv`.
