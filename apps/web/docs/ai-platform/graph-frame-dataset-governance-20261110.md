# MapAble AI — Graph Neural Harness + Frame for Thought

**Classification:** Technical research specification; synthetic-only contract implementation, not trained GNN, not a running multimodal transformer, not superintelligence, not a live Kafka service.
**Date:** 2026-11-10. **Base branch:** feat/unified-ai-fabric-contracts-20261110 (draft PR #42).
**Decision:** Build a narrow, reproducible graph-and-multimodal research harness on the existing MapAble AI Fabric; preserve human authority, governance and public provenance.

## Existing inspected evidence
- Canonical main: `apps/web/lib/access/intelligence-next/graph/types.ts` defines a living access graph and evidence attributes, but synthetic graph snapshots are not GNN models.
- Canonical main: `apps/web/lib/ai/platform/evaluations` provides an evaluation foundation; `apps/web/lib/ai/platform/models/gateway.ts` is the governed model gateway.
- Canonical main: `apps/web/docs/ai-platform/UNDERSTANDING.md` explicitly says GNN training/inference is not implemented.
- Legacy `ausdisau/mapableau-new/docs/ai-platform/perceptual-frame/README.md` is a schema-only AURA x MAIRA perceptual frame, not active agent inference or execution authority.
- The staged AI Fabric branch provides a module manifest, node graph, shadow-only Kafka producer interface and a no-autopublish event schema.

## Policy evidence boundary
- US Executive Order 14434, 29 September 2026: redefines AI as 'Super Intelligence' for specified US executive-branch documents. Its section 3 incorporates the existing US statutory AI definition for the order until superseded and requests a proposed legislative definition. This is not Australian law or evidence that a model is superior to human cognition.
- Australian National AI Plan, 2 December 2025: primary policy with three ambitions—opportunity, shared benefits, safety; not itself a participant eligibility determination.
- Australian PM&C rapid-review recommendations (2026): 18 recommendations on AI cyber incident reporting, near misses, information sharing, evaluations and cybersecurity; recommendations are not automatically enacted legal requirements.
- GINC National AI Strategies tag and 80 National AI Strategies/2026 Update (7 October 2026): secondary research, country-by-country comparative context. Do not promote editorial country categorizations or scores into statutory/official truth. Link each claim to the relevant original government source.
- Each record carries evidence tier, jurisdiction, effective scope, consulted date, publication status and source-licence uncertainty in `policy-source-register.ts`.

Official/source URLs:
- https://www.whitehouse.gov/presidential-actions/2026/09/inaugurating-the-era-of-super-intelligence/
- https://www.industry.gov.au/publications/national-ai-plan
- https://www.pmc.gov.au/resources/rapid-review-australian-government-arrangements-ai-driven-cyber-incident/rapid-review-australian-government-arrangements-ai-driven-cyber-incident-recommendations
- https://www.ginc.org/tag/national-ai-strategies/
- https://www.ginc.org/80-national-ai-strategies-2026-update/

## System pipeline
1. **Dataset Registry**: approve source provenance, version, licence, retention, geographic boundary, intended purpose and permitted model use. Default no training and no remote media ingestion.
2. **Metadata stream**: enqueue data-event envelopes with schema version, dataset ID, source references, artifact checksum, purpose and authority ceiling. No raw content, health history, identity token or user location.
3. **Feature workers (future)**: run authorised modality preprocessors for synthetic text, AAC, image, audio, video and document fixtures, with accessible equivalent descriptions. Capture model card, processor version, reproducibility and uncertainties.
4. **Evidence graph**: project Access Intelligence ontology and source-index facts into typed nodes and edges; reject dangling references, duplicates and unsupported provenance.
5. **GNN worker (future)**: evaluate graph neural message passing/GraphSAGE-style embeddings using a separately reviewed PyTorch Geometric service. The current TypeScript implementation is an *untrained neighbour-mean baseline* for deterministic contract tests. No learning or predictive classification is claimed.
6. **Multimodal transformer (future)**: combine authorised projection references with graph embeddings through a controlled fusion adapter. Do not pass raw private media, disability diagnoses or indirect identifiers to an unapproved model endpoint.
7. **Frame for Thought**: generate an inspectable **external evidence ledger**: cited observations, candidate interpretation, contradicting evidence, alternative explanations, unknowns, and review state. This is not a private model chain-of-thought trace.
8. **Human review / participant controls**: authorised human reviewer and participant can inspect, challenge or reject suggestions. Deterministic MapAble services alone control any subsequent consequential action.
9. **Telemetry and evaluation**: record dataset-version, model-version, costs, drift, replay failures, near misses and human overrides without copying sensitive prompts into Kafka.

## Contracts added
- `policy-source-register.ts` — government-primary/secondary-research classification; link-only licensing.
- `dataset-governance.ts` — bounded source-index and synthetic datasets, training prohibited, metadata-only research stream.
- `graph-harness.ts` — synthetic graph validator, untrained neighbour aggregation and future model-adapter interface.
- `multimodal-harness.ts` — accessible synthetic modality descriptors, no media exposure, future transformer-worker interface.
- `frame-for-thought.ts` — human-reviewed, referenced evidence ledger; no action authority.
- `tests/ai-platform/graph-frame-dataset-governance.test.ts` — baseline, negative and provenance tests.

## Distributed deployment: proposal, not deployed
- API control plane stays in Next.js on MapAble; policy checks remain in existing server authority, consent, AD.iD and capability registries.
- Start with a single job worker and database outbox. Consider using an existing queue design before adding Kafka; the Terraform queue source does not prove an AWS queue exists.
- For future Kafka, reserve `mapable.ai.research.dataset-events.v1` for metadata-only schema, with partition keys derived from approved synthetic dataset IDs; no human PII and no inference payloads.
- Separate consumers for dataset validation, feature extraction, graph projection, evaluation and incident audit. Apply back-pressure, DLQ, idempotent replays and per-dataset suspended-state checks.
- No GNN or transformer training from public sector documents without verified licence and purpose review; no retraining on participant/worker/reading-history data by default.

## Safety, rights, and evaluation gates
- No user diagnoses, capacity inference, emotional judgement, worker clearance inference, NDIS funding decisions, matching assignments, clinical or safeguarding conclusions in model outputs.
- Revoke consent before any new data reads and invalidate downstream derived records; Kafka tombstones are not full deletion of archive/backups.
- Split data by source organisation and place/precinct to prevent leakage across training and evaluation partitions; report graph-source overlap and evaluation holdouts.
- Test provenance faithfulness, contradictory evidence retention, stale-source handling, hallucinated-source rejection, training licences, model spoofing, prompt injection, cross-tenant isolation, consent withdrawal, non-AI fallback.
- Accessibility: keyboard-only, switch access, screen readers, AAC text entry, speech transcript correction, captions, audio description, reflow/400% zoom and reduced motion with WCAG 2.2 AA targets.
- Measure confidence calibration, coverage, failure modes, latency, compute cost, sustainability and human review time; do not claim general or superintelligence from isolated benchmark results.
- PM&C recommendations provide a risk-review checklist, especially incident/near-miss recording, escalation, independent evaluations and security fundamentals, not automatic corporate legislation.

## Required commands on a checked-out repository
`pnpm --dir apps/web exec vitest run tests/ai-platform/graph-frame-dataset-governance.test.ts`
`pnpm --dir apps/web exec vitest run tests/ai-platform/fabric-node-network.test.ts`
`pnpm --dir apps/web type-check`
`pnpm --dir apps/web lint`

## Milestones / stop conditions
- M0: review draft PR, run tests/typecheck, verify the review's publication metadata and all source licences.
- M1: immutable dataset manifest with real content checksums, content-store access controls and authorised source ingestion; keep modelling synthetic until approved.
- M2: one isolated GNN worker on synthetic graphs with deterministic replay and model card; one local multimodal processor on synthetic accessible fixtures.
- M3: controlled multimodal late fusion, holdout evaluation, accessibility trials and independent safety/cyber review.
- M4: shadow-only event relays and human review. Do not merge or deploy to production until tests, legal/privacy review, participant consultation and human sign-off pass.

**GO:** schema-and-evaluation research. **NO-GO:** participant data ingestion, automatic learning from user interactions, online model self-improvement, autonomous tool execution, live policy/worker decisions or an SI capability claim.

## Recovery
Research files are additive and separate from runtime. Do not enable any multimodal or Kafka feature flags. Abandon or revert this branch independently of PR #42 if tests or governance review fail.