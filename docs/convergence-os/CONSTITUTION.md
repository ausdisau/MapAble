# MapAble Architecture Constitution (mirror)

This file is a human-readable mirror of the seeded registry rules **C-001 … C-025**.
Authoritative machine-readable copies live in `ArchitectureConstitution` / `ArchitectureRule` after seeding.

**Operating mode (Wave 9):** advisory validation only. Selected rules may become soft/hard gates only after later fitness-function evidence (Wave 16+).

| ID | Title |
|----|-------|
| C-001 | One authoritative writer per canonical concept |
| C-002 | Multiple read projections permitted |
| C-003 | AI may interpret, compare, explain, draft, and propose |
| C-004 | AI may not grant itself authority |
| C-005 | Consequential actions via deterministic application services |
| C-006 | Participant approval must be purpose-bound and revocable |
| C-007 | RightsOS owns purpose and disclosure policy |
| C-008 | Personal Access Vault owns reusable disclosure views |
| C-009 | CareOSMission owns cross-programme mission state |
| C-010 | AccessPassport owns participant-selected functional requirements |
| C-011 | AccessPlace owns public-place identity |
| C-012 | Living Access Twin owns indoor accessibility projection |
| C-013 | Programme services own operational writes |
| C-014 | AuditEvent and outbox own immutable operational evidence |
| C-015 | No parallel core systems |
| C-016 | Missing data remains unknown |
| C-017 | Inference remains inference |
| C-018 | Fixture data clearly labelled |
| C-019 | Shadow mode cannot be marketed as production availability |
| C-020 | Governed pathways for sensitive domains |
| C-021 | Feature flags require full lifecycle metadata |
| C-022 | Compatibility adapters require expiry |
| C-023 | External integrations require full contracts |
| C-024 | Major capabilities require a11y, privacy, security, owner, rollback |
| C-025 | Public claims cannot exceed deployed evidence |

## Exception workflow

`draft` → `submitted` → `architecture_review` → (`security_review` \| `privacy_review` \| `accessibility_review`) → `approved` \| `approved_with_conditions` \| `rejected` → `expired` \| `revoked` \| `closed`.

Temporary exceptions auto-expire. **AI may draft; AI cannot approve.**

## Seed / validate

```bash
# Admin APIs (flags required)
POST /api/convergence/constitution { "action": "seed" }
POST /api/convergence/constitution { "action": "validate" }
```

Or seed all Iteration 2 registries: `POST /api/convergence/seed/iteration2`.
