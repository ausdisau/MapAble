# MapAble AI Fabric — Distributed Node Network
Status: proposed architecture and code contracts; not deployed or merged. Source main SHA 4b8e848d8dae958e925cc46a158ac3485988ec53 (2026-11-10).

## Architecture decision
Keep the Next.js MapAble app as the control plane. Use existing auth, consent, AI capability registry and deterministic domain services. Introduce independent workers only where processing, isolation or replay justify them.

### Logical node graph
1. Gateway (existing Next.js APIs) -> identity verification and consent/policy
2. Identity bridge (candidate AD.iD/Clerk): verify trusted issuer, audience and scoped subject mapping; do not silently replace NextAuth or other app sessions
3. Policy node (existing MapAble consent and access checks): permissions, revocable delegation, kill switches and human approval
4. Access evidence node (existing Access Intelligence Next): observe -> preserve source and freshness -> candidate human review; never auto-update AccessPlace
5. Provider evidence node (existing NDIS provider source): official provider registration kept distinct from ratings, reviews or available workers
6. Worker screening node (candidate): only authorised NWSD/state-unit evidence, otherwise status not independently verified
7. NDIS guidance/policy node (candidate): retrieved source, publication date and legal/rule version; no AI eligibility decision
8. AccessiBooks node (candidate): public catalogue first, app-scoped entitlements later, independent identity and sharing approval
9. CareOS coordinator and governed model gateway (existing modules): read, draft and recommend; deterministic execution approval outside AI
10. Human review node: staff and participant review for consequential decisions
11. Postgres outbox and Kafka relay (candidate): metadata-only event stream to idempotent projections and alerts

## Existing infrastructure evidence
- apps/web/lib/ai/platform: registry, gateway, feature flags, evaluation and human-review contracts; code inspected, runtime not proven
- apps/web/intelligence/network and intelligence/tools/registry.ts: specialist nodes and per-tool permissions/consent
- apps/web/lib/access/intelligence-next: versioned ontology, evidence persistence, change review, protected publication boundary
- apps/web/lib/consent/require-consent.ts: existing server consent guard
- apps/web/lib/ndis/list-providers-source.ts: existing NDIS provider source
- apps/web/lib/realtime: polling, Socket.IO and Supabase adapters; not a deployed real-time guarantee
- apps/web/infra/modules: Terraform for SQS, Redis and Aurora; source code is not proof of deployed infrastructure. SQS DLQ redrive configuration needs review.
- apps/web/infra/variables.tf: proposed Sydney primary AWS region ap-southeast-2; provider and AD.iD data residency require independent verification.

## Security and event processing
- Versioned strict Zod event envelopes under apps/web/lib/ai/fabric/contracts.ts, with opaque refs and salted-HMAC digests computed on a trusted server.
- Default-off producer interface in event-projection.ts. It is not a deployed Kafka client or a transactional outbox.
- Approved future design: atomic Postgres domain write plus outbox row; relay; consumer group; idempotent inbox/deduplication key; retry and DLQ; audit and replay.
- Kafka preserves order within a partition, not total ordering. Its exactly-once features do not automatically make external database effects exactly once.
- No raw participant names, health records, exact location, worker screening statuses, prompts, JWTs or AccessiBooks reading histories in event streams.
- Revoke consent in source systems, stop subsequent processing and invalidate projections. Kafka retention and historical legal holds require a separate deletion policy.
- Registered providers, independently reviewed providers, worker screening and worker competence are separate trust claims.
- Never authorize based only on node-network routing booleans: that function is an advisory prerequisite check. The real enforcement remains existing authenticated server services.

## Branch consolidation
Already in canonical main: AI capability platform, CareOS agent orchestration, Access Intelligence Next, consent and human review foundations.
Port after independent audit: cursor/ai-control-plane-a99d; feat/mapable-durable-agent-workflow; feat/mapable-care-agent-studio; feat/aura-maira-care-perceptual-frame-contract-20261106; feat/marketplace-agentic-evidence-sandbox-20261102.
Research-only or duplicate review: cursor/ai-platform-wave1-6ea8 through wave3; research/maco-a0-agent-network; research/scratch-foundation-model-20261109; cursor/access-intelligence-next-living-fabric-a178.
Do not merge legacy branches wholesale: inspected candidates diverge substantially from legacy main.

## Gate plan
P0: PR-level provenance diff and branch inventory; reconcile files, SHA, CI and existing main coverage.
P1: node and event contracts, default-off tests, kill switches and accessibility acceptance.
P2: one access-evidence event outbox with idempotent worker and withdrawal behavior; prefer existing queue before additional broker complexity.
P3: approved Australian Kafka shadow environment, TLS/SASL, ACL, monitoring, retention, schema compatibility and replay tests.
P4: participant-controlled access preflight with evidence and human uncertainty review; keyboard, AAC, switch access, VoiceOver/TalkBack, reflow, non-AI path.
P5: separately approved cross-app AD.iD and AccessiBooks interoperability and authenticated worker-verification integration.

## Suggested verification
pnpm --dir apps/web exec vitest run tests/ai-platform/fabric-node-network.test.ts
pnpm --dir apps/web type-check
pnpm --dir apps/web lint
Run the existing access-intelligence and AI-platform regression suites and full CI.

## Stop conditions
No secrets, deployments, identity migrations, live Kafka cluster, production data streaming, worker assignment, AI screening attestation, funding eligibility determination, payments or auto-publication in this PR.
HAL.guru YAML configuration schemas are not Kafka event schemas. Use a separately reviewed adapter if HAL compatibility is later needed.