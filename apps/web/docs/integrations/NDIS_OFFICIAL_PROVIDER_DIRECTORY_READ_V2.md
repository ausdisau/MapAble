# MapAble NDIS Adapter v2 — real public provider-directory read

**Status:** In development. The implementation can read actual, previously ingested public NDIA Provider Finder records. **No production data import, approved source hash or deployed response was independently verified in this change.** This is not a private NDIA API integration, an NDIS Commission provider-status verification, or worker-screening verification.

## Decision

Move the first NDIS Adapter lane out of synthetic-only demonstration by using the existing canonical MapAble public NDIA Provider Finder ingest model and a manually approved, source-hashed **read-only** query.

Retain separate prohibited lanes for individual worker screening, participant plans, NDIA claims/payments and live marketplace transactions.

## Evidence ledger (8 November 2026)

| Source or implementation | Evidence status | Consequence |
|---|---|---|
| NDIA Provider Finder | Current official public directory: https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder | Public provider data, not individual worker records; official page shows source as-of date. |
| NDIS Commission Provider Register | Current official public CSV and register: https://www.ndiscommission.gov.au/provider-registration/find-registered-provider | Distinct authority for registration status; downloadable CSV confirmed, exact current header schema not independently inspected here. |
| Canonical MapAble ingest | Implemented, not independently verified: apps/web/lib/ingestion/ndis-providers.ts and Prisma NdisProvider/NdisProviderIngestionRun | Existing code imports public NDIA provider finder JSON. Falls back to local file if remote unavailable, so the new adapter REJECTS file:// sources. |
| Provider importer and Commission CSV branches | In development: PR #15, PR #18 and PR #19 | More robust staged snapshots and Commission-status publication exist as separate draft work. Do not conflate with current main schema or presume they were merged. |
| NDIA restricted APIs | Official onboarding: https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems | NDIA Digital Partnership Office access and authorised technical pack needed. Not used. |
| Worker screening | Official authorised system: https://www.ndiscommission.gov.au/workforce/worker-screening | Not publicly searchable by ordinary API request. No worker-level status is asserted. |
| Digital platform registration | Official: https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital | New provider must satisfy applicable 0137 registration rules before operating a regulated NDIS marketplace. |

## Architecture and data provenance

