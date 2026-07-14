# MapAble Mobile Shell (Phase 13)

Portable shell strategy for CareOS mobile, voice, and communication access.

## Strategy

This folder documents how the web PWA shell and future React Native client share contracts without duplicating domain logic.

1. **Domain services stay on the server** — `lib/communication/`, booking APIs, and CareOS orchestration remain authoritative. Mobile clients call REST endpoints; they do not reimplement business rules.
2. **Shared contracts live in `mobile-contracts/`** — Zod schemas for offline queue items, communication passport summaries, voice intents, and push preferences. Extend these files; do not fork schemas per platform.
3. **Platform adapters are swappable** — `lib/platform/offline/`, `lib/platform/sync/`, `lib/platform/push/`, and `lib/platform/speech/` define interfaces. Web PWA uses browser storage and stub providers; native clients supply real implementations.
4. **Offline is shell-only** — the service worker caches navigation shell assets. Participant records, communication passports, and mission data are never cached offline by default.

## Portable shell layers

| Layer | Web PWA | Native (future) |
|-------|---------|-----------------|
| Offline queue | `localStorage` via `queue-store.ts` | IndexedDB / SQLite |
| Sync | `sync-service.ts` adapters | Same adapter interface |
| Push | `StubPushProvider` | FCM / APNs provider |
| Speech | `BrowserSpeechRecognitionProvider` | OS speech APIs |
| Voice intents | `voice-intent-service.ts` | Same parser + confirmation UI |

## Feature flags

See `lib/config/mobile-communication.ts` and `.env.example`:

- `MAPABLE_PWA_OFFLINE_ENABLED`
- `MAPABLE_MOBILE_PUSH_ENABLED`
- `MAPABLE_AAC_COMMUNICATION_ENABLED`
- `MAPABLE_VOICE_COMMANDS_ENABLED`

Hardcoded safety flags (never enable via env):

- `voiceBypassConfirmationEnabled = false`
- `speechDifficultyImpliesCapacityReduction = false`

## Related docs

- `mobile-contracts/MOBILE_APP_ARCHITECTURE.md` — overall mobile architecture
- `mobile-contracts/MOBILE_SCREEN_MAP.md` — screen inventory
- `mobile-contracts/schemas/mobile-communication.ts` — Phase 13 shared schemas
- `docs/careos/mobile-communication.md` — accessibility and voice confirmation guidance

## Communication passport

Participants author their own communication passport (AAC preferences, saved phrases, emergency card). Speech difficulty is **never** treated as reduced capacity. Providers read published passports with participant consent scope — no automatic capacity inference.

## Voice commands

Structured intents: open mission, check bookings, report cancellation, prepare message, review options. Consequential actions always surface an accessible confirmation screen; bypass is disabled at the config level.
