# CareOS Phase 13 — Mobile, Voice and Communication Access

Phase 13 delivers a portable mobile shell, PWA offline contracts, AAC communication passport, and voice command intents with mandatory confirmation for consequential actions.

## Feature flags

| Env var | Default | Purpose |
|---------|---------|---------|
| `MAPABLE_PWA_OFFLINE_ENABLED` | `false` | Offline shell + queue |
| `MAPABLE_MOBILE_PUSH_ENABLED` | `false` | Push preference stubs |
| `MAPABLE_AAC_COMMUNICATION_ENABLED` | `false` | Communication passport |
| `MAPABLE_VOICE_COMMANDS_ENABLED` | `false` | Voice intent parsing |

Hardcoded (never enable via env):

- `voiceBypassConfirmationEnabled = false`
- `speechDifficultyImpliesCapacityReduction = false`

## Architecture

- **Domain logic**: `lib/communication/` — server-authoritative; no duplication in mobile clients.
- **Platform adapters**: `lib/platform/offline/`, `sync/`, `push/`, `speech/`.
- **Voice intents**: `lib/intelligence/voice/` — structured intents with confirmation gate.
- **Shared contracts**: `mobile-contracts/schemas/mobile-communication.ts`.

## PWA offline

The service worker (`public/sw.js`) caches shell assets only:

- `/`, `/offline`, manifest, icons

Explicitly **excluded** from cache:

- `/api/participant/*`
- `/api/v1/participants`
- `/api/intelligence/*`

Queued offline actions (draft incidents, timesheet notes, messages) sync via `lib/platform/sync/sync-service.ts`. Conflicts require participant review — never auto-merge consequential actions.

Safe logout clears offline queue and session hints via `lib/platform/offline/logout-cleanup.ts`.

## AAC communication passport

Models (migration `20260714140000_mobile_communication`):

- `CommunicationPassport`
- `PreferredQuestion`
- `SavedPhrase`
- `AacMethodPreference`
- `EmergencyCommunicationCard`

**Hard rule**: speech difficulty is never treated as reduced capacity. `assertSpeechDifficultyNotCapacityReduction` rejects inferred capacity-reduction language in participant-authored notes.

## Voice commands

Supported intents:

| Intent | Consequence | Confirmation required |
|--------|-------------|----------------------|
| `open_mission` | read-only | No |
| `check_bookings` | read-only | No |
| `report_cancellation` | consequential | Yes |
| `prepare_message` | consequential | Yes |
| `review_options` | read-only | No |

Consequential actions surface `VoiceConfirmationScreen` with `role="dialog"`, `aria-modal`, and 44px minimum touch targets.

## Accessibility lab

Source inspection tests in `tests/accessibility/mobile-communication/` cover:

- Semantic headings (`h1`, `h2`)
- `aria-labelledby` and `role="status"` for offline/degraded indicators
- Voice confirmation dialog semantics
- Plain-language capacity boundary copy
- Reduced motion: components use CSS transitions only where theme provides `prefers-reduced-motion` support — no mandatory animation for critical flows

Manual checklist:

1. Tab through communication passport page — all panels reachable.
2. Enable offline flag — degraded banner announces via `aria-live`.
3. Trigger consequential voice intent — confirmation screen appears; action blocked without confirm.
4. Verify participant records are not available offline.

## Related

- `mobile/README.md` — portable shell strategy
- `mobile-contracts/MOBILE_APP_ARCHITECTURE.md`
- `lib/config/mobile-communication.ts`
