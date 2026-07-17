# MapAble Productisation and Connected Service Programme

**Positioning:** Care and support, connected.  
**Strategic lanes:** [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md)

## Wave 0 deliverables (this folder + ConvergenceOS)

- [PR action ledger](../remediation/PR_ACTION_LEDGER.md)
- [Leadership train reconciliation](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md)
- [Productisation merge train](../convergence-os/PRODUCTISATION_MERGE_TRAIN.md)
- [Public claim registry](../convergence-os/PUBLIC_CLAIM_REGISTRY.md)
- [Capability registry (human mirror)](./CAPABILITY_REGISTRY.md)
- Capability honesty extensions in `lib/convergence-os/seed/capabilities.ts`
- Strategy docs under `docs/strategy/`

## Landed productisation train (on main)

1. #312 — registries, supersession, no product schema
2. #313 — encryption, Zod, tenant scope, IDOR
3. #314 — Communication Passport → readiness (no assign)
4. #327 — Care/Transport/Billing slices, Companion foundation, Provider Ops, Starting Work synthetic
5. #331 — strategy / operating lanes / capability honesty

## Active leadership train (max 3)

1. Trust Fabric — [TRUST_FABRIC.md](./TRUST_FABRIC.md) (`MAPABLE_TRUST_FABRIC_*`, default off)
2. Persistent Access Evidence Envelope (Access Intelligence)
3. Database-backed Starting Work projection (#330 queued)

Transport quotes / Recurring Care recreate after Starting Work DB with unique migrations
(`20260717150000` / `20260717160000`). See [LEADERSHIP_TRAIN_RECONCILIATION.md](../remediation/LEADERSHIP_TRAIN_RECONCILIATION.md).

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
