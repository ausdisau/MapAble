# Care & Support Perceptual Frame RAG runtime - security review and rollout gates

**Status:** explicitly authorised code-only demonstration (6 November 2026). No runtime endpoint, database migration, production feature, provider import, model invocation or real participant data. Default OFF; production hard-denied.

**Repository:** ausdisau/MapAble @ main 43ce85df6b5b09a8577b60bf29042fbc1dc96fb0. Separate draft PR from schema-only PR #21. PR #21 must be reviewed independently before merging the runtime adapter.

## Verified code-level evidence

| Responsibility | Existing owner / direct source | Finding | Follow-up |
| --- | --- | --- | --- |
| Identity | `lib/auth/current-user.ts`, `lib/api/auth-handler.ts` | `getCurrentUser()` derives a NextAuth user and reloads user from Prisma; mobile Bearer scope path is separate | Use server-derived actor only; no headers or user-provided identity |
| Organisation membership | `lib/api/organisation-scope.ts` | Membership IDs read from `OrganisationMember`; role alone is not a sufficient resource grant | Require explicit exact membership and participant scope |
| Consent | `lib/consent/consent-service.ts` | `checkConsent()` checks recipient/scope/status/expiry but **not** exact `purpose` or `dataScope` | Do not treat `checkConsent()` as the complete AI disclosure gate |
| Consent schema | `prisma/schema.prisma` | `ConsentRecord` stores purpose, optional JSON `dataScope`, `sourceAction`, recipient and revocation | This adapter reads the existing record, requires exact terms and newest status, never creates consent |
| Delegated authority | `lib/authority/participant-authority-service.ts` AND `lib/programmes/authority/participant-authority-service.ts` | Both write `ParticipantAuthorityGrant` using different columns; read paths differ | Delegated private retrieval disabled pending authority reconciliation |
| Legacy hybrid retrieval | `lib/ai/platform/retrieval/hybrid.ts` | Designed for Starting Work; nullable participant scopes can admit unscoped chunks | Do not reuse as-is for private support needs; filter strictly before ranking |
| AURA stop | `lib/programmes/aura/execution-gate.ts` | Process-local stop, not global cross-instance revocation | Use only for non-production shadow mode; add durable stop policy before any live rollout |
| Model authority | `lib/config/trust-fabric.ts` | AI decision authority and automatic authority are permanently disabled | Maintain proposal-only / no model-driven tools or writes |

## Implementation invariants

1. `MAPABLE_CARE_SUPPORT_RAG_ENABLED` is read using `=== "true"` and defaults off. `MAPABLE_AURA_HARNESS_ENABLED` must also be true. Even then, `NODE_ENV === production` returns disabled.
2. `ParticipantRAG` checks NextAuth identity and exact organisation membership. Only `actor.id === participantId` is allowed; no administrative, delegated or provider override.
3. Its consent guard inspects the **latest** `ConsentRecord` with exact purpose `care_support_perception_v1`, scope `support_profile_read`, self-recipient, self-granter, `sourceAction=care_support_perception.read`, active status, no revocation, valid expiry and explicit `dataScope` containing BOTH `support_needs` and `ai_processing`. A broad older consent or empty `dataScope` cannot authorise AI processing. No consent writer is introduced by this PR.
4. The store contract requires tenant+participant+purpose constraints before returning candidates. The service additionally rejects wrong-scoped and non-synthetic records **before** ranking.
5. `ProviderRAG` accepts only `public_provider`, unbound participant/tenant IDs, synthetic source records. It cannot imply current NDIS registration, screening, staff competence or availability.
6. The consent and AURA stop are checked again after data loading; audit is awaited. This is not atomic with a persistent store and is not a production access revocation guarantee.
7. Only `redactedText`, source reference, source version and evidence status can be returned. No model is called; no freeform retrieved text is treated as instructions.
8. Retrieving or interpreting text is never authority to book, refer, assign, pay, approve consent, determine support eligibility, make clinical decisions or invoke restrictive practice.

## Known limitations and necessary release blockers

- No approved participant-facing purpose-and-AI-specific consent-creation/revocation UX exists for this pilot; as a result real access will fail closed even if a caller tries to enable the adapter.
- Participant membership in a provider organisation is not universal. Lack of membership must cause denial here; a production participant-owner/tenant model must be designed without weakening isolation.
- Real participant storage, retrieval embeddings, tenant index strategy, removal on revocation and durable Stop AURA are **not implemented**.
- No API route, deployment, OpenAI credentials, live NDIA data or statutory assessment is provided.
- The proposed code-only extension to `lib/ai/platform/retrieval/**` sits outside the original enumerated W-AA-1 waiver path. User has explicitly authorised *this separate narrow development integration*, not a general freeze lift, merge or production release. Confirm programme owner accepts the new path in a formal waiver before merging.
- Add authoritative security tests (SQL-level RLS/row filters, membership revocation, concurrent consent changes, unauthenticated and cross-tenant requests), privacy impact assessment, WCAG 2.2 AA and AAC/switch/screen-reader tests before any actual participant pilot.

## CI evidence

PR #21 @ `21e43835d308883875ced5424fedd3f5ca48ddd7`: `Verify MapAble unified repository`, workflow run `42102759152`, completed `success`. Its only job (`verify-structure`) does NOT validate the RAG schema/permissions. The current PR adds a separate Node 22 deterministic test workflow for the shadow RAG contract. Do not claim CI passing until GitHub reports it at the new head SHA.

## Safe local test

From repository root:

```bash
node --experimental-strip-types --test apps/web/tests/ai-platform/care-support-rag.contract.test.mjs
```

This uses Node 22.16+, no database credentials or network; test fixtures are wholly fictitious.