\`\`\`text
Public NDIA Provider Finder JSON (official URL)
    -> Existing operator-controlled MapAble ingestion
    -> NdisProviderIngestionRun (source URL / SHA / started / finished / status)
    -> NdisProvider rows (source URL / updatedAt / provider-level fields)
    -> Operator approves source SHA + enables read flag
    -> /api/ndis/provider-directory (rate limited, bounded, read-only)
    -> /ndis/official-providers (accessible non-map search)
\`\`\`

The adapter's source policy requires:
1. Explicit \`MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED=true\`, otherwise no data is released.
2. Latest ingest run \`status=success\` with valid record count and finished timestamp.
3. Exact allowlisted official NDIA HTTPS source URL: **no** \`file://\`, arbitrary domain, redirects or fake source.
4. \`MAPABLE_NDIS_APPROVED_SOURCE_SHA256\` matches the 64-character raw source hash from the reviewed run; approval is not automated.
5. Ingest finished no more than **14 days** ago; older or future-dated runs fail closed.
6. Read only records with the same official source URL and update timestamps between the selected run's start and finish, to avoid including rows carried over from older imports.
7. Query results expose only public directory fields; never return stored raw JSON, email/phone, account records, worker names, clinical data or participant financial details.

The existing NdisProvider ingestion table is an *upsert table*, not an immutable, release-pointer-backed snapshot. The time-window filter and approved hash reduce stale leakage but **do not provide the stronger publication guarantees planned in PR #15 and PR #19**. Independent integration tests using actual source bytes and DB transactions remain required before enabling externally.

## Official provider vs worker claims

A record displayed by this adapter means: *a provider/outlet appears in the reviewed public NDIA Provider Finder data*. It does NOT mean that the NDIS Commission verifies its current Approved/Suspended/Revoked state at query time, or that any specific worker is cleared, competent, employed, safe or available.

Return \`currentRegistration=not_independently_verified\`, \`workerScreening=not_independently_verified\`, \`competence/availability/accessibility=unknown\`.

Where the embedded source date is absent, show \`sourceAsOf=null\` and "not supplied" rather than inventing freshness. To confirm current registration, open the separate NDIS Commission Provider Register and inspect latest published decisions.

## API contract

\`GET /api/ndis/provider-directory\` is a public read-only endpoint for *public provider-level data*, rate-limited to 30 requests/minute per client IP and default-disabled. Query parameters: \`q\` (2–80 characters), \`state\` (Australian state/territory), \`postcode\` (4 digits), \`page\` (1–20), \`limit\` (1–20). At least one search filter is required.

Success includes:
- \`available=true\`, \`source=official_ndia_provider_finder_import\`
- official URL, approved source SHA-256, import-finished date and count
- a bounded page of real source records and explicit unverified/unknown fields
- a non-exhaustive-search disclaimer.

No approved snapshot: HTTP 503 with \`OFFICIAL_SNAPSHOT_UNAVAILABLE\` and a reason. The endpoint does not silently fall back to demo records or public raw data dumps. Input rejection: HTTP 400. Rate limit: HTTP 429. Database failure: HTTP 503 without raw error or PII.

\`GET /api/admin/ndis-platform-adapter\` adds read-only \`officialProviderDirectory\` readiness to the existing four-lane status object. The admin page displays review state and links to the public search route.

## Operator activation procedure (do NOT activate automatically)

1. Inspect the exact NDIA source URL and current provider finder source date; confirm permitted usage.
2. Run the existing ingestion **dry-run** in a controlled environment. Verify URL, JSON schema, count, extract as-of date, data minimisation, upsert provenance and the official source hash. Do not accept local fallback or synthetic files.
3. Run authorised official-source ingestion only after independent quality and privacy checks. Review the latest \`NdisProviderIngestionRun\` and ensure all expected rows were updated inside its recorded window.
4. A human operator records approval of this exact source and hash; set the following in a separately controlled deployment environment, **not** source control:
   - \`MAPABLE_NDIS_OFFICIAL_DIRECTORY_READ_ENABLED=true\`
   - \`MAPABLE_NDIS_APPROVED_SOURCE_SHA256=\` followed by the operator-reviewed 64-character hash.
5. Run participant-level search using a real official record from the snapshot; check the source date, fields, no demo fallback, no worker screening inference and no old-run records.
6. Capture accessibility, security, API performance, schema/column drift and legal review evidence. Retain the ability to return to disabled by removing the read flag.
7. Reapprove the hash after each legitimate new official ingestion; once the record age exceeds 14 days, automatically stop serving data until a new reviewed snapshot exists.

**Do not run this procedure in production solely because the draft PR was created or tests passed.**

## Tests and accessibility

Run the isolated contract workflow and full repository \`pnpm type-check\`, \`pnpm lint\`, \`pnpm test\`, \`pnpm build\` as available. Verify API rate limits, role controls of admin views, pagination, failed/upsert-overlap sources, stale data, partial imports, no worker screening claims, and no personally sensitive disclosure. Use manual and automated WCAG 2.2 AA testing with keyboard, 200–400% zoom, screen readers, AAC, switch navigation and accessible feedback; no conformance claim yet.

When no official MapAble snapshot is approved, always provide the official NDIA Provider Finder and Commission Provider Register links and a human-supported search route. Do not make users choose a worker on the basis of registration alone.

## Unresolved and gated next steps

- Merge/reconcile the vetted versioned import and Commission provider-status dataset from draft PRs #15/#18/#19, rather than creating a second production database.
- Complete legal review of the NDIS digital-platform 0137 applicability and independent safety/accountability controls.
- Integrate authorised individual worker screening **only through approved access**, without portals scraping.
- Repair legacy NDIA fake/mock \`submitted\` accounting states before any actual government claim transactions.
- Obtain separate Digital Partnership Office approval, authorised endpoint specs, cyber assessment and human release approval for private NDIA plan/claims APIs.

**GO:** draft review of a real-source, read-only provider directory adapter. **NO-GO:** live NDIA claims, worker clearance decisions, payments, bookings, or platform-operation claims.
