# Natural-language search interpreter

Provider Finder and homepage search can call **`POST /api/search/interpret`** to turn free-text queries (for example *"Wheelchair accessible transport near Parramatta"*) into structured filters and a canonical **`service_categories`** slug.

Prisma remains the **source of truth** for categories. Optional Elasticsearch (phase 2) and a Hugging Face classifier (phase 3) only accelerate slug resolution.

## Architecture

1. **Parse** — Vercel AI SDK `generateObject` with an NDIS-aware system prompt (`lib/search/interpreter/parse-query.ts`).
2. **Resolve category** — Validate LLM slug, then ES `multi_match`, then keyword scoring against Prisma (`lib/search/interpreter/resolve-service-category.ts`).
3. **Resolve access** — Map `access` text to `ACCESS_NEEDS` ids via validated LLM ids, keyword scoring, and optional dedicated needs LLM step ([`nl-needs-interpreter.md`](./nl-needs-interpreter.md), `lib/search/interpreter/resolve-access-needs.ts`).
4. **Client** — Provider Finder and homepage apply fields and optional `supportType` chip (`lib/search/apply-interpretation.ts`).

Trivial queries skip the LLM via `looksLikeNaturalLanguage` to save latency and cost.

## Environment variables

| Variable | Purpose |
| -------- | ------- |
| `SEARCH_INTERPRETER_ENABLED` | Set to `false` to force passthrough (default: enabled when keys exist) |
| `AI_GATEWAY_API_KEY` or `VERCEL_AI_GATEWAY_API_KEY` | Preferred: Vercel AI Gateway (required for gpt-oss on mapable.com.au) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Fallback: `@ai-sdk/google` (Gemini only) |
| `SEARCH_INTERPRETER_MODEL` | Gateway-style id, e.g. `openai/gpt-oss-120b` (production) or `google/gemini-3.5-flash` |
| `GPT_OSS_BASE_URL` / `GPT_OSS_API_KEY` | Optional self-hosted OpenAI-compatible override; not used on mapable.com.au |
| `ES_URL`, `ES_API_KEY` | Optional Elasticsearch replica (phase 2) |
| `ES_SERVICE_CATEGORY_ALIAS` | Default `mapable_service_categories_current` |
| `SEARCH_INTERPRETER_CLASSIFIER_HUB_ID` | Optional HF model repo (phase 3) |
| `HF_TOKEN` or `HUGGINGFACE_API_KEY` | HF Inference API for classifier hint |
| `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED` | Emit `search_query_interpreted` in the browser |

**Production (`https://mapable.com.au`):** set `SEARCH_INTERPRETER_MODEL=openai/gpt-oss-120b` with `AI_GATEWAY_API_KEY`. Confirm via `GET /api/mapable/ai-status`.

See [`.env.example`](../../.env.example).

## API (agents)

- **Path:** `POST /api/search/interpret`
- **Operation id:** `searchInterpretQuery`
- **Headers:** Response includes `X-Operation-Id: searchInterpretQuery`
- **Body:** `{ "query": string, "context"?: "homepage" | "provider_finder" }`
- **Rate limit:** 30 requests / minute / IP (in-memory per instance)
- **OpenAPI:** [`docs/api/openapi-search-interpret.yaml`](../api/openapi-search-interpret.yaml)

Example:

```bash
curl -sS -X POST "$BASE_URL/api/search/interpret" \
  -H "Content-Type: application/json" \
  -d '{"query":"OT assessment in Parramatta","context":"provider_finder"}'
```

## MapAble Ask on Provider Finder

On `/provider-finder`, the **Ask MapAble** panel calls `POST /api/mapable/ask` with `context: "provider_finder"`.

- **Guests** — No sign-in required. Response includes NL interpretation, suggested filters (`finder` payload), and directory disclaimer. No PRMS drafts.
- **Signed-in users** — Same finder payload plus Co-Pilot intents (care, transport, NDIS plan, etc.) when the question matches.

Shared logic lives in `lib/provider-finder/ask-bridge.ts` (also used by hero search and `/api/search/interpret`).

**Agentic behaviour (optional):**

- After interpretation, the server may query live `ndis_providers` via `searchNdisProviders` and return up to `PROVIDER_FINDER_RESULTS_LIMIT` rows in `results[]` (directory export — not MapAble-verified).
- Multi-turn: send a stable `sessionId` (stored in `sessionStorage` on the panel) and `messages[]`; server session store merges filters across turns (`lib/agent-sessions/provider-finder-session.ts`).
- Low confidence (`< 0.55`) or **unresolved access needs** (access mentioned but no chip id) can return `agent.status: needs_clarification` without running search until the user replies. See [nl-needs-interpreter.md](./nl-needs-interpreter.md).
- `SEARCH_AGENT_ENABLED=true` uses `lib/agent/run-agent-turn.ts` (bounded tool steps, `toolsCalled` logged to `AgentRun` when persistence is on).
- `PROVIDER_FINDER_AUTO_SHOW_RESULTS=true` auto-opens the result list when confidence ≥ `PROVIDER_FINDER_AUTO_SHOW_MIN_CONFIDENCE`.

Use **Show results** or the **Show matching providers** action card to apply filters and open the result list.

## Streaming chat (Slack / legacy)

`POST /api/provider-finder/chat` remains for Slack and other streaming clients. It uses the same ask bridge and emits `data-finderInterpretation` for AI SDK UI consumers.

Optional **Slack** bot: `lib/provider-finder/chat-sdk/find-bot.ts` + `POST /api/chat/slack` when `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` are set. Slash commands: `/finder`, `/providers`.

## UI behaviour

- **Provider Finder** — On search submit, calls the interpret API, fills `query`, `location`, `serviceQuery`, `accessQuery`, `providerName`, and maps slug → `supportType` when known.
- **Ask MapAble panel** — Applies filters from each response’s `finder` payload; **Show results** submits the search view.
- **Low confidence** — When `parsed && confidence < 0.6`, shows: *AI-suggested filters — adjust if needed.*
- **Homepage** — Debounced interpret before redirect to `/provider-finder?...` when the combined query is at least 3 characters.

## Analytics

When `NEXT_PUBLIC_PRODUCT_ANALYTICS_ENABLED=true`, the client dispatches `mapable-analytics` with event **`search_query_interpreted`** and properties:

- `context`, `parsed`, `confidence`, `service_category_slug`, `engine_id`

## Catalog setup

Seed service categories (same data autocomplete uses):

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/ensure-search-autocomplete.sql
npx tsx prisma/seed-search-autocomplete.ts
```

## Testing

```bash
pnpm test tests/search-interpreter.test.ts
```

Resolver tests mock Prisma via `listServiceCategories` fallback catalog; no network calls.

## Related docs

- [Predictive search suggestions](../search-predictive-suggestions.md) — autocomplete (rules-based)
- [Elasticsearch service categories](./elasticsearch-service-categories.md) — phase 2 replica
- [HF category classifier](./hf-category-classifier.md) — phase 3 optional accelerator
- [NL access needs interpreter](./nl-needs-interpreter.md) — ACCESS_NEEDS chip resolution and clarification
