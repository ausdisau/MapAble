# MapAble+ Agentic Marketplace — participant-first synthetic sandbox

Status: source-only demonstration; no live products, real providers, orders, payments or model calls. Prepared 2 November 2026.

## Goal and boundaries
A participant-controlled, accessible, fictional marketplace for care/support and low-cost assistive technology. A participant agent may gather and compare sample options; separate fictional provider and worker agents respond only after participant-approved local previews. The human participant chooses which offer to shortlist. Neither shortlisting nor worker acknowledgement creates a booking, service agreement, consent receipt, worker clearance, order, purchase or NDIS claim.

## Source-grounded design
| Source | Verified fact | Design use | Caveat |
|---|---|---|---|
| https://github.com/transitive-bullshit/agentic | Archived in Feb 2026. Curated API/MCP gateway and TS tools; most code AGPL-3.0, distinct MIT stdlib. | Inspired a bounded and versionable typed tool list with read-only/draft/deny classes. No external source copied or imported. | No direct dependency or deployment of abandoned/AGPL source without legal and technical review. |
| https://github.com/saleor/saleor and https://docs.saleor.io/ | Active BSD-3-Clause Django/GraphQL commerce platform; catalogues, variants, channels, webhook apps and checkout. | Read-only public-product projection contract for potential AT inventory. All Saleor writes hard-denied in demo. | Multi-vendor segregation, checkout-ID access, tax, returns, recalls, merchant of record and payouts require independent design. Saleor is not a Care workforce-regulation engine. |
| https://arxiv.org/html/2510.25779v1 | Magentic Marketplace preprint studies competing assistant/service agents, manipulation and sharp first-proposal bias in synthetic markets. | All-offers-required gate and order-invariant comparison; no ranking based on first arrival or paid placements. | It did not validate outcomes in disability care; no claims of welfare gains here. |
| Canonical MapAble main at 43ce85df6b5b09a8577b60bf29042fbc1dc96fb0 | Existing participant marketplace, Next.js, TS, Vitest and draft PR #10 closed alpha. | Independent route and module; no changes to existing payment or inventory. | Review integration separately after PR #10 resolves. |

## Architecture
Human participant (authenticated tester only) -> in-memory fictional request -> explicit local provider preview -> deterministic provider replies -> complete, neutral comparison -> participant shortlisting -> optional independently consented worker preview -> local append-only action log and withdrawal.

Current external A2A, MCP, Saleor GraphQL, Twilio, Stripe, payments, booking, messaging, screening and real AI are **all disabled**.

Future design: MapAble Core authentication + ABAC + purpose/recipient/expiry-scoped consent receipts -> A2A agent trust registry -> server-only curated MCP tools with source provenance -> agent proposal inbox -> participant/human review -> separate Care service-delivery or Saleor AT order execution -> finance audit and receipts. A model must never decide consent, eligibility, worker clearance or money release.

## User controls and tests
- Two fixed scenarios; three entirely fictional vendor offers each with nonbinding AUD example prices.
- No free-form personal data entry; no health or plan numbers.
- Wrong role, premature sharing, incomplete comparison, duplicate replies, stale revision, replay, delegated shortlisting or post-withdrawal steps are denied.
- AT cannot use worker handoff; care worker acknowledgement is not verification.
- No universal provider safety/trust score. Unknown registration, capacity and product safety explicitly displayed.
- Curated tools allow local public read / local enquiry drafting only; private worker records, payment, checkout, NDIS funding decisions and external contact blocked.
- Standalone read-only Saleor public catalogue contract; no live endpoint, token, GraphQL operation or dependency.
- Server-only default-OFF MAPABLE_AGENTIC_MARKETPLACE_LAB_ENABLED and explicit MAPABLE_AGENTIC_MARKETPLACE_LAB_TESTER_IDS plus MapAble authenticated admin/tester check. Route /marketplace/agentic-lab returns 404 if disabled.
- No storage, transmissions or production deployment. Simulation role labels do not imply actual authorisation.

## Evaluation
(1) Reverse provider reply order and compare exact offer sets. (2) Early-provider pressure/injection attempts cannot force choice. (3) No sponsored ordering or inference from disability/AAC. (4) Worker-screening and provider-credential claims stay unknown absent authorised checks. (5) Separate care from AT product/retail. (6) Account/tenant and consent checks required before any real A2A. (7) Test keyboard, switch, TalkBack, VoiceOver, AAC, 200-400% text zoom, 320px reflow, interruption and no-AI fallback. Automated unit/CI does NOT establish WCAG 2.2 AA or production safety.

## Governance and readiness
ALLOW_WITH_SAFEGUARDS for synthetic developer-only demonstration; HOLD real commerce, sensitive-data processing, worker matching, live agents and public release. Review licence/IP, security, privacy, data residency, regulator rules, service agreements, human support and complaint paths, PayCore webhook and Stripe isolation before any expansion.

Developer commands in apps/web:
- pnpm vitest run tests/marketplace-agentic-lab.test.ts
- pnpm type-check
- pnpm eslint components/marketplace/AgenticMarketplaceLab.tsx lib/marketplace/agentic-lab app/marketplace/agentic-lab tests/marketplace-agentic-lab.test.ts

