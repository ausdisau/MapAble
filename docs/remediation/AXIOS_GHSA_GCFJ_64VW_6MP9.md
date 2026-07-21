# Axios advisory scope — GHSA-gcfj-64vw-6mp9

**PR:** #387 (and companion tips #382 / #388 carrying the same override)  
**Advisory:** [GHSA-gcfj-64vw-6mp9](https://github.com/advisories/GHSA-gcfj-64vw-6mp9)  
**Severity:** high  
**Published:** 2026-07-20

## Explicit scope (what changed)

| Item                                  | Value                       |
| ------------------------------------- | --------------------------- |
| Change type                           | Dependency override only    |
| `package.json` `pnpm.overrides.axios` | `>=1.18.0` (was `>=1.16.0`) |
| Resolved version                      | `axios@1.18.1`              |
| Direct product code                   | **None**                    |
| Feature flags                         | Unchanged                   |
| Prisma / routes / claims              | Unchanged                   |

## Why this is in the truth/controls PR

`pnpm ci:prod-audit` began failing on all tips after the advisory published against
`axios` `>=1.15.2 <1.18.0`. Remediating via override is release-engineering
(permitted under the feature freeze). It is **not** a product capability addition.

## Transitive consumers (inventory)

| Parent                                   | Path                  |
| ---------------------------------------- | --------------------- |
| `@chat-adapter/slack` → `@slack/web-api` | production dependency |
| `@sendgrid/mail` → `@sendgrid/client`    | production dependency |

No first-party application code imports `axios` directly for new behaviour in this PR.

## Verification

- `pnpm why axios` → `1.18.1`
- `pnpm ci:prod-audit` → pass (0 high/critical; 0 allowlist exceptions)
- No entry added to `security/advisory-allowlist.json` (fixed, not excepted)

## Out of scope / non-claims

- Does not claim full dependency hygiene beyond this advisory
- Does not enable Slack/SendGrid product paths
- Does not replace the need for ongoing `ci:prod-audit` on every PR
