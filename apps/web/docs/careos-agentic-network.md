# MapAble CareOS Agentic Network

## Purpose

CareOS is the participant-controlled coordination network inside MapAble. It turns a stated life goal into a visible mission graph spanning care, accessible transport, appointments, accessibility evidence, providers, workers, funding context and human review.

It is not a separate AI laboratory and it is not an autonomous case manager.

The operating rule is:

> Agents interpret, retrieve, compare, draft and recommend. Participants decide. Existing MapAble services execute.

## Implemented surfaces

### Participant interface

`/ask` now includes `CareOSAgenticNetwork`.

A signed-in participant can:

- describe a goal;
- select which MapAble modules may be read for the current request;
- separately opt into accessibility-profile use;
- enable or disable Continuity Radar;
- inspect every selected agent and its authority ceiling;
- inspect the mission dependency graph;
- review continuity gaps and recovery options;
- continue through standard non-AI services.

### API

`POST /api/intelligence/careos-network`

The endpoint:

1. requires an authenticated MapAble session;
2. validates the request with Zod;
3. checks the CareOS network feature flag;
4. builds request-scoped consent;
5. invokes only approved read tools;
6. creates the mission dependency graph;
7. optionally runs Continuity Radar;
8. records a redacted audit event;
9. returns structured agents, nodes, alerts and recommendations.

It does not create bookings, assign workers, submit claims, approve invoices, make payments or disclose information to third parties.

### MCP gateway

Run:

```bash
pnpm mcp:careos
```

The stdio MCP server exposes development and simulation tools:

- `careos_get_framework`
- `careos_validate_mission_request`
- `careos_simulate_continuity`
- `careos_prepare_robotics_task`
- `careos_mapable_api_reference`

The MCP server does not read production participant data. Its continuity tool uses synthetic records. Its robotics tool prepares simulation-only task contracts and refuses physical actuation.

## Agent topology

The bounded network currently defines:

- CareOS Mission Manager
- Participant Advocate
- Care Coordination Agent
- Accessible Transport Agent
- Access Evidence Agent
- Continuity Radar
- Worker Support Copilot
- Provider Capacity Agent
- Rights and Advocacy Agent
- Safeguarding Gate
- AbilityPay Explanation Agent
- CareOS Robotics Coordinator

The Manager and Participant Advocate are always active when the network is enabled.

Safeguarding is `human_only`.

Robotics is `research_only` and limited to `L1_DRAFT` task preparation.

The normal production authority ceiling is `L2_RECOMMEND`.

## Mission graph

The initial mission graph contains:

- participant goal;
- appointment or activity;
- care and support coverage;
- accessible transport;
- destination accessibility evidence;
- optional accessibility-profile context;
- optional funding and invoice context.

Edges describe whether a service:

- is required by the goal;
- supports the goal;
- depends on another service;
- is validated by evidence;
- requires review.

A care record with `linkedTransportRequired=true` creates a direct dependency between Care and Transport.

## Continuity Radar

Continuity Radar detects service-system gaps, not participant risk.

Implemented alert classes include:

- appointment not found;
- care coverage unconfirmed;
- transport unconfirmed;
- linked transport missing;
- accessibility evidence missing;
- module not authorised;
- module disabled;
- human review required.

A linked Care and Transport failure is marked urgent and requires human review.

Unknown accessibility remains unknown. The network does not invent venue features or treat inference as accreditation.

## Request-scoped consent

The network reuses the existing MapAble session-consent framework.

Selecting a module authorises the corresponding summary scope for that request only.

Accessibility-profile use remains off by default and invokes the existing governed `read_mobility_preferences` tool only after explicit selection.

The mission graph records whether profile access was:

- available;
- missing;
- not authorised;
- disabled;
- unavailable and requiring review.

## Tool boundaries

Operational records are read through the existing typed intelligence tool registry:

- `read_upcoming_appointments`
- `read_care_requests`
- `read_transport_trips`
- `read_public_jobs`
- `read_access_places`
- `read_invoices`
- `read_mobility_preferences`

Every tool checks its input schema, role permission and request-scoped consent.

Agents do not receive Prisma or Supabase clients.

## Robotics boundary

CareOS may prepare or simulate a robotics task contract. It may not issue raw commands to motors, joints, brakes, wheelchairs, beds, hoists, doors or robotic arms.

Any future physical execution requires a separate device-specific trust gateway with:

- participant mandate;
- exact action proposal;
- explicit approval;
- environment validation;
- independent safety controller;
- emergency stop;
- timeout and safe-state behaviour;
- complete action receipt.

`MAPABLE_CAREOS_ROBOTICS_MCP_ENABLED` remains false by default.

## Environment flags

```env
MAPABLE_AI_ENABLED=true
MAPABLE_CAREOS_NETWORK_ENABLED=true
MAPABLE_CAREOS_CONTINUITY_ENABLED=true
MAPABLE_CAREOS_ROBOTICS_MCP_ENABLED=false

MAPABLE_AI_CORE_ENABLED=true
MAPABLE_AI_CARE_ENABLED=true
MAPABLE_AI_TRANSPORT_ENABLED=true
MAPABLE_AI_ACCESS_ENABLED=true
MAPABLE_AI_JOBS_ENABLED=true
MAPABLE_AI_MOVES_ENABLED=false
MAPABLE_AI_FOODS_ENABLED=false
MAPABLE_AI_PAYMENTS_ENABLED=false

MAPABLE_AI_MODEL_REASONING_ENABLED=true
MAPABLE_AI_WRITE_ACTIONS=false
MAPABLE_AI_MEMORY_ENABLED=false
MAPABLE_AI_AUDIT_ENABLED=true
```

All flags are server-side. Do not expose them with `NEXT_PUBLIC_` prefixes.

## Tests

`tests/careos-agentic-network.test.ts` covers:

- mission request validation;
- profile consent default;
- network and continuity flags;
- global kill switch;
- robotics disabled by default;
- participant advocate and manager activation;
- human-only safeguarding;
- research-only robotics;
- linked Care and Transport dependency;
- missing-access-evidence handling;
- preservation of not-authorised and disabled states.

Before merge run:

```bash
pnpm install
pnpm type-check
pnpm format:check
pnpm lint
pnpm test
pnpm build
```

The implementation environment used the GitHub connector and did not run local package commands.

## Rollback

Disable only the CareOS network:

```env
MAPABLE_CAREOS_NETWORK_ENABLED=false
```

Disable Continuity Radar:

```env
MAPABLE_CAREOS_CONTINUITY_ENABLED=false
```

Keep robotics MCP disabled:

```env
MAPABLE_CAREOS_ROBOTICS_MCP_ENABLED=false
```

Disable the entire intelligence layer:

```env
MAPABLE_AI_ENABLED=false
```

To remove the participant surface while preserving other intelligence functions, remove `CareOSAgenticNetwork` from `app/ask/AskPageClient.tsx`.

No Prisma migration is introduced by this increment.

## Next safe increments

1. Add deterministic worker and provider capability read services.
2. Add a participant-controlled Life Twin backed by inspectable preference records.
3. Add provider-response and cancellation events to Continuity Radar.
4. Add draft-only Care and Transport request tools.
5. Introduce signed approval routes only after shadow-mode evaluation.
6. Keep safeguarding, clinical decisions, payments and physical robotics outside autonomous control.
