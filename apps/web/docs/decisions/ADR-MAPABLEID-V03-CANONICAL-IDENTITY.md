# ADR — One canonical MapAbleID read-only identity authority

Date: 9 November 2026 (Australia/Sydney)
Status: **Accepted for draft review only**, not permission to deploy, merge or migrate.
Repositories: canonical \`ausdisau/MapAble\`; historical merged reference \`ausdisau/mapableau-new\` PR #676.

## Context

Two independent MapAbleID v0.3 implementations now exist:

- Legacy PR #676 (merged in the legacy repository): six-section interaction, disabled external adapters, Prisma-linked user/delegate/session views, policy shadow, proposed unapplied schema.
- Canonical PR #31 (draft): own-user NextAuth session, minimal Prisma metadata, explicit unverified security claims, feature hard-off in production, dedicated contract workflow.

The legacy implementation constructed a synthetic \`nextauth:userId\` policy session identifier and \`Date.now() + 1h\` expiry as though it represented authentication assurance, which it does not. It also inferred a physical YubiKey as configured from any stored passkey. Copying these assumptions into canonical MapAble would misrepresent authentication assurance.

The canonical repository already has a NextAuth v4 JWT issuer, independent WebAuthn passkey routes, existing consent and delegate management, and \`User\` and related Prisma models. AD.iD Managed Better Auth on a US East Neon database remains separate and must not become an issuer without independent cross-border/privacy and recovery assurance.

## Decision

1. Preserve **NextAuth JWT as the only existing MapAble login authority** for this feature. The feature does not change sign-in, MFA, account recovery or passkey enrolment.
2. Set exactly one feature flag, \`MAPABLE_ID_DASHBOARD_ENABLED\`, default **off** and **blocked when NODE_ENV=production**.
3. Retain \`GET /api/identity/me\` and \`/dashboard/identity\` with the existing \`requireApiSession\` and \`requireAuth\` server guards; use only the current account as subject.
4. Merge the *accessible six-section interaction* into the canonical page, not the legacy token-issuer or synthetic session claims.
5. Keep current-user name, email, role, credential **count**, and active recipient-directed consent **count** as allowlisted metadata. Do not expose delegate names, session identifiers, credentials, user IDs, raw consents, health records, NDIS numbers, tokens or secrets in this slice.
6. Mark Google Identity Platform MFA and AD.iD federation disabled; describe existing WebAuthn separately, without attesting actual hardware or recent verification.
7. No new Prisma migrations, \`neon_auth\` changes, inter-region data transfers, account linking or SSO.

## Security decisions

- A NextAuth JWT indicates a validated current app session and a corresponding Prisma user, **not a revocation guarantee or fresh phishing-resistant challenge**.
- No email-only identity linking across any AD Ltd application.
- A consent record does not establish legal authority for a delegate. Existing, separately authorised pages manage consents and delegates.
- A passkey credential row is not evidence that a physical YubiKey is present.
- User-supplied role/subject/session/issuer query parameters are not accepted by \`/api/identity/me\`.
- Avoid copying the legacy policy-shadow construction into server authorisation; introduce a real verified session binding and revocation service only in a future separate project.

## Accessibility and acceptance

Design target: WCAG 2.2 AA with screen readers, keyboard-only access, AAC/switch access, focus announcements, no colour-only indicators, minimum 44px controls and 200–400% zoom. The existing dashboard shell already owns the main landmark and skip link; the identity component must not add a second \`main\`.

Human support must remain available without requiring password disclosure or assumed caregiver takeover. Deep links to existing security, delegates, privacy and recovery routes need manual operation checks. Accessibility acceptance is pending and no conformance is claimed.

## Alternatives rejected

- Switching MapAble sign-in to Neon Managed Better Auth or US East AD.iD now: duplicates session authorities, presents residency/APP 8 risks and could strand existing participants.
- Copying all legacy code verbatim: fabricates session identifiers/expiry for policy, overstates hardware and returns unnecessary session/delegate details.
- Applying legacy SQL proposal: duplicates existing Prisma grant and consent models and has not passed schema/privacy review.

## Delivery gates and rollback

GO for the draft-only UI/API implementation and independent tests. NO-GO for production exposure, external federation, MFA enforcement, new provider entitlements, SQL migration or account linking.

Rollback: unset \`MAPABLE_ID_DASHBOARD_ENABLED\`. Both screen and endpoint are hidden, and existing login, passkeys, consent and recovery remain unmodified. Review the current repository status before attempting merge.

Reference: https://github.com/ausdisau/mapableau-new/pull/676
Canonical draft: https://github.com/ausdisau/MapAble/pull/31
