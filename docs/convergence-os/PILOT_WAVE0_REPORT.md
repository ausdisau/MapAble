# ConvergenceOS Wave 0 pilot report

**Generated from:** deterministic seed inventory + schema collision engine  
**Base commit pin:** `eb52b9f0b6589e0ca1c813e46c012e71e3b2a0ee`  
**Mode:** AUDIT / ADVISORY — no automated merges

## Pilot coverage (§29)

| Area | PR(s) | Result |
|------|-------|--------|
| AURA stacked chain | #266→#267→#268→#269→#272→#275→#277 | Ancestry edges recorded; CareOSMission DDL on tip flagged |
| CareOS mission SoR | #252 | Deferred in merge train; multi-writer collision critical |
| RightsOS | #280 | Depends on Vault; duplicate PersonalVault flagged |
| Personal Access Vault | #281 | Canonical vault candidate; merge before RightsOS |
| Shared programme foundation | #279 | CaseMissionAdapter; rebase preserve indoor |
| Civic Access | #284 | Related projection vs AccessibilityOps |
| AccessibilityOps | #282 | Migration timestamp clash with Vault/Transport MVP |
| Transport | #276 / #283 | Prefer Trip claims; MVP rebuild/adapter |
| NDIS Gateway | #285 / #286 | Docs then migration-free facades |

## Collision engine (sample)

Critical findings include:

1. `CareOSMission` multi-writer (careos, aura, continuity)
2. `PersonalVault` dual-define (vault vs rightsos)
3. Migration timestamp `20260716140000` (vault, a11yops, transport_mvp)
4. Indoor deletion hazard on stale tips (aura/careos/rightsos/continuity)
5. `AiAccessPlace` place SoR fork

Related projection (not silent duplicate): CivicAsset vs AccessibilityAsset.

## Advisory merge train

Train key: `foundation_governance_prep_v1`  
Humans execute in GitHub. ConvergenceOS does **not** merge, rebase, or close PRs.

## How to re-run

```bash
# Unit / advisory (no DB)
pnpm exec vitest run tests/convergence-os
pnpm check:convergence-advisory

# Persist snapshot (requires DB + admin session + flags)
# MAPABLE_CONVERGENCE_*_ENABLED=true
# POST /api/convergence/scans/repository
```

## Success measures observed

- Duplicate concepts identified (CareOSMission, PersonalVault, place SoR)
- True collisions distinguished from related projections (civic vs a11yops assets)
- Unsafe merge order detected (RightsOS before Vault; AURA before indoor rebase)
- Migration timestamp risk found
- Decision proposals labelled AI proposals (not approvals)
