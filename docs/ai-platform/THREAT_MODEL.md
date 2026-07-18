# Threat model (summary)

- Prompt injection via retrieved notes/documents (treat as untrusted data).
- Cross-tenant retrieval via client-supplied IDs.
- Authority elevation via browser-controlled flags.
- Fabricated model scores (addressed in AI matching truth PR).
- Secrets in prompts/telemetry.
- Hidden long-term memory.

Mitigations: server-derived scope, kill switches, tool allowlists, redaction, proposal hashes, immutable audit.
