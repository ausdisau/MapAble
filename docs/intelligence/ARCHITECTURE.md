# Architecture

```mermaid
flowchart LR
  sandbox[AdminSandbox] --> api[SyntheticAPI]
  api --> guard[SyntheticGuard]
  guard --> supervisor[DeterministicSupervisor]
  supervisor --> policy[PolicyGateway]
  policy --> outcome[SchemaValidatedOutcome]
  outcome --> audit[InMemoryRedactedAudit]
```

The library is intentionally isolated at `lib/intelligence/mainframe`. It
does not import database clients, production CareOS tools, provider SDKs, or
network adapters. Fixtures are the sole information source.
