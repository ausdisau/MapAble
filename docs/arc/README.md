# MapAble ARC — Carer Gateway, worker screening, A2A/MCP and TDSII research

**Status:** synthetic/read-only development slice; no production release or formal partner integration. Prepared 2 November 2026 for `ausdisau/MapAble`.

## Purpose and scope

A participant/carer-facing ARC section in Expo with: Carer Gateway NSW1 guidance, provider-neutral screening verification instructions, a prototype agent-exchange decision gate, and TDSII research status. The Benevolent Society is listed by the national Carer Gateway directory as NSW1 lead provider; that fact does **not** establish NDIS registration, availability, care capability, or screening of workers.

## Trust boundaries

- Carer Gateway guidance: read-only; direct to official directory, contact, complaints and urgent respite options. No new MapAble account required for general information.
- Worker screening: no public personal clearance lookup. Registered providers use new Commission Portal from 12 October 2026; unregistered providers/self-managed participants continue existing portals. Clearance, provider registration and enforcement are distinct records.
- Agent exchange: A2A v1.x and MCP are **architecture targets**, not deployed endpoints. There is **no live agent card, server, token exchange, remote MCP invocation, real provider inbox, referral, booking or funding integration**.
- TDSII: existing FormHug research draft has 14 attitudinal statements, voluntary consent, seven perspective options, no recorded submissions at 2 November 2026. Standalone React/Vite ZIP was not attached or found in available files. This repository slice does NOT include or build that app, nor does it submit to FormHug.
- Carers Star is a licensed third-party assessment. No Carers Star scoring, copying or digital impersonation.

## Existing code integration

- Add `ArcHubScreen` as a separate `ARC` screen to `apps/mobile/App.tsx` existing static tab navigator. No change to authenticated identity scopes; current mobile token supports only identity/accessibility.
- `apps/mobile/src/features/arc/agentBridgePolicy.ts` is deterministic prototype policy for local previews. **Do not equate client policy checks with server authorisation.**
- `apps/mobile/src/features/carer-gateway/*` is adapted from prior read-only policy prototype. No storage or access to health records.

## A2A to MCP design

```text
Participant / authorised supporter, accessible MapAble UI
  -> consent / purpose / role selection (human-authored)
  -> server authenticated proposal inbox and policy control plane [NOT IMPLEMENTED]
  -> A2A message envelope (verified agent identity, task id, audience, lifetime, nonce, purpose) [NOT IMPLEMENTED]
  -> provider agent proposing response [NOT IMPLEMENTED]
  -> MapAble agent policy gate -> explicit participant/human review
  -> allowlisted, least-privilege MCP read-only tools [NOT IMPLEMENTED]
  -> audit receipt + status/correction mechanism [NOT IMPLEMENTED]
```

A2A: agent discovery, interoperable messaging and task lifecycle. MCP: permission-scoped access to read-only tools/evidence sources. Never allow an untrusted provider A2A message to trigger MCP tools. The user/delegate's decision authority, service-specific permissions, recipient consent and server-side policy are required at every consequential transition. Signed agent cards and HTTPS prove *agent transport identity only*, not consent, provider quality, care competency or worker clearance. A2A specs: https://a2a-protocol.org/latest/specification/ . MCP: https://modelcontextprotocol.io/specification .

### Allowed future MCP tools (design only)
- `arc.public_provider_search`: public facts with evidence and timestamp, no availability inference.
- `arc.public_carer_gateway_info`: current service provider region and contact, read-only.
- `arc.public_worker_screening_guidance`: official process guidance; **not individual status**.
- `arc.public_research_status`: approved non-sensitive research protocol metadata only.

### Prohibited by default
- `arc.private_worker_clearance`, `arc.send_referral`, `arc.collect_tdsii` or any booking, assessment decision, funding or live AI processing. Do not publish discoverable A2A Agent Cards for disabled services.

## Governance decision: ALLOW_WITH_SAFEGUARDS (prototype only)

Before protected data or agent transport:
1. Complete registration/data source legal review (NDIS vs Carer Gateway vs aged care); verify exact provider ABN independently.
2. Review privacy collection, use and disclosure lawful basis and separate carer/care recipient authorisations; tenant isolation, rights audit, DPIA, breach response.
3. Server-side ABAC/PBAC for every request, purpose/role/recipient/expiry-bound consent, revocation and auditable human approvals. Authenticated agent-to-agent transport with mTLS/TLS, OAuth/OIDC, replay protection, rate limiting, SSRF controls, key rotation and allowlisted trust registry.
4. Confirmation of any worker status ONLY from an authorised Commission portal and only on a need-to-know basis; recheck expiry and role training; no automatic 'safe' labels.
5. TDSII human-reviewed research protocol and consent, accessible no-AI option, ethics/privacy governance, deletion/withdrawal, small-cell suppression and non-identifiable grouped reporting. No raw survey data feeding AI matching, enforcement, price decisions or provider grading.
6. WCAG 2.2 AA verification: Android TalkBack, iOS VoiceOver, keyboard and switch access, AAC text input, 200–400% zoom, reduced motion, interrupted sessions, plain-language corrections and screen-reader navigation.
7. Expo production build, end-to-end device tests, CI/security and feature-flag review; verify deployed SHA and human release approval. Real external interactions remain held.

## Test commands

From repository root, Node 22+:

```bash
node --experimental-strip-types --test apps/mobile/src/features/arc/agentBridgePolicy.test.mjs
```

Local package test script (without GitHub dependencies):

```bash
node --experimental-strip-types --test tests/agentBridgePolicy.test.mjs
```

These are policy tests, NOT React Native emulator / accessibility / integration tests.

## Sources and document status
- National Carer Gateway provider directory: https://www.carergateway.gov.au/about-us/local-service-provider (checked 2 Nov 2026).
- Carer Gateway access: https://www.carergateway.gov.au/about-us/access-carer-gateway-services
- Worker screening portal routing: https://www.ndiscommission.gov.au/workforce/worker-screening (checked 2 Nov 2026).
- The Benevolent Society complaints: https://www.benevolent.org.au/get-in-touch/feedback-and-complaints
- Uploaded DSS `Carer Gateway Service Provider Operating Manual` v1.1 April 2020, FOI 2021-034, 114 pages: *historical*, sections 7.9, 8, 9 and appendix F. Its monetary amounts and older timeframes should not be used as current eligibility rules.
- ACQSC supplied workbook snapshot 29 Oct 2026; aged-care status is NOT an NDIS or Carer Gateway credential.
- FormHug research draft verified via connected form account: content structure, 0 submissions as inspected; source files for user's separate React/Vite survey not available.

## Outstanding decisions
- Obtain current TBS Carer Gateway internal procedural/partner documents and signed data-sharing authority, if any.
- Determine authorised organisational identity and person-specific consent system for participant/provider agents.
- Obtain the TDSII React/Vite source ZIP for standalone build and accessibility QA. Review ethics before backend connection.
- Confirm approvals and security owner before any deployment.
