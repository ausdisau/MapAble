# MapAble Core — Cursor prompt packs (Phases 6–10)

This document is the **consolidated reference** for building Phases 6–10 on top of Phases 1–5. Run **one phase at a time** in Cursor; do not paste all prompts at once unless the repo is small and well-structured.

## Prerequisites (Phases 1–5)

| Phase | Focus |
|-------|--------|
| 1 | Identity, roles, consent, audit, bookings |
| 2 | Messaging, documents, invoices, Stripe/Xero hooks |
| 3 | Care, transport, jobs, calendar |
| 4 | Matching, tracking, timesheets, incidents, contracts |
| 5 | AI matching, verification, pricing, portals, NDIA readiness |

Deploy baseline: `npx prisma db push && npx prisma generate && pnpm prisma db seed`

## Global rules (paste at top of every phase prompt)

- Continue repo conventions; do not rewrite from scratch.
- No fake integrations or real secrets in repo.
- No automated NDIS/NDIA/PACE/Commission submission without formal approval.
- No public exposure of sensitive participant data.
- No autonomous high-risk decisions; human review required.
- Audit events for sensitive actions; smart contract + attestation compatibility.
- Accessible, plain-language, consent-aware participant UI.

## Phase overview

| Phase | Theme | Primary outcome |
|-------|--------|----------------|
| **6** | Production & ecosystem launch | Launch readiness, dispatch, provider quality, AI governance, partner sandbox, open data (safe), board/governance |
| **7** | Live pilot & scale ops | Mobile release hardening, operator dispatch, reconciliation, multi-tenant, enterprise/government portals, public beta |
| **8** | National infrastructure | App store process, transport network rollout, settlement, national insights, API versioning, SLA/grant reporting |
| **9** | Mature civic platform | Data vault, public decision register, research safe room, provider benchmarking (safeguarded), i18n, longitudinal impact |
| **10** | Public-interest OS | API certification, algorithm register, oversight board, privacy-preserving analytics, sustainability plan |

## Phase 6 — Production and ecosystem launch

**Modules:** `lib/platform/mobile-production`, `lib/ai/governance`, `lib/transport/dispatch-console`, `lib/provider/quality`, `lib/support/plan-manager-integrations`, `lib/partner/sandbox`, `lib/access/accessibility-accreditation`, `lib/api/open-data`, `lib/reporting/government`, `lib/platform/disaster-recovery`, `lib/evidence/automation`, `lib/platform/launch-readiness`, `lib/reporting/board`, `lib/governance/community`

**Admin routes:** `/admin/launch-readiness`, `/admin/dispatch`, `/admin/provider-quality`, `/admin/ai-governance`, `/admin/partner-sandbox`, `/admin/accessibility-accreditation`, `/admin/open-data`, `/admin/government-reporting`, `/admin/disaster-recovery`, `/admin/evidence-automation`, `/admin/board-reporting`, `/admin/community-governance`

**Key models:** `LaunchReadinessItem`, `DispatchQueue`, `ProviderQualityScore`, `AiModelMonitor`, `PartnerSandboxApp`, `OpenDataExport`, `GovernmentReportPack`, `BoardReportSnapshot`, `CommunityGovernanceMeeting`, …

**Non-goals:** Autonomous dispatch; legal certification claims; raw open data with PII.

## Phase 7 — Live pilot and scale operations

**Focus:** Mobile release hardening, operator dispatch, payment reconciliation, plan manager pilot, NDIA pilot (flag-gated), public transparency, multi-tenant admin, enterprise/government portals, public beta, social impact.

**Routes:** `/enterprise-provider`, `/government-partner`, `/transparency`, `/accreditation`, plus `/admin/*` equivalents.

**Key models:** `Tenant`, `EnterpriseProviderWorkspace`, `PaymentReconciliationBatch`, `PublicBetaCohort`, `NdiaPilotApprovalRecord`, …

## Phase 8 — Repeatable national infrastructure

**Focus:** App store release, transport network rollout, compliance renewals, settlement batches, national insights, API v1/v2 versioning, SLA reporting, grant reporting, external security audit packs, assessor tools (`/assessor`), `/insights/national`, `/status`.

## Phase 9 — Mature civic platform

**Focus:** National rollout, partner billing, assessor network, public decision register, personal data vault (`/data-vault`), research safe room, provider benchmarking with safeguards, governance charter, i18n.

## Phase 10 — Public-interest operating system

**Focus:** API certification, algorithm register (`/algorithms`), oversight board (`/oversight`), privacy-preserving analytics, federated research, provider academy, data trust annual report, sustainability plan, long-term outcomes (`/outcomes`).

## Feature flags

See `.env.example` sections **Phase 6** through **Phase 10**. All sensitive integrations default **off**.

## Recommended build order

1. Phase 6 master architecture + [Phase 6](core-phases.md#phase-6)`
2. Launch readiness + dispatch console (operational value first)
3. Provider quality + AI governance
4. Phase 7 reconciliation + multi-tenant (before public beta)
5. Phase 8 national insights + API versioning
6. Phase 9 data vault + public decision register
7. Phase 10 oversight + algorithm register + sustainability

## Cursor final report template

After each phase, document: files created/changed, migrations, models, APIs, UI routes, tests, feature flags, limitations, manual QA, next phase.

## Phase 11 preview (implemented in Phase 12)

National accountability portal, certified API ecosystem at scale, privacy-preserving research federation, transport investment modelling, community-owned governance membership, platform constitutional safeguards. See `[Phase 12](core-phases.md#phase-12).

## Related docs

- `[Phase 4](core-phases.md#phase-4)
- `[Phase 5](core-phases.md#phase-5)
- Individual phase READMEs under `README_*` from earlier builds