No PR auto-merge, deployment, feature enablement or provider notification is authorised.


## Additional multi-guardian policy overlay, NDIS Advisor and research

The code now includes a separate deterministic governance function in `apps/web/lib/marketplace/agentic-lab/governance.ts` and a visible `GuardianMarketplacePanel`. This is **an offline policy model inspired by**, not a live connection to, the NDIS Advisor, NDIS Commission, Sovereign Ethical Guardian, patient-rights or PubMed/JSTOR services.

### NDIS Advisor boundary
Current NDIA list guidance (checked 2 Nov 2026): https://www.ndis.gov.au/participants/using-your-funding/understanding-your-ndis-funding/what-are-ndis-supports . A purchase is not automatically funded because it is listed as AT or a disability service. Evaluate support classification, the participant's actual plan, disability relevance, permitted budget and any required written replacement-support approval separately. Never silently turn a product price or service rate into funding authorisation. `ndisFundingClassification` is always `NOT_DETERMINED` in the prototype.

### Worker-screening boundary
NDIS Commission: https://www.ndiscommission.gov.au/workforce/worker-screening and https://www.ndiscommission.gov.au/workforce/worker-screening/worker-screening-registered-providers . As at 2 Nov 2026, registered/deregistered providers' worker screening moved to the new NDIS Commission Portal on 12 Oct 2026; self-managed participants and unregistered providers continue existing pathways. Individual clearance is not publicly verifiable by ordinary web lookup. Keep status vocabulary: Clearance, Pending, Interim bar, Exclusion, Suspension, No valid clearance, and NOT_INDEPENDENTLY_VERIFIED. Provider registration, screening and public regulatory actions must never substitute for each other. Even an independently verified clearance is not a competence, safety or participant-fit guarantee.

### Sovereign Ethical Guardian and participant rights
Policy decisions use `ALLOW_WITH_SAFEGUARDS`, `HOLD_BRANCH`, `ESCALATE` and `BLOCK_HARD_INVARIANT`. This is a **decision-support label**, not law, clinical authority or an execution engine. Use human-readable rationale, invariants, missing evidence and rights-risk status; never sum into a moral/worker/participant worth score. Explicit blockers protect agency/consent (silence is never approval), personhood, nondiscrimination, communication/AAC, truthful uncertainty and privacy. The participant's human choice is primary. Role-switched demo personas, family and supporters have no presumptive contract/funding/disclosure authority. Rights-sensitive real disclosure and transactions remain held pending server-verified identity, granular consent, lawful role, actual current obligations, and accessible human review. The Patient Autonomy and Rights Safeguards framework applies as an adapted **rights lens** here; this nonclinical demo does not conduct treatment or claim clinical STOP jurisdiction.

### Research evidence inspected (not clinical or legal authority)
- PubMed PMID **40170657**, *AI-enabled AT Framework*, 2025; **ABSTRACT_INSPECTED**. The study describes participatory development of domains of user experience, privacy/security, quality, safety, relative value, and human rights. This supports design-checklist inclusion; it does not validate MapAble.
- PubMed PMID **41631749**, *Adoption intentions and barriers to emerging technologies among people with disabilities*, 2026; **ABSTRACT_INSPECTED**. A review of 46 studies discusses accessibility, cost, training, perceived utility and social factors; this motivates accessibility and economic-equality testing, not predictions for particular individuals.
- JSTOR stable **23723020**, Parvaneh Rabiee, *Exploring the Relationships between Choice and Independence*, British Journal of Social Work (2013), https://www.jstor.org/stable/23723020 ; **ABSTRACT_INSPECTED** (public item abstract, not full text). Its qualitative work describes independence as multidimensional, challenging a universal optimum or score.
- van Toorn & Scully, *Unveiling algorithmic power*, 2023, https://doi.org/10.1080/09687599.2023.2233684 ; publisher **ABSTRACT_INSPECTED**, NOT JSTOR. Australian NDIS interview/document research warns about algorithmic classification and epistemic injustice; verify full methods before making broad empirical generalisations.

Search record: PubMed searches on participatory AT design, user-centred adoption and algorithmic equity; public JSTOR search on disability choice/independence and algorithmic systems, 2 Nov 2026. No authenticated JSTOR full text accessed. Keep selected source identifier, access label, claimed finding and limitations distinct.

### Source-priority and test policy
Authoritative law and regulatory guidance take priority over papers or an AI opinion. Future runtime must use server-side policy and authorised individual-worker data access; the in-browser Guardian panel is purely explanatory. Tests must cover exact worker labels, non-inference from provider registration, unsupported funding claims, silence/AAC access, agent self-consent, private profile disclosure, purchase hold, no safety score and research provenance. A user can decline model processing entirely.

### Ethical release outcome
`ALLOW_WITH_SAFEGUARDS` applies to local, synthetic, non-identifying exploration; `HOLD_BRANCH` to real communication, worker clearance, bookings, purchases and any private disclosure pending verifiable permissions; `ESCALATE` to proposed NDIS funding determinations; `BLOCK_HARD_INVARIANT` to manufacturing consent, disability-based incapacity inference or misleading universal worker safety scores. The Guardian does not execute any step.
