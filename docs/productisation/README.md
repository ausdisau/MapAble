# MapAble Productisation and Connected Service Programme

**Positioning:** Care and support, connected.  
**Strategic lanes:** [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md)

## Wave 0 deliverables (this folder + ConvergenceOS)

- [PR action ledger](../remediation/PR_ACTION_LEDGER.md)
- [Leadership train reconciliation](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md)
- [AI Autonomy Assurance Prompt 0 reconciliation](../ai-platform/AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md)
- [AI Autonomy Assurance Definition of Done](../ai-platform/AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md)
- [Productisation merge train](../convergence-os/PRODUCTISATION_MERGE_TRAIN.md)
- [Public claim registry](../convergence-os/PUBLIC_CLAIM_REGISTRY.md)
- [Capability registry (human mirror)](./CAPABILITY_REGISTRY.md)
- Capability honesty extensions in `lib/platform/convergence-os/seed/capabilities.ts`
- Strategy docs under `docs/strategy/`

## Landed productisation train (on main)

1. #312 — registries, supersession, no product schema
2. #313 — encryption, Zod, tenant scope, IDOR
3. #314 — Communication Passport → readiness (no assign)
4. #327 — Care/Transport/Billing slices, Companion foundation, Provider Ops, Starting Work synthetic
5. #331 — strategy / operating lanes / capability honesty
6. #328 — Trust Fabric access receipts
7. #329 — Persistent Access Evidence Envelope

Closed drafts **#315 / #316 / #317** failed CI on an obsolete stack; content was consolidated via #327. See [PR_315_317_REPAIR.md](./PR_315_317_REPAIR.md).

## Active leadership train (max 3)

1. Database-backed Starting Work projection — this PR (#330)
2. Persistent Transport quotes — recreate after #330 (`20260717150000`)
3. Recurring Care — recreate after quotes (`20260717160000`)

See [LEADERSHIP_TRAIN_RECONCILIATION.md](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md) and
[MOAT_PR_RECONCILIATION.md](./MOAT_PR_RECONCILIATION.md).

## Controlled pilot

Starting Work — Taylor at Harbour Civic Centre.
See [STARTING_WORK_PILOT.md](./STARTING_WORK_PILOT.md).  
**Honesty:** synthetic/fixtures by default (`MAPABLE_STARTING_WORK_SYNTHETIC_ONLY`);
not a live production journey until the database-backed PR exits criteria.

## Hard rules

- Feature flags and documentation are not production evidence.
- Managed Support ≠ Network facilitation.
- No fabricated NDIS registration claims for MapAble.
- Process-local transport quotes are not a durable quote store.
