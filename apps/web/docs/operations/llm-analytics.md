# LLM analytics

MapAble uses the Vercel AI SDK for natural-language provider search and
provider-finder assistant replies.

## Instrumented call sites

- `lib/search/interpreter/parse-query.ts`
- `lib/search/interpreter/resolve-access-needs-llm.ts`
- `lib/provider/finder/conversation/stream-assistant.ts`

## Provider

Server-side PostHog capture is enabled only when `POSTHOG_API_KEY` is set.
`POSTHOG_HOST` defaults to `https://us.i.posthog.com`.

Captured event:

- `$ai_generation`

Captured properties:

- trace name;
- model id;
- provider type;
- latency;
- success/error flag;
- token counts when returned by the AI SDK;
- non-sensitive query/output length metadata.

Raw prompts, raw replies and participant support details are intentionally not
captured in this baseline.

## Required environment variables

```env
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com
```

## Privacy guardrails

- Do not send NDIS plan details, clinical information, disability disclosures or
  free-text support details to analytics events.
- Link events to users only after identity and consent rules are reviewed.
- Keep PostHog project region aligned with MapAble privacy and hosting decisions.
