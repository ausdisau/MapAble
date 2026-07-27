# Tool registry

Every CareOS tool is Zod typed and registers a module, risk, permissions,
consent scopes, authority level and confirmation requirement. The Foundation
allows read-only tools only:

- upcoming appointments
- care preferences and existing requests
- compatible workers
- accessible transport options and existing trips
- destination access evidence

Inputs, permissions, authority, consent, feature flags, policy and output are
validated centrally. Tools call existing MapAble services/data models and
return structured data.
