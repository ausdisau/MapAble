# Programme delivery sequence

Recommended execution order for the twelve MapAble programmes. **One prompt per branch and pull request.**

## Execution order

```text
Prompt 0   Shared programme foundation (this PR)
Prompt 11  Integration Foundry and Partner Certification Laboratory
Prompt 1   MapAble Pathways
Prompt 10  Rights and Fair Pricing Navigator
Prompt 2   Transition Home
Prompt 3   MapAble Kids
Prompt 4   MapAble Lifespan
Prompt 5   MapAble Home
Prompt 6   Assistive Technology Lifecycle
Prompt 7   Work Retention and Adjustments
Prompt 8   Carer Continuity
Prompt 9   Regional Capacity Exchange
Prompt 12  Community Data Cooperative
```

**Rationale:** Build shared trunk → partner integration machinery → cross-scheme navigator → trust/fair-pricing layer → remaining programmes.

## Branch naming

Use `cursor/<descriptive-name>-7fa5` for programme branches.

## Dependencies

| Prompt | Programme           | Depends on             | Extends                                |
| ------ | ------------------- | ---------------------- | -------------------------------------- |
| 0      | Foundation          | `main`                 | Core identity, consent, audit, case    |
| 11     | Integration Foundry | Prompt 0               | Programme contracts, source registry   |
| 1      | Pathways            | 0, 11 (partial)        | Mission adapter, navigator, sources    |
| 10     | Rights Navigator    | 0                      | Trust ledger, complaints, billing docs |
| 2      | Transition Home     | 0, 1 (partial)         | Mission, transport, care, home access  |
| 3      | Kids                | 0, 1 (partial)         | Family authority, navigator            |
| 4      | Lifespan            | 0, 2 (partial)         | Scheme transitions, continuity         |
| 5      | Home                | 0, Access Intelligence | AccessPlace, property twin             |
| 6      | AT Lifecycle        | 0, 5 (partial)         | Equipment passport                     |
| 7      | Work Retention      | 0, Jobs domain         | Employment mission                     |
| 8      | Carer Continuity    | 0, care domain         | Authority, handover                    |
| 9      | Regional Capacity   | 0, 11                  | Hub/spoke, mutual aid                  |
| 12     | Data Cooperative    | 0, 11                  | Contributor governance                 |

## Prerequisite merges onto `main`

Before **Prompt 1** (Pathways), merge onto `main`:

1. CareOS canonical mission (PR #252 chain)
2. Access Intelligence + passport rename (PR #273)
3. AURA proposal gates stable (PR #272+)

Before **Prompt 11** (Integration Foundry):

- Prompt 0 merged
- Programme contracts available in `lib/programmes/contracts/`

## Per-prompt deliverables pattern

Each programme prompt (1–12) should:

1. Verify real branch and current implementation (don't assume production readiness)
2. Apply shared foundation (`requireProgrammeEnabled`, invariants, audit)
3. Add programme-specific Prisma models and routes
4. Reuse CareOSMission, consent, audit, messaging — no duplicates
5. Keep AURA proposal-only; deterministic services authorise writes
6. Add programme docs under `docs/<programme>/`
7. Add tests including IDOR, authority, AI boundary, accessibility
8. Run quality gates; report pre-existing failures separately

## Final integration review

After all twelve PRs are reviewed, run the programme-wide completion prompt:

- `docs/programmes/CROSS_PROGRAMME_READINESS.md`
- `docs/programmes/CROSS_PROGRAMME_THREAT_MODEL.md`
- `docs/programmes/CROSS_PROGRAMME_ACCESSIBILITY.md`
- `docs/programmes/CROSS_PROGRAMME_ROLLBACK.md`
- `docs/programmes/PILOT_SEQUENCE.md`

## Pilot sequence (recommended post-integration)

1. **Pathways + Rights Navigator** — cross-scheme navigation and trust transparency
2. **Integration Foundry sandbox** — partner onboarding before live integrations
3. **Transition Home + Carer Continuity** — high-safety coordination pilots
4. **Regional Capacity Exchange** — hub/spoke thin-market operations
5. **Remaining programmes** — staged by partner readiness and data maturity

Do not claim production readiness until release gates genuinely pass.
