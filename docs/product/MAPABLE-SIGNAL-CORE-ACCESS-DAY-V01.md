# MapAble Signal × Core × Access × Day — integration v0.1

**Status:** In development. Synthetic, default-off, no production writes or real-place claims.

## Architecture decision
One system of record for each concern. Core owns the existing NextAuth session, ConsentRecord, delegated permissions, communication preferences and AuditEvent. Access owns AccessPlace, AccessObservation and provenance. Day owns the deterministic participant-controlled plan and readiness calculation. Signal contributes an optional activity and evidence question, not another database or authority.

## Grounded sources and constraints
- Framework: https://docs.google.com/document/d/1-VNcrJ4N_TEf3kjXYt1Wls0ij_-Nv9e9QTIlFiYTan4/edit — MapAble Access Signals RAGU working draft v0.1 (7 November 2026). Proposed methodology, not certification.
- GAIS staging: https://drive.google.com/drive/folders/1E_uj_EBOXuh9nT5LTz6YEvjlHwrtDt1a — README - import review.md.
- Day PR #32: https://github.com/ausdisau/MapAble/pull/32 — separate draft with synthetic scenarios and DayEval.
- Mapping Days UI PR #33: https://github.com/ausdisau/MapAble/pull/33 — separate synthetic public-facing preview.
- Legacy Access Signals PR #680: https://github.com/ausdisau/mapableau-new/pull/680 — prototype only, not a second source of truth.

Historical GAIS evidence: 7,318 placemarks across eight folders; 5,318 with coordinates and 2,000 without; 1,407 exact repeats; 3,911 distinct worldwide geocoded records; 3,752 distinct records inside an approximate Australia bounding box. The source counts are not accessibility outcomes, and the 2,000 non-geocoded aggregate records are not an NDIS provider directory. The staging package is not a live import. All staged records remain traffic_light_status=unknown and mapable_verification_status=unverified_legacy_import, regardless of old wheelchair icons or historical 'Verified' labels.

## Delivered in this branch
- Core: apps/web/lib/core/signal/participation.ts — a participant-reviewed private preview choice, not ConsentRecord or delegate grant; flags for sharing, GPS, submission and external writes are always false.
- Access: apps/web/lib/access/signal/day-evidence-projection.ts — scoped synthetic example that distinguishes unknown, reported, disputed, outdated and assessor-reviewed feature information; never asserts a verified route, participant fit or public Green.
- Access: apps/web/lib/access/signal/gais-staging.ts — pure legacy staging adapter; rejects any source traffic-light status other than unknown or verification status other than unverified_legacy_import, preserves historical provenance, refuses invalid coordinates; makes no external requests.
- Day: apps/web/lib/day/signal-participation-bridge.ts — optional pending practice item added to a copy of the synthetic Day plan; detects overlapping time and duplicate activity. No transport matching, worker allocation or calendar changes.
- UI: apps/web/components/day/SignalDayParticipationPanel.tsx — named selectors for challenge, contribution mode, optional role, synthetic Access evidence and time; explicit participant add/remove controls and accessible status announcement.
- App: apps/web/app/dashboard/day/page.tsx — same authenticated, default-off Day route; adds a separate default-off Signal flag.
- Tests: apps/web/tests/day/signal-core-access-day.test.ts — consent, provenance, GAIS, flags, no-green, no-write and Day readiness assertions.

## Access Signals policy
RAGU applies to assessed functional requirements, not to a whole person or entire venue. Unknown is not Green; N/A is separate; outdated and disputed are separate evidence flags. A critical unknown journey segment cannot silently be treated as a complete usable route. Accreditation remains a separate voluntary scheme. This prototype creates no rating, legal compliance certification or publication.

## Safeguards and acceptance
- No production flag activation, live observations, personal location or diagnosis, photo upload, marketing event or third-party data transmission.
- Consent to participate in a session-only exercise cannot authorise sharing; real sharing must use Core ConsentRecord and purpose-specific checks.
- Keyboard, screen-reader, AAC/switch, zoom/reflow 200–400%, accessible text/list route, touch targets, plain language and human testing required before production.
- Any later live Signal observation must use canonical Access evidence provenance, scoped review, source licensing, consent withdrawal and correction rights; people approve Day changes separately.

## Verification and delivery dependencies
GitHub MapAble Day validation workflow, repository-wide TypeScript, lint, targeted Vitest and WCAG acceptance must pass at the latest branch HEAD. No independent browser acceptance or production deployment verified at creation.
Merge order: review and merge PR #32 first; then this branch (which depends on the Day modules); then reconcile canonical Mapping Days PR #33. Port useful UX from legacy PR #680 only after reviewing ownership. Do not merge this branch to main before Day code is present, and do not activate flags without human release approval.

**Release decision: NO-GO for live MapAble Signal or Day data.** Only a bounded synthetic integration preview is in scope.