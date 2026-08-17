# Phase 0 implementation report

## Scope

Phase 0 stabilised the public MapAble website only. It did not add app portal
features, payments, AI, transport dispatch, marketplace logic or provider
operations.

## Findings

- Framework: Next.js App Router with TypeScript.
- Package manager: pnpm.
- Database client: Prisma.
- Deployment target: Vercel configuration is present.
- Existing `/care`, `/transport` and `/access` routes depended on authenticated
  or database-backed app flows, which made them risky as public marketing pages.
- Public policy routes for privacy, terms, data deletion and accessibility
  statement were missing.

## Changes made

- Added public module pages for Care, Transport, Employment, Marketplace, Foods,
  Access, Peer, Telehealth and Providers.
- Added public information pages for About, For Providers, Pricing, Resources,
  Help and Contact.
- Added Privacy, Terms, Data Deletion and Accessibility Statement pages.
- Added a legacy `/accessibility-map` redirect to `/access`.
- Narrowed middleware protection so `/care` and `/transport` are public while
  their subroutes remain protected.
- Replaced unverifiable claims with safer wording:
  - "NDIS Registered" -> "Built for the NDIS ecosystem"
  - "Australian Data Sovereignty" -> "Data hosting and privacy controls under
    review"
  - "WCAG 2.1 AA Compliant" -> "Designed toward WCAG 2.2 AA accessibility"
- Replaced NDIS-plan-first onboarding copy with consent-first, optional document
  language.
- Replaced placeholder-style homepage metrics with pilot/status language.
- Added accessible global loading, error and not-found states.

## Verification targets

The Phase 0 public route set is:

- `/`
- `/care`
- `/transport`
- `/employment`
- `/marketplace`
- `/foods`
- `/access`
- `/peer`
- `/telehealth`
- `/providers`
- `/dashboard`
- `/resources`
- `/help`
- `/privacy`
- `/terms`
- `/data-deletion`
- `/accessibility-statement`

Additional public pages added for the Phase 2 marketing route list:

- `/for-providers`
- `/pricing`
- `/about`
- `/contact`

## Remaining work

- Formal WCAG testing is still pending.
- Hosting, backups, logs and subprocessors still need review before any data
  sovereignty claim.
- NDIS registration status must be legally verified before the site claims
  registration.
- App portal features should be handled in later phases.
