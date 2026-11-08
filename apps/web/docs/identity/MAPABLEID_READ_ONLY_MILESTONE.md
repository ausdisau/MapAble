# MapAbleID v0.3 — current-session read-only identity milestone

Status: consolidated draft based on merged legacy PR #676 and canonical draft PR #31; code review and end-to-end security/accessibility testing required. **No identity federation, account migration, extra MFA enforcement, or Neon schema writes.**

## Product decision

Expose a participant-first MapAbleID account summary using the **existing MapAble NextAuth v4 signed session** and **current Prisma application database**. This is not a new login issuer. The term "server_verified_read_only" means the web server obtained a valid current MapAble session and loaded its own user from Prisma. It **does not attest** original sign-in method, renewed MFA challenge, session revocation state, YubiKey hardware enrolment, identity proofing or AD.iD SSO.

Feature flag: \`MAPABLE_ID_DASHBOARD_ENABLED=true\` outside production only; default false and production hard disabled.

## Verified current canonical source (main SHA 4b8e848d8dae958e925cc46a158ac3485988ec53)

- \`app/api/auth/[...nextauth]/authOptions.ts\`: signed NextAuth JWT credentials, OAuth, passkey token and a separate 2FA path.
- \`lib/auth/current-user.ts\`: \`getServerSession(authOptions)\` followed by Prisma \`User.findUnique({id})\` and roles.
- \`lib/api/auth-handler.ts\`: \`requireApiSession()\` is the existing API guard.
- \`prisma/schema.prisma\`: \`User\`, \`ParticipantProfile\`, \`PasskeyCredential\` and \`ConsentRecord\` models already exist.
- \`app/dashboard/profile/page.tsx\`: existing profile with live passkey count and passkey enrolment panel.
- \`app/dashboard/consent/page.tsx\`: existing consent centre with revocation controls.
- MapAble in Sydney Neon; AD.iD separate US East project. Both have Managed Better Auth configured; **none is claimed as the currently running MapAble login authority** by this feature.
- Last read-only inspection (8 November 2026): MapAble legacy \`public.users\` had 19 rows, MapAble/AD.iD \`neon_auth.user\` each 0; these metadata counts must not be confused with the canonical Prisma application's \`User\` count or sign-in identity. Confirm deployment-specific DATABASE_URL before any future migration.

## Trust and data flow

1. Dashboard page \`/dashboard/identity\` enforces flag and existing \`requireAuth()\`.
2. Server service \`readOwnMapAbleIdSnapshot(actor)\` accepts a CurrentUser already established by the server; it does not accept a browser-provided account ID, target user, organisation, email, role or OAuth token.
3. Query only current-user preferred name, own stored passkey **count** and active unrevoked, unexpired consent **count** with a recorded user/organisation recipient. A consent record is not proof of delegate authority.
4. Pure presenter builds a small, allowlisted \`MapAbleIdReadSnapshot\`; never serialise raw database models, password hashes, passkey public keys, tokens, NDIS numbers, third-party client identifiers, consent recipients or sensitive health data.
5. \`GET /api/identity/me\` uses the existing \`requireApiSession\` guard, ignores client-supplied identity, returns no-store private JSON, rejects query arguments, and fails closed on errors.
6. Screen uses existing \`DashboardAppShell\`; **no duplicate main landmark** and no separate login.
7. Both existing profile passkey registration and consent management live on their existing, separately authorised routes. The new identity view offers links, not write actions.

## Known constraints and security findings

- The current NextAuth JWT lifetime is 30 days. Valid signature and matching database user do **not** prove immediate session revocation. Do not claim otherwise.
- Current JWT has an \`mfaVerified\` indicator merged into session; do **not** use it for recent step-up privileges in this read-only feature.
- Existing passkey registration handlers exist, but this summary does not validate hardware-backed credentials, user verification, current passkey authentication or whether a credential is still usable.
- Some existing app permission policies are role-wide. This feature does not extend them to cross-participant identity reads.
- AD.iD federation issuer, audience, consent, state/nonce and account linking remain separately gated; matching email is never sufficient to merge accounts.
- The MapAble Neon SQL instance previously inspected exposes \`public.users\` with its own \`password\` and finance/NDIS fields, separate from canonical Prisma \`User.passwordHash\`. Treat schema reconciliation and secrets-at-rest inspection as **a separate high-priority security review**, not a migration to run here.
- Existing code may log current-user IDs in debug agents; verify production logging/redaction separately before launch. No new logging of these data is introduced here.

## Acceptance criteria

- Disabled by default and disabled in production; no screen/nav/API exposure.
- Authenticated user sees their own name, email and role from the server, correct own credential/consent counts; no cross-account reads.
- Unauthenticated API request gets 401 with no account information, and unauthenticated page follows existing sign-in flow.
- Forged user-id filters rejected; no PII outside own metadata.
- DB unavailable returns 503 API or an accessible in-page error; neither silently falls back to fictional user.
- Screen is navigable by keyboard, AAC/switch, screen reader and at 200–400% zoom; 44px target equivalents, high contrast, no colour-only state; WCAG 2.2 AA design target and manual user acceptance **pending**.
- Unit: \`node --experimental-strip-types --test apps/web/tests/identity/mapableid-read.contract.test.mjs\`.
- Full \`pnpm type-check\`, \`pnpm lint\`, \`pnpm test\`, \`pnpm build\` and Playwright auth/accessibility checks are independent gates. A green structural/contract workflow does not prove production readiness.
- When dashboard PR #26 lands, reconcile the new nav item; keep one nav link and one main landmark.

## Release gates and rollback

**GO:** draft PR, code review, synthetic/sanitised development test using verified existing auth.
**NO-GO:** production activation, cross-app SSO, passkey/MFA enforcement, account migration, live AD.iD token exchange, delegate invitations or database schema writes.

Rollback: leave or set \`MAPABLE_ID_DASHBOARD_ENABLED=false\` and revert branch changes. Existing login, profile, passkeys and consent centre remain unchanged.

Owner for the next gate: MapAble identity/security owner and participant accessibility reviewers. They must reconcile production \`DATABASE_URL\`, canonical Prisma models, current sessions, incident/recovery design, cross-region AD.iD posture, admin support workflows and explicit release approval.

## Reconciliation of legacy PR #676 into canonical PR #31

- **Single flag:** `MAPABLE_ID_DASHBOARD_ENABLED`, matching the merged legacy implementation. Previous `MAPABLEID_READ_ONLY_ENABLED` is no longer recognised by this canonical feature. It remains off by default and hard-off in production.
- **Six sections:** overview, sign-in/security, trusted people, connected services, privacy/consent and accessible recovery, adapted from legacy `MapAbleIDScreen.tsx` without introducing a second `main` landmark or misdirected links.
- **Canonical data minimisation retained:** account, passkey count and consent count from the existing NextAuth/Prisma server identity. No synthetic JWT session ID, invented expiry, credential identity or token proof.
- **Adapter status added safely:** NextAuth existing authority; WebAuthn existing separate routes; Google Identity Platform MFA and AD.iD federation disabled. No new auth adapter executes, authenticates users or grants rights.
- **Service descriptions:** other AD Ltd services are not marked connected based on an email or MapAble login.
- **Legacy policy not adopted as a live enforcement gate:** its externally supplied `verifiedByServer` and synthetic `nextauth:userId` session reference are inappropriate for authenticating an API request. The existing `requireApiSession` and own-user Prisma queries remain authoritative. A future policy engine needs verified issuer/subject, genuine session-binding evidence and proven revocation semantics before enforcement.
- **Legacy migration is PROPOSED only:** the separate legacy SQL must not be applied to Neon. Existing Prisma entities take precedence; resolve overlaps through review, not duplicate grants/consents tables.
- **Security correction:** legacy `passkeys > 0` must not label a physical YubiKey configured. Canonical screen only reports stored passkey count and attestation unknown.
- **Review goals:** test keyboard focus when switching sections, screen-reader announcement, content at 200–400% zoom, reduced-motion, assistive technology and participant-led recoverability. Inaccessible or missing reset pathways block rollout.

Merged reference: https://github.com/ausdisau/mapableau-new/pull/676
Canonical draft: https://github.com/ausdisau/MapAble/pull/31
