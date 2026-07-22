# Assistive Technology Continuity — Wave 1

**Status:** scaffold + durable schema (flag default **false**)  
**Branch pattern:** `cursor/ndis-expansion-wave1-at-continuity-*`  
**Owner path:** `lib/at-continuity/**`  
**Flag:** `MAPABLE_AT_CONTINUITY_ENABLED=false`

## Purpose

Participant-owned assistive technology **continuity**: register equipment, record
outages, keep backup plans, link authorised repair partners (Organisation refs),
and link operational dependencies to Care / Transport / Work entities.

MapAble does **not** determine clinical suitability, prescribe AT, or replace 000.

## Acceptance journey (flag on, human-approved)

1. Power wheelchair registered as `AtEquipmentAsset`
2. Outage recorded as `AtEquipmentOutage`
3. Participant backup plan shown via `AtBackupPlan`
4. Repair partners linked via `AtRepairPartnerRef` → existing `Organisation`
5. Care / Transport / Work dependencies via `AtDependencyLink` (typed target ids)
6. Notifications only after `assertHumanApprovedNotification`
7. All writes audited via `createAuditEvent` / `AuditEvent`

## Reuses (canonical)

- `User` / `ParticipantProfile` identity
- `Organisation` for repair partner refs
- `ConsentRecord` / `ParticipantAuthorityGrant` for sharing (callers)
- `AuditEvent` for the audit trail
- Marketplace category slugs as **hints only** (`marketplaceCategoryHint`)

## Must not create

- Clinical suitability SoT
- Second participant identity, consent ledger, or audit ledger
- Second provider directory
- Emergency dispatch claims

## Freeze waiver

Narrow domain waiver recorded in `docs/remediation/FEATURE_FREEZE.md` for
`lib/at-continuity/**` and the additive AT tables only. Flag remains default false.

## Human preview

Use [../../scripts/preview/at-continuity-wave1-human-preview.md](../../scripts/preview/at-continuity-wave1-human-preview.md)
for pass/fail, accessibility observations, stop conditions, and rollback.

## Build / Accessibility CI memory

See [AT_CONTINUITY_WAVE1_BUILD_MEMORY.md](./AT_CONTINUITY_WAVE1_BUILD_MEMORY.md).
OOM was post-compile static generation at ~6 GB heap; mitigated via
`staticGenerationMaxConcurrency: 1` (not unbounded heap growth).

## Rollback

1. Keep `MAPABLE_AT_CONTINUITY_ENABLED=false`
2. Revert migration `20260720120000_at_continuity_wave1` on non-prod if required
3. Remove or leave dormant `lib/at-continuity/**` (no public routes in Wave 1)

## Related

- [NDIS_EXPANSION_DELIVERY_SEQUENCE.md](./NDIS_EXPANSION_DELIVERY_SEQUENCE.md)
- [NDIS_EXPANSION_DOMAIN_MAP.md](./NDIS_EXPANSION_DOMAIN_MAP.md)
- [NDIS_REGULATORY_GATE_MATRIX.md](./NDIS_REGULATORY_GATE_MATRIX.md)
