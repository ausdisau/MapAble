# Agentic Disability Services

MapAble combines **social sign-in**, **agent-ready REST APIs**, and a **Vercel AI SDK ToolLoopAgent** so participants and support coordinators can discover NDIS providers through natural language.

## Social login

MapAble uses **NextAuth** (not wallet auth). Configure any combination of:

| Provider | Env vars | Callback |
| -------- | -------- | -------- |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `/api/auth/callback/google` |
| Apple | `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | `/api/auth/callback/apple` |
| Microsoft | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` | `/api/auth/callback/azure-ad` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | `/api/auth/callback/facebook` |
| Auth0 | `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` | `/api/auth/callback/auth0` |

Signed-in users unlock the full MapAble Co-Pilot (care, transport, billing). **Provider Finder** (`context: provider_finder`) works for guests.

## Agent-ready APIs

OpenAPI: [`docs/api/openapi-disability-agent.yaml`](./api/openapi-disability-agent.yaml)

| operationId | Endpoint | Auth |
| ----------- | -------- | ---- |
| `searchInterpretQuery` | `POST /api/search/interpret` | Public |
| `mapableAskQuery` | `POST /api/mapable/ask` | Guest for provider_finder |
| `ndisProviderSearch` | `GET /api/providers/ndis/search` | Public |
| `disabilityServicesAgentTurn` | `POST /api/agent/disability-services` | Public (rate limited) |

Every response includes `operationId` and `X-Operation-Id` for agent retry logic. Errors use structured `code` and `retryable` fields.

## AI SDK agent

Enable the ToolLoopAgent:

```bash
DISABILITY_SERVICES_AGENT_ENABLED=true
AI_GATEWAY_API_KEY=...   # or GOOGLE_GENERATIVE_AI_API_KEY
SEARCH_INTERPRETER_MODEL=google/gemini-3.5-flash
DISABILITY_SERVICES_AGENT_MAX_STEPS=6
```

```bash
curl -s -X POST http://localhost:3000/api/agent/disability-services \
  -H 'Content-Type: application/json' \
  -d '{"query":"OT assessment near Parramatta with wheelchair access"}'
```

### Tools

| Tool | Purpose |
| ---- | ------- |
| `interpretFinderQuery` | NL → filters + service category slug |
| `searchNdisProviders` | Query NDIS directory export |
| `geocodeLocation` | Nominatim geocode (when enabled) |
| `explainProvider` | Summarise a provider listing |

The bounded deterministic agent (`SEARCH_AGENT_ENABLED=true`) also logs `geocodeLocation` and `explainProvider` when location or provider name is present.

## Related

- [Natural-language interpreter](./search/nl-interpreter.md)
- [Search interpret OpenAPI](./api/openapi-search-interpret.yaml)
