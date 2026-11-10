# MapAble LocalLinks × Australian Disapedia × AccessiBooks (review-only integration)

**Date:** 2026-11-10. **State:** Pull-request implementation; disabled by default; no domain/production/MediaWiki changes.

## Source-of-truth separation

| System | Repository | Runtime/content authority | Integration |
| --- | --- | --- | --- |
| MapAble | \`ausdisau/MapAble\` | Next.js under \`apps/web\` | \`/locallinks\` and GET \`/api/locallinks/knowledge?q=\` |
| Australian Disapedia | \`ausdisau/AustralianDisapedia\` | The live MediaWiki database, revisions, editor permissions and cPanel origin | Public MediaWiki Action API, **read only** |
| AccessiBooks | \`ausdisau/AccessiBooks\` | Existing publisher/rights and accessible media backend, not the MapAble bridge | External link first; catalogue adapter only after the production API is proved |
| Existing MapAble Vercel | Vercel team MapAble | Current Vercel projects still link to migrated \`ausdisau/mapableau-new\` | Do not change production link/domain in this PR |

**Note:** Public DNS observed on 2026-11-10: \`disapedia.au\` used external \`ns1/2.syd5.hostingplatform.net.au\`; \`accessibooks.com.au\` and \`mapable.com.au\` used external \`nameserver.net.au\`; \`accessibooks.org\` used external \`name.com\`. DNS remains unchanged. Confirm records with the authoritative DNS provider in cPanel/registrar, not Vercel, before any migration.

## Delivered vertical slice

- \`/locallinks\` works without configuration; accessible links to source sites, explanation of provenance and no false catalogue claims.
- Search term submission is explicit: query text alone may be forwarded to the public MediaWiki API. Search is disabled unless \`MAPABLE_DISAPEDIA_SEARCH_ENABLED=true\`.
- Server-only \`DISAPEDIA_READONLY_ORIGIN\` is optional, defaults to \`https://disapedia.au\`; allowlisted hosts are \`disapedia.au\` and \`staging.disapedia.au\`. HTTPS required.
- \`GET /api/locallinks/knowledge?q=... \` provides bounded search results and version provenance; returns 503 disabled or 502 upstream unavailable. No caching of sensitive search terms. **No cookies, bearer tokens, private search, scraping, publication, submissions, editing, or cPanel credentials.**
- Returned external article URLs are validated against the actual origin.
- Consumers must not interpret an article, claim, draft Bill or government announcement as a legal status determination.

## cPanel / VentraIP deployment boundary

1. **Do not copy production \`LocalSettings.php\`, database backups, session keys or author identities to GitHub/Vercel.**
2. Provision a separate, non-production cPanel directory/subdomain for skin testing if cPanel staging is available; confirm PHP, MediaWiki and extension compatibility.
3. Use GitHub PR approvals, artifact checksum, reviewed release tag and cPanel Git Version Control *or* SFTP to deploy **skin code only** into the correct \`skins/AustralianDisapedia\` directory. MediaWiki core and DB should have their own checked upgrade procedure.
4. Back up current skin and config with private access controls; smoke-test editing, history, ACLs, anonymous pages, API visibility, HTTPS and mobile rendering before any release.
5. MediaWiki public Action API must explicitly allow the intended query modules; do not weaken private wiki read restrictions for MapAble.
6. Reverse proxying entire MediaWiki through Vercel is **not** part of this PR; cookie domains, CSRF, resource loader, redirects, canonical URL and cache headers can break login and edit history. Keep MediaWiki on its own origin.
7. AccessiBooks may use a separate Node/React frontend and VentraIP VPS: cPanel PHP hosting does not automatically execute Node.js API processes. Verify the actual runtime and app ownership before enabling catalogue integration.
8. Preserve existing MX/TXT/DKIM/SPF/DMARC when any DNS change is eventually authorised.

## Vercel connection requirement

A new Vercel project linked to \`ausdisau/MapAble\` was requested for an isolated preview, with \`deploy:false\`. Vercel returned **400: Login Connection to GitHub required**. No new Vercel project was created. An account administrator must add the GitHub login connection and grant this repository to Vercel. Afterwards, create a **separate protected** Vercel project from repo \`ausdisau/MapAble\` with root \`apps/web\`, confirm actual build settings, and deploy only the reviewed PR SHA. Never relink or reassign \`mapable.com.au\` automatically.

## Security & accessibility gates

- Verify automatic tests and build in GitHub CI; the files in this PR were not executed on a runtime in this connector session.
- Fail closed on upstream errors, invalid JSON, source host mismatch and disabled flag.
- Test keyboard-only, switch control, voice control, AAC, 200–400% zoom, VoiceOver, TalkBack, reduced motion, colour independence and clear external navigation.
- Audit public upstream policy and rate limits before enabling the search flag, including query privacy and uptime.
- Run an explicit accessibility and human editorial review before showing legal-resource recommendations as reliable.
- For eventual AccessiBooks API adaptation, authenticate media entitlements on the AccessiBooks server; never transmit private title history, subscription tokens or licensed download URLs to MapAble/Disapedia without specific participant consent and rights review.

## Go/no-go

GO: merge after QA into a protected branch, separately deploy an isolated preview once GitHub–Vercel login connection is fixed.

NO-GO: migrate DNS, cPanel database, app sessions, MediaWiki history, AccessiBooks rights/DRM data, production federation or enabled live search from this branch.
