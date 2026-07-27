# Prompt register

The Phase A registry lives in
`lib/intelligence/mainframe/prompts/registry.ts`. Each immutable prompt has an
ID, semantic version, owner, purpose, risk tier, L2 autonomy ceiling,
synthetic classification, schema bindings, budgets, approvals, effective date
and SHA-256 content hash.

Runtime content is selected only by code. No prompt can edit the registry,
select an alternate prompt, or receive untrusted data in an instruction role.
