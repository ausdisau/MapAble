# Predictive search suggestions

Provider Finder and homepage search use a unified **predictive suggestions** layer: proactive curated results before typing, and ranked reactive results as the user types.

## Modes

| Mode | When | API |
|------|------|-----|
| `proactive` | Input focused, fewer than 2 characters | `GET /api/search/autocomplete?mode=proactive&context=homepage` |
| `reactive` | Query length ≥ 2 | `GET /api/search/autocomplete?q=...&mode=reactive&context=...` |

Responses include `groups` (same shape as before) and `meta` (`mode`, `degraded`, optional `sourceCounts`).

## Ranking (rules-based, no ML)

Scoring in `lib/search/suggestion-ranking.ts`:

- Prefix match on label (highest)
- Substring / keyword match
- `PopularSearch.weight`
- Verified providers
- Optional client `signals`: `recentQueries`, `preferredState` (from location field)

## Data sources

- `popular_searches`, `service_categories`, `searchable_locations`, `provider_profiles`, etc.
- Hero chips load from the same proactive catalog via `useProactiveChipSuggestions`, with static fallback in `HERO_SUGGESTED_SEARCHES_FALLBACK`.

## Setup

```bash
npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/ensure-search-autocomplete.sql
npx tsx prisma/seed-search-autocomplete.ts
```

If the database tables are empty, the API serves a **built-in static catalog** (`lib/search/suggestion-fallback-catalog.ts`) and sets `meta.degraded` with `static_fallback`. `searchAutocompleteWithMeta` applies the same fallback if the engine still returns empty groups.

### Production checklist when suggestions are empty

1. Confirm the latest `main` deployment is **Ready** on Vercel (`mapableau-new`).
2. Hit proactive API: `GET /api/search/autocomplete?mode=proactive&context=homepage` — expect non-empty `groups` or `meta.degraded: true` with `static_fallback`.
3. Seed production Neon (one-time):

   ```bash
   npx prisma db execute --schema prisma/schema.prisma --file prisma/sql/ensure-search-autocomplete.sql
   DIRECT_URL="postgresql://..." npx tsx prisma/seed-search-autocomplete.ts
   ```

Run the seed on production Neon so results include live provider profiles and curated DB weights.

## Governance

Suggestions are explainable and advisory. This is not the masterplan ML “no-show / continuity risk” predictive layer.

## Natural-language interpreter

For full-sentence queries (for example *"Wheelchair accessible transport near Parramatta"*), use **`POST /api/search/interpret`** instead of autocomplete alone. That endpoint uses the Vercel AI SDK plus Prisma catalog resolution to populate Provider Finder filters and canonical `service_categories` slugs.

See [nl-interpreter.md](./search/nl-interpreter.md) for environment variables, agent contract (`searchInterpretQuery`), and UI wiring.

## Limits

- Autocomplete rate limit remains per-process in-memory (120 req/min/IP); use a shared store for multi-instance production.
- Interpret endpoint rate limit is 30 req/min/IP (in-memory per instance).
- Location data uses local `searchable_locations` plus **Australia Post PAC postcode search** when `AUSPOST_PAC_API_KEY` is set on the server (suburb-level suggestions such as "St Ives" or "2150"). Set `AUSPOST_PAC_ENABLED=false` to disable.
