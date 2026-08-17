# Agentic Booking Services

MapAble provides **auth-scoped booking retrieval** and a **Vercel AI SDK ToolLoopAgent** so signed-in participants and providers can ask natural-language questions about care, transport, and combined bookings.

## Auth and scoping

All booking RAG endpoints require a **NextAuth session**. Retrieval applies role scoping **before** text ranking:

| Role | Scope |
| ---- | ----- |
| Participant | `participantId = user.id` |
| Provider / coordinator | `organisationId IN user org memberships` |
| Admin | Unrestricted (audit logged) |

Sensitive fields (`accessibilitySummary`, mobility snapshots, progress notes) are omitted or redacted unless the viewer has consent-aligned access. See [privacy and audit](./modules/privacy-and-audit.md).

## Agent-ready APIs

OpenAPI: [`docs/api/openapi-booking-agent.yaml`](./api/openapi-booking-agent.yaml)

| operationId | Endpoint | Auth |
| ----------- | -------- | ---- |
| `bookingServicesAgentTurn` | `POST /api/agent/booking-services` | Required |
| `searchBookings` | `POST /api/bookings/rag/search` | Required |

Every response includes `operationId` and `X-Operation-Id` for agent retry logic. Errors use structured `code` and `retryable` fields (shared with disability agent contract).

## Enable the agent

```bash
BOOKING_SERVICES_AGENT_ENABLED=true
AI_GATEWAY_API_KEY=...   # or GOOGLE_GENERATIVE_AI_API_KEY
SEARCH_INTERPRETER_MODEL=google/gemini-3.5-flash
BOOKING_SERVICES_AGENT_MAX_STEPS=6
```

```bash
curl -s -X POST http://localhost:3000/api/agent/booking-services \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{"query":"When is my next care visit?"}'
```

### Tools

| Tool | Purpose |
| ---- | ------- |
| `searchBookings` | NL + optional filters → citable chunks |
| `getBookingContext` | Full grounded context for one `bookingId` |
| `explainBookingStatus` | Deterministic status copy and next steps |

The agent **must** call tools before answering — it cannot invent booking IDs or schedules.

## Direct search API

For agents that only need retrieval (no LLM turn):

```bash
curl -s -X POST http://localhost:3000/api/bookings/rag/search \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{"query":"pending care bookings this week","recordType":"care"}'
```

## Co-Pilot routing

When `BOOKING_SERVICES_AGENT_ENABLED=true`, signed-in users asking booking lookup questions via `POST /api/mapable/ask` (e.g. "my booking", "next visit", "transport tomorrow") are routed to the booking agent instead of draft-only copilot planning.

## Retrieval engine

v1 uses a **Postgres hybrid engine** (`BOOKING_RAG_ENGINE_ID=hybrid-v1`):

- Structured filters parsed from query hints (date range, status, type)
- TF + phrase boost + recency/status scoring
- Chunked, citable excerpts (~600 chars) with `chunkId` and `sourceType`

The engine is pluggable via `setBookingRAGEngine()` for tests and future vector/OpenSearch backends.

## Optional OpenSearch sync

When `OPENSEARCH_URL` is configured, batch-sync keyword chunks:

```bash
npx tsx scripts/sync-booking-chunks-to-opensearch.ts
npx tsx scripts/sync-booking-chunks-to-opensearch.ts --participant-id=<uuid>
```

Index: `mapable_booking_chunks_v1` (keyword + text fields; no embeddings in v1).

## Out of scope (v1)

- Guest/public booking RAG
- Auto-mutations (accept, cancel, reschedule)
- NDIS policy document corpus

## Related

- [Agentic disability services](./agentic-disability-services.md)
- [Disability agent OpenAPI](./api/openapi-disability-agent.yaml)
