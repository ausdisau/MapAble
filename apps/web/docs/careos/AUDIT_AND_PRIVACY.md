# Audit and privacy

CareOS writes structured audit records through MapAble `AuditEvent` with the
actor, participant, request/trace identifier, tool, risk and policy result.
Recommendation records retain evidence provenance and uncertainty, not hidden
reasoning.

Redaction removes credentials, tokens, payment data, unnecessary health
details, long raw strings and prompts. Incident response: pause the module
with `MAPABLE_CAREOS_ENABLED=false`, retain existing audit evidence, assess
the affected request IDs, then restore only after review.
