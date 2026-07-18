# Advanced AI Expansion merge train (≤ 3 depth)

| Order | Branch | Base | Scope |
| --- | --- | --- | --- |
| 1 | `cursor/ai-intake-contracts-6ea8` (#360) | `main` | Evidence Intake contracts, synthetic adapters, flags false |
| 2 | `cursor/mission-evidence-graph-6ea8` (#361) | intake | Mission Evidence Graph + hybrid retrieval (Starting Work) |
| 3 | `cursor/companion-edge-ai-6ea8` (#362) | graph | Edge AI Capability Broker + ProcessingReceipt |

## Wave 0 housekeeping

Superseded drafts from the prior AI platform train (#357, #358, #347, #348) should be closed by a human (integration token cannot close them). Content already lives on `main` via `a22591c3`.

## Rules

- Max three unmerged product PRs.
- Do not open PR 4 until one of the first three merges.
- Flags default false; no public-claim flips.
- No OCR, no canonical writes, no parallel document store in PR 1.
