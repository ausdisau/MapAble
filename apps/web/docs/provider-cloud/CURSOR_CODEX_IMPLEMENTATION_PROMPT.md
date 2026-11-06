# Mission
Extend the default-disabled, synthetic-only ProviderCloud Domain Manager in canonical `ausdisau/MapAble`. Investigate Vercel and TPP Wholesale APIs while keeping all real provisioning and payments out of scope until reviewed and explicitly approved.

## Repository context
Base inspected: `main` at `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0`; recheck current HEAD before editing. Existing PR: #23, `feat/providercloud-domain-preview-20261106`. Next.js 15, React, TypeScript, Prisma/PostgreSQL, pnpm, Vitest. Relevant paths:
- `apps/web/lib/provider-cloud/domains/preview.ts`
- `apps/web/app/api/providercloud/domains/preview/route.ts`
- `apps/web/app/provider/(console)/domains/`
- `apps/web/tests/provider-cloud-domain-preview*.test.ts`
- `apps/web/lib/api/organisation-scope.ts`
- `apps/web/lib/platform/multi-tenant-admin/`
- `apps/web/lib/platform/event-outbox-service.ts`
- `apps/web/docs/provider-cloud/VERCEL_TPP_PROVISIONING_RESEARCH.md`

## In scope
1. Inspect the current HEAD, open PRs, code ownership, authentication and migrations before changes.
2. Test/review Phase A's synthetic-only preview. Restrict inputs to RFC-reserved example domains and require provider_admin + exact organisation membership from server data; deny unscoped and forged-host access.
3. Propose (do not apply) PostgreSQL models with globally unique hostname binding, registrant metadata separate from hosting, audit event and durable job outbox.
4. Plan a **read-only** Vercel adapter first: project-domain details, verification, DNS config and certificate/TLS readiness as separate states. Use recorded project/team refs only after confirming dedicated ProviderCloud entitlement.
5. Define a mock-only TPP REST adapter for availability, customer/registrant, quote, registration, renewal, DNS and external order reconciliation. Authenticate only from approved fixed egress in a later explicitly authorised phase. Confirm current authenticated API schema before any real implementation.
6. Document human approvals, DNS/email protection, domain offboarding quarantine and rollback paths. No participant-private data in white-label public content.

## Out of scope
No paid domain orders, transfers, renewals, production DNS edits, Vercel domain attach/detach, wildcard delegation, real website publishing, secrets, participant data, production schema migrations, production flags, merging or deployment. Do not repurpose `mapable.com.au` or current Vercel projects.

## User journey and state
Provider admin selects their organisation and chooses a platform subdomain or existing-domain preview. User inputs `provider.sites.example.test` or `www.example.org`. Result remains `draft_only`; registrar `not_requested`, ownership `not_verified`, DNS/TLS `not_checked`, publication `blocked`. Real domains must fail. Later state machine proposal: requested -> ownership_pending -> dns_pending -> tls_pending -> ready_for_human_review -> active; suspended/quarantined/released/error paths. Do not infer "active" from Vercel `verified`.

## Identity, permissions, privacy and consent
Do not trust `Host`, `x-mapable-tenant-id`, request body organisation ID or feature flags as proof of membership. Resolve authenticated actor + exact organisation membership server-side on every API and future job. Existing broad admin scope or an empty `{}` query filter is not a secure fallback. Design scoped and revocable domain-admin delegation with explicit expiry before live mutations. Consent and registration must be understandable, registrant PII minimised; paid actions need explicit confirmation, human review and audit evidence.

## Accessibility acceptance criteria
WCAG 2.2 AA and assisted-tech user testing: keyboard, switch, screen reader, AAC-compatible entry, focus management, clear errors, text DNS instructions, 200%-400% zoom, contrast, no colour-only signals or image-only CAPTCHA, human help without penalty. Provider branding must never disguise domain ownership, NDIS status, participant rights or data controller responsibilities.

## Required tests
From `apps/web`: `pnpm exec vitest run tests/provider-cloud-domain-preview.test.ts tests/provider-cloud-domain-preview-route.test.ts`; then `pnpm type-check`, relevant lint, format, `pnpm ci:domain-ownership`, `pnpm ci:feature-dependencies`, and accessible end-to-end tests when environment permits. Add cases for denied role, missing organisation, forged header, real domain, malformed data, production flag and repeated-state idempotency. Record commands, head SHA and exact results; distinguish new failures from baseline failures.

## Implementation sequence
Inspect -> reproduce tests -> propose exact diff -> code mock/read-only boundaries -> verify with tests/a11y review -> document all remaining gates. Keep a separate PR for any persistent schema or vendor adapter.

## Stop conditions
Stop for an unresolved tenant boundary, changed main/overlapping PR, ambiguous API contract, unavailable TPP authenticated docs/fixed egress, credential request, potential mail DNS disruption, commercial/auDA eligibility judgement, real payment or deployment change. Do not bypass checks.

## Final report
Return repository and branch/head SHA, changed files, synthetic behavior proof, tests and CI, a11y results, external vendor unknowns, security blockers and next human approval. Explicitly confirm no merge/deploy, domain/DNS change, live registration or paid order.