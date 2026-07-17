# MapAble Productisation and Connected Service Programme

**Positioning:** Care and support, connected.  
**Strategic lanes:** [docs/strategy/OPERATING_LANES.md](../strategy/OPERATING_LANES.md)

## Wave 0 deliverables (this folder + ConvergenceOS)

- [PR action ledger](../remediation/PR_ACTION_LEDGER.md)
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

## Next five strategic opportunity PRs

1. `cursor/strategic-opportunity-reconciliation-e909` — capabilities, docs, operating lanes (no product migration)
2. `cursor/persistent-transport-quotes-e909` — Prisma Transport quotes + staged location privacy
3. `cursor/recurring-care-agreements-e909` — recurring Care schedules + agreement completion
4. `cursor/starting-work-db-journey-e909` — database-backed Starting Work golden journey
5. `cursor/worker-cancel-recovery-e909` — worker cancellation → participant-controlled recovery

See [docs/strategy/STRATEGIC_OPPORTUNITIES.md](../strategy/STRATEGIC_OPPORTUNITIES.md).

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
