# Guided search dialogue

Streaming guided search launches from the marketing header search bar (`#mapable-care-search-header` and `#mapable-care-search-header-mobile`) and reuses the same dialogue on Provider Finder.

## Header launch flow

1. User focuses the header search input and types a query (minimum three characters).
2. Pressing **Find** opens an in-place chat panel in the dropdown instead of navigating away.
3. The first message is sent to `POST /api/provider-finder/chat`.
4. Popular search chips also launch the chat panel with the selected prompt.
5. When filters are ready, **Show matching providers** navigates to `/provider-finder` with applied URL params.

Short queries (under three characters) still use the legacy redirect via `buildGuidedSearchUrl()`.

## Streaming protocol

The chat route returns an AI SDK UI message stream with this part order:

1. `data-finderAgent` — session id, turn index, clarification slot, suggested choices, filled slots, provider results
2. `data-finderInterpretation` — structured interpretation and applied finder fields
3. Text deltas — assistant reply (streamed when the search interpreter LLM is configured, otherwise one chunk)

### `data-finderAgent`

| Field | Purpose |
|-------|---------|
| `sessionId` | Multi-turn session key (client uses `sessionStorage`) |
| `turnIndex` | Monotonic turn counter |
| `status` | `needs_clarification` or `complete` |
| `clarificationSlot` | `location`, `service`, `access`, or `general` |
| `suggestedChoices` | Chip labels for service and access slots |
| `filledSlots` | Progress checklist for location / support / access |
| `providerResults` | NDIS directory snippets when complete |

### Clarification chip → session mapping

| Slot | Session field updated | User message sent |
|------|----------------------|-------------------|
| `service` | `serviceQuery` | Chip label/value |
| `access` | `accessQuery` | Chip label/value |
| `location` | `location` | Autocomplete selection or typed suburb |
| `general` | `query` | Free-text follow-up |

Location clarification uses `AccessibleAutocomplete` (no static chip list).

## Client components

| Component | Role |
|-----------|------|
| `components/guided-search/GuidedSearchDialogue.tsx` | `useChat` + `DefaultChatTransport` |
| `GuidedSearchMessageList.tsx` | Streaming bubbles |
| `GuidedSearchSlotProgress.tsx` | Location / Support / Access checklist |
| `GuidedSearchChoiceChips.tsx` | Suggested answers |
| `GuidedSearchComposer.tsx` | Message input |

Provider Finder wraps the same component via `ProviderFinderAskPanel`.

## Chat stream vs `/api/mapable/ask`

| Endpoint | Use |
|----------|-----|
| `POST /api/provider-finder/chat` | Guided search dialogue (header + Provider Finder), streaming |
| `POST /api/mapable/ask` | Signed-in copilot (drafts, confirmations, booking agent routing) |

Both share `runProviderFinderAskTurn` and `getClarificationGuidance()` for consistent clarification metadata.

## Verification

```bash
pnpm type-check
pnpm exec vitest run tests/clarification-guidance.test.ts tests/guided-search-stream.test.ts tests/guided-search-dialogue.test.tsx tests/guided-search-header.test.tsx
```
