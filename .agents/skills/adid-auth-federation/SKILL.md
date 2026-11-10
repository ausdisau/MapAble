---
name: adid-auth-federation
description: Safely implement AD.iD identity federation across Australian Disability Wix, Clerk, Neon, MapAble, AccessiBooks, CripSquare and MediaWiki. Use for identity, JWT, app linking, delegated roles and MCP authorisation work.
---

# AD.iD authentication agent skill

Treat `apps/adid` as an isolated experimental portal. Follow https://agentskills.io/home.md, review https://clerk.com/docs/guides/ai/skills.md and current Wix/Clerk/Neon documentation before writing code.

1. Inspect the live Wix **Editor** site (Wix Members and Velo) and existing `ausdisau/MapAble/apps/web` NextAuth before integration. Never treat a Clerk JWT as a Wix Member session.
2. Validate the OIDC issuer, signature via JWKS, intended audience, expiry, state/nonce/PKCE as appropriate, and existing browser CSRF/replay controls. Do not pass tokens in URLs.
3. Preserve existing users and accounts. The current Neon AD.iD project contains `neon_auth` plus `public.services`, `public.user_service_access` and `public.audit_events`. Do not run the uploaded Prisma migration without reconciliation.
4. Keep no-cost public reading and community browsing available independently of AD.iD where permitted. Never grant roles by email match or registration order.
5. Require accessible sign-in and recovery including AAC, switch access, slow interaction, keyboard, screen readers and human assistance. Supported decision-making does not mean handing the participant's identity to a delegate.
6. Do not allow production credentials, migrations, Wix Member writes, account linking or environment/DNS changes in an automated PR. Every sensitive change requires human approval and rollback.
7. For MCP, start read-only with explicit per-app scopes; separate identity, permission, consent and audit from agent planning.
8. Return source evidence, changed files, tests run, precise blocker, and GO/NO-GO decision. Never claim a deployed federation from a screenshot or a passing unit test.
