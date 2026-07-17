# AI Platform merge train (≤ 3 depth)

Replaces the superseded 7-PR mega-stack (#350–#356).

| Order | Branch | Base | Scope |
| --- | --- | --- | --- |
| 1 | `cursor/ai-platform-wave1-6ea8` | `main` | AI matching truth + `lib/ai-platform` foundation + domain-ownership allowlist |
| 2 | `cursor/ai-platform-wave2-6ea8` | wave1 | Mission Portfolio + eval harness + Mission Copilot |
| 3 | `cursor/ai-platform-wave3-6ea8` | wave2 | Case Copilot + Billing Evidence Copilot |

## Superseded

Draft mega-stack closed as non-mergeable depth violation: #350, #351, #352, #353, #354, #355, #356.

## Rules

- ConvergenceOS: no unmerged stack deeper than 3.
- Do not wholesale-merge AURA / Continuity / Replay Lab mega-branches; extract only.
- Feature flags default false; no public-claim flips in this train.
