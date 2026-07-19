# Security Hardening — Productisation Wave 1

Branch: `cursor/api-tenant-hardening-6ea8`

## Delivered

1. **Dedicated encryption keys** — `lib/security/encryption-keys.ts`; `lib/crypto/ndis.ts` no longer falls back to `NEXTAUTH_SECRET`. Ciphertexts include key version.
2. **High-risk Zod** — micro-consent POST, data-vault POST, drivers/vehicles/availability POST; inventory in `lib/security/high-risk-routes.ts`.
3. **Tenant scope** — `/api/billing/overview` asserts organisation membership; drivers/vehicles/availability require membership for body/query `organisationId`; Xero connect asserts billing org access; list endpoints are org-scoped.
4. **Break-glass** — `POST /api/admin/break-glass` time-boxed sessions; `MAPABLE_REQUIRE_ADMIN_BREAK_GLASS`.
5. **IDOR / key tests** — `tests/security/*` including `org-transport-tenant.test.ts`.

## Non-goals

- Ambient admin permission matrix rewrite (follow-up)
- Live NDIA / Xero enablement
- Product domain migrations

## Rollback

Revert this PR; set `MAPABLE_ALLOW_DEV_ENCRYPTION_FALLBACK=true` only for local recovery; never restore session-secret encryption fallback.
