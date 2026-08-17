# AI Platform merge train (≤ 3 depth)

Replaces the superseded 7-PR mega-stack (#350–#356).

| Order | Branch | Base | Scope |
| --- | --- | --- | --- |
| 1 | `cursor/ai-platform-wave1-6ea8` | `main` | AI matching truth + `lib/ai/platform` foundation + domain-ownership allowlist |
| 2 | `cursor/ai-platform-wave2-6ea8` | wave1 | Mission Portfolio + eval harness + Mission Copilot |
| 3 | `cursor/ai-platform-wave3-6ea8` | wave2 | Case Copilot + Billing Evidence Copilot |

## Superseded

Draft mega-stack closed as non-mergeable depth violation: #350, #351, #352, #353, #354, #355, #356.

## Rules

- ConvergenceOS: no unmerged stack deeper than 3.
- Do not wholesale-merge AURA / Continuity / Replay Lab mega-branches; extract only.
- Feature flags default false; no public-claim flips in this train.

## Autonomy Assurance trains (separate, ≤ 3 each)

Prompt 0 reconciliation + W-AA-1: [AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md](./AUTONOMY_ASSURANCE_PROMPT_0_RECONCILIATION.md).  
Programme Definition of Done: [AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md](./AUTONOMY_ASSURANCE_DEFINITION_OF_DONE.md).

| Train | Prompts | Theme |
| --- | --- | --- |
| A | 1–3 | ARC sidecar; AURA v2 shadow + memory; Dignity of Risk |
| B | 4–6 | Decision Passport projection; Governed Envelope v2; A2H hardening |
| C | 7–8 | Evidence choreography / redress; accessible controls + shadow pilot |

Do not deepen the waves 1–3 stack above or the Geoscape W-GEO-1 stack with these trains. The programme is not complete until the Definition of Done checklist is fully met.
