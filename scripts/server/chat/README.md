# MapAble Chat core (`server/chat/`)

MapAble Chat is built from small, self-contained **capability modules** wired
together by a **module registry**, narrowed each turn by a pluggable **intent
router**, and run by the **engine** against a typed, per-turn **ChatContext**.
Channels reach the engine through a **PlatformAdapter** seam (web is the first
implementation).

`server/chat-engine.ts` is now a thin shim that re-exports this folder, so every
existing `import { processChat } from "../chat-engine"` keeps working unchanged.

## Layout

| File | Responsibility |
| --- | --- |
| `types.ts` | Shared contracts: `ChatModule`, `ChatContext`, `IntentRouter`, `PlatformAdapter`, `ToolHandler`, `ChatResponse`, `ClientContext`. |
| `registry.ts` | `ModuleRegistry` — indexes every module's tool schemas → handlers; throws at construction if a declared tool has no handler. |
| `router.ts` | `KeywordIntentRouter` (the default `IntentRouter`) — narrows tools per turn, always keeps `alwaysOn` modules, falls back to **all** modules when a turn is ambiguous. |
| `context.ts` | `buildChatContext()` — resolves user, access profile, session channel and staff/admin status **once** per turn. |
| `prompt.ts` | `SYSTEM_PROMPT` — guardrail policy preamble + accessibility persona (verbatim). |
| `quick-actions.ts` | `extractQuickActions()` + `determineConfidence()` — centralised so every channel returns identical quick-action keys and confidence labels. |
| `platforms/web.ts` | `WebPlatformAdapter` — maps the `/api/chat/send` body to a normalised inbound message and serialises the response. |
| `engine.ts` | `processChat()` — orchestrates guardrails → context → router → OpenAI tool loop → rules engine → output guardrails → persistence → audit. |
| `sessions.ts` | Session CRUD: create / list / messages / delete. |
| `modules/` | One file per capability domain (see below). |
| `index.ts` | The public surface re-exported by the shim. |

## How a turn flows

1. `processChat()` ensures guardrail tables exist and loads prior messages.
2. `buildChatContext()` assembles the typed `ChatContext` (user, profile,
   channel, `isStaffOrAdmin`, optional `clientContext`, `db`, `storage`).
3. Input guardrails (`classifyUserTurn`) run. A blocking/template verdict short
   circuits with the safeguarding template **before** any LLM call — unchanged.
4. The intent router picks the candidate modules; the registry flattens their
   tool schemas into the `tools` array for this turn.
5. The OpenAI loop (gpt-4o, `tool_choice: "auto"`, max 5 iterations) runs. Each
   tool call is dispatched to its handler via `registry.getHandler(name)`.
6. The rules engine adds accessibility/budget warnings, output guardrails run,
   quick actions + confidence are derived, the assistant message is persisted,
   and a guardrail audit row is written.

The model, provider, prompt, guardrails, quick-action logic and persistence are
all preserved — this refactor changes **structure, not behaviour**.

## Adding a new capability module

1. Create `modules/<name>.ts` exporting a `ChatModule`:

   ```ts
   import type { ChatModule } from "../types";

   export const exampleModule: ChatModule = {
     name: "example",
     description: "What this capability does.",
     intents: ["keyword", "another keyword"], // lower-case triggers for the router
     // alwaysOn: true,                        // set for safety/escalation/profile-type modules
     quickActions: ["view_example"],           // informational; extraction stays centralised
     tools: [
       {
         type: "function",
         function: {
           name: "do_example",
           description: "...",
           parameters: { type: "object", properties: {}, required: [] },
         },
       },
     ],
     handlers: {
       // one handler per tool name; receives (args, ctx) and returns a JSON string
       do_example: async (_args, ctx) => JSON.stringify({ userId: ctx.userId }),
     },
   };
   ```

2. Register it in `modules/index.ts` by adding it to the `chatModules` array.

That's it — no edits to `engine.ts`, `registry.ts` or `router.ts`. The registry
will throw at startup if a tool is declared without a matching handler, so a
typo surfaces immediately.

### Module conventions

- **Handlers return a JSON string.** The engine feeds it straight back to the
  model as the tool result, exactly as before.
- **Read user/profile/session facts from `ctx`**, not by re-querying storage.
- **Use `ctx.db` / `ctx.storage`** for data access so handlers stay testable.
- **`alwaysOn` modules** (`profile`, `safeguarding`, `handoff`) are exposed on
  every turn so safety and escalation paths can never be routed away.

## Current modules

| Module | Tools | Always on |
| --- | --- | --- |
| `profile` | `get_user_profile` | ✅ |
| `transport` | `search_transport_workers`, `get_transport_pricing`, `book_transport` | |
| `barriers` | `check_barrier_reports`, `submit_barrier_report` | |
| `shifts` | `get_upcoming_shifts`, `book_shift` | |
| `billing` | `get_pending_invoices`, `get_budget_summary` | |
| `ndis` | `get_ndis_plan_goals` | |
| `grocery` | `search_grocery_products`, `get_grocery_orders`, `navigate_to_groceries`, `view_grocery_cart` | |
| `safeguarding` | `log_incident_draft`, `log_complaint_draft`, `record_consent`, `flag_safeguarding_concern` | ✅ |
| `handoff` | `escalate_to_human` | ✅ |

## Human handoff

`escalate_to_human` now writes a real `chat_handoffs` record (lifecycle
`requested → assigned → resolved`) in addition to acknowledging the escalation in
the reply. Admins action the queue on `/admin/chat-guardrails` (Human handoffs
tab) via `GET /api/admin/chat/handoffs` and `PATCH /api/admin/chat/handoffs/:id`.

## Adding a new channel

Implement `PlatformAdapter` (see `platforms/web.ts`): `parseInbound()` maps the
raw channel payload to an `InboundMessage`, `formatOutbound()` serialises the
`ChatResponse`. The engine itself stays channel-agnostic — it only needs the
`sessionId`, `userId`, message text and optional `clientContext`.

Channels reach the engine through `processInbound(adapter, raw)`, which calls
`adapter.parseInbound()`, runs `processChat()`, then returns
`adapter.formatOutbound()`. The web route (`/api/chat/send`) calls
`processInbound(webPlatformAdapter, …)`; a new channel just supplies its own
adapter to the same function.
