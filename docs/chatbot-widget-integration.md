# MapAble Chatbot Widget — Integration Guide

## Purpose

The chatbot widget is a site-wide, accessibility-first floating assistant that
sits over every page of the MapAble app once the user is signed in. It exposes
three tabs (Chat, Actions, History), reuses the existing `/api/chat/*` endpoints
without modification, and is structured so future NLP, voice, matching,
contracts, and attestation services can be plugged in without UI changes.

## Component structure

All widget code lives under `client/src/components/chatbot-widget/`:

| File | Role |
| --- | --- |
| `ChatbotWidget.tsx` | Top-level entry. Mounts launcher + panel, wires state, sources history. |
| `ChatbotLauncher.tsx` | Floating round button (bottom-right). |
| `ChatbotPanel.tsx` | Sheet wrapper — right side on desktop, bottom sheet on mobile. |
| `WidgetTabs.tsx` | Tablist using shadcn `Tabs`, conditional on `config.tabs`. |
| `ChatTab.tsx` | Embedded chat experience (uses existing chat API). |
| `ActionsTab.tsx` | Five accessible action cards. |
| `HistoryTab.tsx` | Recent conversations / drafts / pending actions. |
| `useWidgetState.ts` | Open/tab/session state, persisted in `sessionStorage`. |
| `useWidgetConfig.ts` | Loads `/api/widget-config`, falls back to defaults. |
| `types.ts` | Public types and `DEFAULT_WIDGET_CONFIG`. |
| `index.ts` | Lazy-loadable default export. |

## Tab behaviour

- **Chat** — embeds the existing chat session/message/send flow against
  `/api/chat/sessions` and `/api/chat/send`. The tab includes a voice input
  affordance backed by the browser's Web Speech API. The transcript is shown
  for review and edit; nothing is auto-sent. If permission is denied or voice
  is unsupported, a clear fallback message is shown and the user can type
  instead. Voice UI is hidden when `featureFlags.voiceEnabled` is false.
- **Actions** — five accessible cards: create support request, book accessible
  transport, create job post, ask about NDIS funding, contact support. Each
  fires `onActionSelect(actionKey)`. The default handler either switches to
  Chat with a seeded prompt or routes via `wouter` to the relevant page.
- **History** — driven by props. Recent conversations are populated from
  `/api/chat/sessions`. Saved drafts and pending actions accept empty arrays
  by default; pass props to surface real data when available.

Open state and selected tab are persisted in `sessionStorage` under
`mapable.widget.open` and `mapable.widget.tab`, and the active chat session
under `mapable.widget.activeSessionId`. Route changes do not unmount the widget.

## Config loading

`useWidgetConfig` calls `/api/widget-config` via React Query. On any error or
non-OK response it returns the hardcoded `DEFAULT_WIDGET_CONFIG`, so the
widget always renders something safe. Returned config is shallow-merged on top
of the default so partial backend responses still work.

The Express route in `server/routes.ts` (`GET /api/widget-config`) returns the
canonical default. Tabs, default tab, feature flags, endpoints, launcher
label, and panel title/subtitle are all configurable from the backend.

## Service layer

Typed wrappers under `client/src/lib/widget-services/` expose stub APIs for
future capabilities. They take a `ServiceContext` with the endpoint injected
from config and return a normalized `ServiceResult<T>`:

- `nlp.ts` — `analyze({ text, locale })`
- `voice.ts` — `transcribe(audio)`, `intake({ transcript, sessionId })`
- `matching.ts` — `findMatches({ serviceType, filters })`
- `contracts.ts` — `create(...)`, `sign(...)`
- `attestations.ts` — `issue(...)`, `verify(...)`

UI components do not contain any direct fetch/business logic for these
domains — they go through the wrappers, which makes it trivial to swap the
backend implementation later without touching the widget UI.

## Accessibility

- Launcher is a real `<button>` with `aria-label`, `aria-expanded`, and
  `aria-haspopup="dialog"`, large 56×56 px touch target.
- Panel uses shadcn `Sheet` (Radix Dialog) — focus is trapped inside while
  open, Escape closes, and focus is returned to the launcher on close.
- Tabs use the shadcn `Tabs` primitive (Radix Tabs) — proper tablist/tab/
  tabpanel roles and arrow-key navigation.
- All clickable controls meet a 44 px minimum touch target.
- Chat message log uses `role="log"` with `aria-live="polite"`.
- Voice transcript review surface and voice errors are announced via
  `role="status"`.
- All buttons and inputs have visible focus rings.

## Integration

The widget is mounted once near the root of `AppLayout` in
`client/src/App.tsx`, lazy-loaded via `React.lazy` + `Suspense`:

```tsx
const ChatbotWidget = lazy(() => import("@/components/chatbot-widget"));
// ...
<Suspense fallback={null}>
  <ChatbotWidget />
</Suspense>
```

The widget hides itself when the user is unauthenticated or when
`config.enabled` is false. Set `enabled: false` in the `/api/widget-config`
response (or override the default) to disable the widget entirely.

## Future extension points

- Add new tabs by extending `WidgetTabKey` in `types.ts`, including the key
  in `config.tabs`, and rendering a new `TabsContent` in `WidgetTabs.tsx`.
- Swap the chat backend by changing `config.endpoints.chat` /
  `config.endpoints.sessions`.
- Add new service wrappers under `client/src/lib/widget-services/` — keep
  them fetch-based and free of UI imports so they remain reusable.
- Add per-route customisation by reading `useLocation()` inside
  `ChatbotWidget` and adjusting tab visibility or seed messages.

## Local development

The widget runs as part of `npm run dev`. To verify:

1. Sign in (e.g. as `alex_m` / `hashed_password`).
2. The blue assistant button appears bottom-right on every page.
3. Click to open — desktop shows a right-side panel, mobile shows a bottom
   sheet.
4. Switch tabs and reload — the previously open tab is restored.
5. With voice enabled, click the mic; on browsers without Web Speech API
   you'll see a fallback message instead.
