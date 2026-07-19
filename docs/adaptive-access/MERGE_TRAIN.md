# Adaptive Access Network merge train (≤ 3 depth)

| Order | Branch | Base | Scope |
| --- | --- | --- | --- |
| 1 | `cursor/adaptive-access-profile-6ea8` | `main` | Access Profile + Presentation Policy Resolver; flags false |
| 2 | `cursor/supported-decision-studio-6ea8` | adapt-runtime | Decision Studio + worker-replacement pilot |
| 3 | `cursor/portable-access-wallet-6ea8` | decision-studio | Wallet contracts + synthetic Communication Passport presentation |

## Wave 0 housekeeping (2026-07-18)

| PR | Action | Status |
| --- | --- | --- |
| #360 | merged (AI intake) | done on main |
| #361, #362, #357, #358 | tip already on main → **close / supersede** | agent cannot close (403); **human required** |
| #347, #348, #349 | richer Mission Portfolio contracts → **extract only** vs thinner main slice | do not wholesale merge |
| #345, #344 | security / host ops | defer (separate from product train) |

Adaptive Access **active product train depth: 0** before PR 1 opens.

## Rules

- Max three unmerged product PRs in this train.
- Do not open PR 4 until at least one of PR 1–3 merges.
- All Adaptive Access flags default **false**.
- No production wallet issuance, live devices, or public claims in this train.
- Presentation adaptation must never alter legal, financial, clinical, or operational meaning.
- AI must not select decisions or command devices.
