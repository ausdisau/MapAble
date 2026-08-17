# Threat model (summary)

- Prompt injection via retrieved notes/documents (treat as untrusted data).
- Cross-tenant retrieval via client-supplied IDs.
- Authority elevation via browser-controlled flags.
- Fabricated model scores (addressed in AI matching truth PR).
- Secrets in prompts/telemetry.
- Hidden long-term memory.

Mitigations: server-derived scope, kill switches, tool allowlists, redaction, proposal hashes, immutable audit.

## Navigator governed pilot (additive)

| Threat | Mitigation in pilot code |
|--------|--------------------------|
| Consent bypass on AI search | `verifyPurposeConsent` on protected routes; public Finder chat unchanged |
| Delegated-authority abuse | Field/action-scoped grants; actor ≠ participant requires authority |
| Envelope replay / model self-approval | Nonce + expiry + participant/approver decide path only |
| Hard-constraint relaxation | Deterministic Stage 1; `NO_SAFE_MATCH` when empty |
| Ranking bias / sponsored | Editable weights; sponsored labelled; never eligibility |
| Escalation IDOR / unsafe disclosure | A2H tenant/participant scope; danger → human + 000 guidance |
| Ungoverned memory | Approved categories only; withdraw/delete; no capacity inferences |
| Mid-flow flag/kill change | Orchestrator re-checks capability gate before material steps |

Full assurance record: [`NAVIGATOR_ASSURANCE.md`](./NAVIGATOR_ASSURANCE.md).
