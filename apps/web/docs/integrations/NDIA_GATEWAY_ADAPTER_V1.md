# NDIA API Adapter — fail-closed synthetic contract v1

**Claim status:** Implemented contract only, **not independently verified against NDIA technical specifications**. Government access: **not verified**. No live transport, real claims, participant-plan reads, regulatory certification or NDIA partnership is implemented.

## Decision

Implement a narrow, testable NDIA gateway boundary for MapAble, separate from the Department of Health, Disability and Ageing (aged-care B2G), Australian Digital Health Agency (FHIR / My Health Record), Services Australia, and the **NDIS Quality and Safeguards Commission** (provider register and worker screening).

This adapter uses local fictional data only. It is **not** a client for an authenticated government API. Its contract is an internal MapAble preview, not an official OpenAPI definition.

## Evidence ledger

| Finding | Status | Evidence / consequence |
|---|---|---|
| NDIA direct and indirect APIs exist for approved providers, plan managers and aggregators | Official source | https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems (17 July 2026). |
| Aggregators need a registered-provider partner and additional cyber evidence | Official source | NDIA onboarding guidance at the same link. |
| Architecture, ASIC extract, terms, cyber evidence and technical review required | Official source | Same NDIA source; no MapAble approval inferred. |
| Specific endpoint paths, auth contracts and response schemas | Unverified | Supplied after NDIA onboarding; do not invent paths such as /v1/provider/claims. |
| Provider portals now use myID and RAM, replacing PRODA | Official portal guidance | https://ndis.gov.au/myplace-provider-portal-and-resources. Do not assume portal login is the approved API authentication protocol. |
| NDIS digital-platform registration requirement from 1 July 2026 | Official source; MapAble applicability needs legal review | https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital. |
| Existing local NDIA claiming client supports HTTP and mock mode | Implemented, not independently verified | lib/ndis/provider-claiming/ndia-api-client.ts; **not proof of approved API connectivity**. |
| New synthetic contract and read-only status | In development | lib/ndis/api-gateway/ndia-gateway-contract.ts, admin route and tests. |

## Domain and identity ownership

- MapAble Core owns authenticated identity, role/organisation boundary, participant consent and audit.
- MapAble NDIS Claiming owns draft evidence, pricing validation and human-reviewed invoices. Funding-management routes must not be interchanged.
- A future authorised NDIA transport may own only agreed NDIA API requests, response validation and vendor-specific authentication, **after specifications are actually obtained**.
- No provider registration or worker screening status is inferred from a successful NDIA API response.
- A participant's decision-making and communication preferences remain authoritative. AI agents cannot approve NDIA claims, override consent, or make eligibility decisions.

## Current initial contract

- \`getNdiaGatewayReadiness()\` is read-only and returns **no NDIA credentials or participant PII**.
- \`previewNdiaClaimLocally(input)\` accepts exactly four synthetic fields, including a \`demo_\` test case ID. It makes **zero HTTP requests**, stores nothing, and always reports \`notSubmitted: true\` and \`governmentReference: null\`.
- \`assertNdiaTransportNotImplemented()\` always throws to prevent premature integration.
- \`/api/admin/ndia-adapter-readiness\` requires existing admin permission.
- The existing integration registry's NDIA health check now correctly reports **degraded/unverified**, never healthy solely because a flag was enabled.
- \`MAPABLE_NDIA_ADAPTER_SYNTHETIC_ENABLED=true\` enables a synthetic preview **only outside production**; it cannot enable live claiming.
- No schema migrations, secrets, real government tokens, data ingestion or external calls.

## Pre-existing risks discovered — not fixed by this isolated adapter

1. \`lib/ndis/provider-claiming/ndia-api-client.ts\` assumes \`client_credentials\` and a default \`/v1/provider/claims\` endpoint. Neither is verified by publicly available NDIA OpenAPI evidence. It can issue HTTP under legacy environment flags: **independent release blocker**.
2. Mock responses return \`submitted_mock\`, and \`claim-service.ts\` can then record a claim as \`submitted\` internally: **requires redesign before production or public claim**.
3. \`claim-service.ts\` currently checks the local approval record only in certain circumstances; review legal authority, human approval, tenant checks, idempotency, replay prevention and consent prior to any live submission.
4. Do not treat \`NDIA_REAL_SUBMISSION_ENABLED\`, OAuth-style tokens, provider claims of registration, or NDIS registration alone as operational approval.
5. NDIS digital-platform registration may apply to MapAble's matching/payment business model; obtain legal determination and official status before launch.

## Future adapter contract after official approval

- Obtain verified API specification and version from the authorised NDIA developer portal.
- Separate provider/plan-manager capability and per-organisation approved scope.
- Use NDIA-approved authentication and machine identity, never reuse myID/RAM browser sessions or invent PRODA/token endpoints.
- Encrypt credentials with server-side vault, keep audit payloads minimal, and record consent/authority receipts.
- Validate real request schemas, endpoint allowlists, response signatures when required, idempotency keys, correlation IDs, replay protection, retries, timeout budget and reconciliation.
- Fail closed on unknown entitlement, missing consent, staleness, tenant mismatch, suspended provider, credential expiry, validation errors or uncertain regulatory status.
- Separate \`not_submitted\`, \`submitted_pending_ack\`, \`accepted\`, \`rejected\`, \`paid\` and \`unknown\` based only on actual NDIA evidence, not mock/local state.
- Build synthetic conformance harness with error/outage/401/403/429/5xx cases; production remains human-reviewed.
- Require privacy and security review, API test evidence, contract acceptance and explicit human go/no-go.

## Accessibility acceptance and recovery

Target WCAG 2.2 AA with keyboard, screen reader, AAC/switch, 200–400% zoom, accessible error feedback and human support. If NDIA is unavailable, retain a reviewable draft; **do not** assert acceptance, payment or worker suitability. Show last-verified status and a participant-relevant explanation without exposing credentials.

## Validation

Run \`node --experimental-strip-types --test apps/web/tests/ndis/ndia-gateway-contract.test.mjs\`. Also run repository lint/typecheck/test/build and focused admin-role permission checks. Verify the disabled and production-blocked states. The dedicated GitHub workflow is narrow and does not constitute full assurance.

## Go/no-go

**NO-GO for live NDIA API connectivity.** The isolated synthetic contract may be reviewed in a draft PR. No deployment, merge, user-data import, real API calls, or claims submission.
