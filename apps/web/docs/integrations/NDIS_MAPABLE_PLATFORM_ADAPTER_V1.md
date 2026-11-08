# MapAble NDIS Integration Adapter v1 — evidence-first

**Status:** In development, synthetic-only source-contract and admin readiness API. No real NDIA API access or digital platform registration is evidenced by this code.

## Objective and source evidence

MapAble requires separate authoritative boundaries for NDIA digital transactions, the NDIS Commission public Provider Register, authorised individual worker screening and the legal status of a platform operating under registration group 0137.

| Capability | Source | Verified claim and boundary |
|---|---|---|
| NDIA Digital Partnership / approved APIs | https://ndis.gov.au/providers/working-provider/using-provider-portals/how-connect-our-systems | Public guidance confirms direct and indirect integration, provider partnership and formal approval requirements. No public technical pack, credentials or API access is assumed. |
| Official provider registration | https://www.ndiscommission.gov.au/provider-registration/find-registered-provider | Public provider-level records/CSV. Registration, suspension or revocation status must be attributed to an official, dated record. Does not prove worker clearance or service quality. |
| NDIS Provider Finder | https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder | Additional public provider-level discovery, not individual worker verification. |
| NDIS Worker Screening Database | https://www.ndiscommission.gov.au/workforce/worker-screening | Authorised individual worker status is not anonymously searchable. As of 12 October 2026, registered providers use the new Commission portal. |
| Digital platform registration (0137) | https://www.ndiscommission.gov.au/about-us/ndis-commission-reform-hub/mandatory-registration/mandatory-registration-digital | Mandatory requirements apply from 1 July 2026 where the legal definition is met. Existing/new platform transition paths differ, and additional conditions begin on 1 January 2027. |
| NDIA synthetic-only gateway | https://github.com/ausdisau/MapAble/pull/28 | Draft PR #28, not yet merged; never proves live integration. |
| Existing provider importer / worker screening guide / participant matching | https://github.com/ausdisau/MapAble/pull/15 , https://github.com/ausdisau/MapAble/pull/16 , https://github.com/ausdisau/MapAble/pull/27 | Separate draft, unmerged capabilities; no live data assumed. |

## Current implementation

- \`lib/ndis/platform-adapter/ndis-platform-adapter.ts\` exposes the typed four-lane integration status and a strict synthetic journey contract. It processes **no participant identifiers**, health records, provider identities, worker screening evidence or financial documents.
- \`GET /api/admin/ndis-platform-adapter\` is read-only and requires existing MapAble admin session/role. Response contains only fixed official links, status labels and booleans.
- \`/admin/ndis-platform-adapter\` displays verbal evidence labels and official sources for human review.
- \`MAPABLE_NDIS_PLATFORM_ADAPTER_PREVIEW_ENABLED=true\` enables the local preview only outside production. Default disabled; setting the flag in production reports \`production_preview_blocked\`. **No real transactions exist in this adapter.**
- \`previewSyntheticNdisJourney\` accepts exactly five fields including \`demo_\` scenario ID. It always returns \`workerScreening=not_independently_verified\`, \`providerRegistration=not_checked\`, \`ndiaClaim=not_submitted\` and \`booking=not_created\`. There is no health inference, worker ranking or permission grant.
- Dedicated Node 22 contract tests verify disabled modes, privacy, evidence separation and zero-network behaviour.
- No migrations, dependencies, government tokens, user/worker lookup or new payments flow.

## Security, privacy, consent and governance

MapAble Core remains the only authority for identity, consent, roles, delegates, notification and audit. The adapter intentionally does not call or override these services. For real services, distinguish explicit participant permission from a provider's right to process data, and verify actual legal basis. No optional AI requirement is introduced.

A provider's registration does not establish current worker screening, competence, safety, availability or participant suitability. Never infer a worker's clearance from a self-report or document alone. The participant remains the final chooser, with human support and complaint/escalation pathways. For high-intensity care, require task-specific competence, training, supervision, clinical scope and emergency plans.

Provider matching must account for AAC, communication support, continuity, transport dependencies, cancellations, informed refusal and no verified worker availability. Preserve an accessible, non-AI and non-map path.

### Regulatory gates

Digital platforms that meet the statutory definition require the appropriate registration, audits and conditions. A new platform provider cannot start operations before the Commission registration decision; existing operators have a distinct transition pathway. This document does not determine the legal applicability to MapAble or claim registration. From 1 January 2027, additional conditions for platforms registered under group 0137 include worker clearance **before offering support** and checking/displaying relevant banning-order and credential information. Read current authoritative rules and get competent legal/operational sign-off before implementation.

NDIA transactional API onboarding is a distinct process: a registered provider or appropriately partnered aggregator, ASIC evidence, terms, cyber maturity, architectural evidence, NDIA Digital Partnership Office assessment and technical pack. Do not equate myID/RAM portal login with machine API authorisation. Keep all live connector and claim submission code disabled pending formal authorisation.

## Acceptance and future delivery

- **Unit/contract**: default-disabled, production-blocked, exact synthetic schema, reject PII/financial/credentials, zero network, independent source states.
- **Access**: admin-only endpoint, session role checks, no unauthorised data, no internal operational secrets in JSON.
- **Accessibility**: WCAG 2.2 AA design target; test keyboard, screen reader, switch/AAC, 200–400% zoom, readable error text, non-colour status and human fallback. No conformance claim before testing.
- **Operational**: run pnpm type-check, lint, relevant Vitest, build and review baseline; document any unrun gates.
- **Next vertical slices**: (a) source-stamped provider CSV ingestion once PR #15 is reviewed; (b) authorised screening workflow and status freshness after PR #16; (c) user-directed matching when PR #27 is safe; (d) NDIA-approved adapter only after PR #28 remediation and formal access.
- **Release rule**: draft PR only, no automatic merge/deploy. Human governance and legal, security, accessibility and privacy review required.

## Risk / rollback

There are pre-existing claimant paths that can mistake a mock claim for an externally submitted claim; the legacy NDIA provider client also includes unverified API endpoint assumptions. Treat as separate release blockers. This adapter cannot address them by enabling a local flag. Rollback is to leave \`MAPABLE_NDIS_PLATFORM_ADAPTER_PREVIEW_ENABLED\` unset/false and close or revert the draft when reviewed.
