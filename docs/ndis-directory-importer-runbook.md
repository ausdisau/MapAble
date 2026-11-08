# MapAble NDIS Service Provider and Outlet Importer — deployable pipeline

**Status:** Development-ready implementation, not a production deployment. **Date:** 2 November 2026.
**Repository:** canonical ausdisau/MapAble. Requested ausdisau/mapable-new returned 404 to connected GitHub; accessible legacy source is ausdisau/mapableau-new.

## Source evidence and trust
Official NDIA export: https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json .
The official Finder currently displays “Data as of 12 October 2026”. Direct JSON can be large (>45 MB) or blocked for automated clients. A bundled export may be historical and is never silently substituted for official. Independently verify current registration at https://www.ndiscommission.gov.au/provider-registration/find-registered-provider .

The NDIA field Active marks activity IN THAT DIRECTORY only. It does not establish current Commission registration, capacity, worker-screening status, worker competence, access needs, service availability, safety or funding suitability. The importer stores no worker-level clearance, medical, participant or financial records.

## Technical implementation

- Existing canonical stack: Next.js 15, PostgreSQL, Prisma 6, Zod 4, pnpm. No new Drizzle deployment. Legacy NDIS data models remain unchanged.
- Pure normaliser: lib/ingestion/ndis-outlet-import-core.ts. Supports official flat data and bounded nested outlets; validates ABN checksum; uses stable org/outlet identities without row-index fallbacks; maps numbered RegGroup categories; identifies duplicate conflicts and rejects malformed rows. More than 5% rejected records blocks staging.
- Additive database tables: ndis_directory_import_runs, ndis_directory_organisations, ndis_directory_outlets, ndis_directory_publications, plus migration under prisma/migrations/20261102130000_ndis_directory_versioned_import.
- Versions are immutable and staged in bounded batches; publication switches a single atomic pointer after exact hash, operator, quality and source-date review. Failed partial imports cannot become published. Old snapshots stay available for rollback. Existing provider_outlets/ndis_providers are not mutated.
- Import service: lib/ingestion/ndis-outlet-import-service.ts. Enforces 80 MiB source size, fixed official endpoint, explicit operator-local/bundled choices, SHA-256, write feature gate and manual publication.
- Admin URL: /admin/ndis-outlet-importer (authorised administrator only). API POST /api/admin/ingest/ndis-provider-outlets is rate-limited and PREVIEW ONLY. It has no arbitrary URL, upload, DB writes or publish action.
- Operator CLI: scripts/ndis-directory-importer.ts. Modes preview, stage, status and publish. Bulk writes are CLI-only, not long-running serverless routes.
- Automated: pure normalisation tests and isolated PostgreSQL stage/publish integration. No secrets in GitHub, no production DB calls.

## Controlled deployment (no automatic production activation)

1. Obtain explicit owner approval, inspect exact PR/commit, record source terms and export date, review privacy/accessibility, and complete DB backup and restore rehearsal.
2. In the intended deployment environment, after merging through human-reviewed PR: cd apps/web ; pnpm install --frozen-lockfile ; pnpm exec prisma validate ; pnpm exec prisma migrate deploy ; pnpm exec prisma generate .
3. Run a no-write preview: pnpm exec tsx scripts/ndis-directory-importer.ts --mode preview --source bundled .
   Or explicitly choose --source official; WAF failure aborts, no silent bundled fallback.
   For operator-supplied 45 MB data, use --source file --file /trusted/path/list-providers.json .
4. Record source SHA-256, source as-of date, organisation/outlet counts, schema warnings and rejects. Reject unknown/unsupported source dates unless reviewed; do not present imported timestamps as proof of freshness.
5. In a restricted job runner with a short-lived DB credential, set NDIS_DIRECTORY_IMPORT_WRITES_ENABLED=true and NDIS_DIRECTORY_IMPORT_OPERATOR=approved-operator-id (never set write flag in public Next.js runtime).
6. Stage only after reviewing preview: pnpm exec tsx scripts/ndis-directory-importer.ts --mode stage --source file --file /trusted/path/list-providers.json --expected-hash HASH .
7. Inspect run ID and audit evidence; run pnpm exec tsx scripts/ndis-directory-importer.ts --mode status .
8. Separate accountable publish approval: pnpm exec tsx scripts/ndis-directory-importer.ts --mode publish --run-id STAGED_UUID --expected-hash HASH --expected-current-run-id none --operator approved-operator-id --confirm-publish .
   Replace none with existing published run ID when replacing a published version; if the source has no embedded date require --acknowledge-unknown-date and written rationale.
9. Rollback by publishing a previous valid staged run with the current run ID as the expected pointer. Never delete prior snapshot or overwrite raw rows without separate retention approval.
10. Record migration, import, data hash and published pointer, plus deployed SHA, operational alerts, recovery plan, human approvals and device accessibility-test evidence.

## Integration and release boundaries

- Publication does not automatically replace existing Provider Finder search or enable Marketplace PR #10/#14, AI A2A/MCP, service booking, payments or worker verification. The imported source is a staged data asset requiring a separate opt-in read adapter and participant-led UX before public exposure.
- Do not join providers solely by similar names; valid ABNs group where supported, unmatched IDs remain explicitly unverified. Multiple outlets can belong to one organisation. Service area and physical outlet address are distinct facts.
- No uploaded JSON or arbitrary upstream URLs are accepted from browser forms. Site and credential controls belong to MapAble Core; no model agent may operate ingestion or publish.
- Keep current regulatory registration, Commission enforcement, worker screening, registered-provider obligations and the participant's own NDIS plan separate. Human checks required for all consequential uses.

## Acceptance gates

G0 source provenance and right to reuse; G1 Prisma migration/backup; G2 deterministic validation and acceptable rejection count; G3 protected admin/CLI security; G4 controlled stage and atomic human publication; G5 participant-led WCAG 2.2 AA, AAC, keyboard, TalkBack, VoiceOver and switch tests for any released search UI; G6 production operations, alerts, rollback and explicit human go/no-go.

**Decision:** suitable for code review and synthetic CI/staging after all passing checks. HOLD production migration/publication until a named operator has approved deployment and current source reliability.
