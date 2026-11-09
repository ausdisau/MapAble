# My Support — Participant Control Centre (v0.1)

**State:** Draft preview implementation; no production rollout or clinical/NDIS compliance assertion.
**Repository:** ausdisau/MapAble (canonical); branch feature/my-support-sovereignty-web-native-v01.
**Related:** MapAble Day LifeVal research prototype, draft PR #32 (independent; do not merge or rewrite PR #32 in this slice).

## Decision and problem

My Support is the participant's home for understanding, directing and challenging the support relationships on which My Day depends. Most provider portals show a roster controlled by someone else. My Support must instead preserve participant authority, communication access, supported decision-making and accountable service recovery.

## Delivered in this bounded slice

- Web: feature-gated, authenticated /dashboard/my-support route, with server-side participant-scoped reads of CareBooking and TransportTrip statuses, last update timestamps and links to existing managed workflows.
- Web: a local-only, fictional replacement-worker decision workbench. The selection cannot mutate any backend service or create a real decision receipt.
- Web: optional card on the authenticated dashboard, visible only when MAPABLE_MY_SUPPORT_PREVIEW_ENABLED=true.
- Mobile: Expo/React Native Support tab with a fully local fictional interaction, clearly separated from real support records and consent status.
- Evidence: deterministic status labelling distinguishes requested, arranged, underway, recorded-complete, disputed, disrupted and unknown; no inference that accepted = attended or that assignment = verified.
- Tests: pure status and decision-language unit tests in apps/web/tests/my-support/support-status.test.ts.
- Design: one primary focus per screen, high-contrast navy text with restrained blue/orange, 48pt native controls, scalable text, meaningful headings and readable status text.

## Constraints / NO-GO

- No changes to Prisma schema, migrations, database writes, NextAuth, worker assignments, billing, provider records, service agreements or existing consent authorities.
- No native login, native API session cookie reuse, credential discovery, push, location, SMS, EAS production build or automatic actions. Those require a separate reviewed authorization architecture.
- No live decision receipts, participant demands sent to providers, instant replacement workers, NDIS funding advice or verified care-delivery guarantees.
- No automatic transfer of personal information to AI models. A later AI assistant must remain advisory with independently enforced permission gates.
- Do not adopt the draft PR #32 Day planner as a production readiness proof. Review and integrate only through a subsequent separately gated PR.

## End-to-end journey

1. Participant signs in to the web app (existing NextAuth).
2. Server checks the My Support preview flag.
3. Server retrieves the participant's own minimal care and transport statuses, never the worker roster, coordinates, health notes or private profile.
4. A record status appears with a plain-language explanation distinguishing recorded information from delivery evidence; unexpected values remain unknown.
5. Participant opens the existing care, transport, consent, accessibility, billing or safeguarding workspace to perform authorised actions under their current controls.
6. Participant may practise a fictional cancellation decision. That option stays in page memory only, never reaching a worker or server.
7. If no records are found, explain that no connected record is not proof of no external supports.

## Accessibility / design acceptance gates

- WCAG 2.2 AA target on web: keyboard-only through decision controls and links; explicit focus; headings, fieldset and legend; screen-reader announcements of changes; 200–400% zoom/reflow; high contrast and reduced-motion testing.
- iOS VoiceOver, Android TalkBack, Switch Control, larger text, large touch targets, external keyboard where supported, AAC-friendly predictable controls and no timed action requirement.
- Participant research must include diverse physical, cognitive, sensory, psychosocial and communication access needs.
- Test low connectivity, no data, expired session, failed request, stale records, changed worker, disputed status, service outage and no verified substitute.
- No claims of conformance based on code inspection or automated tests alone.

## Designly and Visual Truth handoff

Designly art-direction locks: accessible participant-first hierarchy, exactly one primary question per decision panel, generous whitespace, no provider-centred dashboard, no colour-only statuses. Visual Truth may be introduced only in a development-only React web environment with local verification and no production imports. Do not add a WYSIWYG runtime to production or access real participant records through a visual editor.

## Next technical increment

1. Review identity and delegated-access matrix; verify provider and participant account boundaries.
2. Define append-only DecisionReceipt schema with actor, authority, reason, recipient, acknowledgements, consequences, consent scopes, timestamps and dispute route.
3. Implement a server-owned command workflow that checks current permission, worker evidence and care/transport dependencies before any state change, with idempotency, review and rollback handling.
4. Add an independent participant-controlled transition and data-export design without assuming universal provider portability.
5. For mobile, design verified OIDC / OAuth PKCE authentication, purpose-limited API access, encrypted storage only when necessary, and explicit disconnect/revocation semantics.
6. Review any later integration with MapAble Day PR #32 through its DayEval fail-closed tests.

## Test and release gates

- From apps/web, run: pnpm exec vitest run tests/my-support/support-status.test.ts; pnpm type-check; targeted ESLint for new files.
- From apps/mobile, run: npm run typecheck; then iOS/Android accessibility testing on devices.
- CI checks, visual review, independent privacy/security assessment and signed participant-led acceptance are required before changing the default flag.
- For the existing Vercel setup, create a separately protected preview project sourced from the canonical repo (apps/web root) only after review; do not attach the mapable.com.au domain or modify legacy production projects.
- App Store / Google Play delivery is a separate native build and release process; Vercel hosts the web project, not native binaries.
