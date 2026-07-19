# MapAble Companion (Expo foundation)

Native Expo shell — **not** a WebView wrapper.

## R1 scope

- Secure authentication (session/token against MapAble API)
- Communication Passport sync
- Upcoming care and transport reminders (redacted notifications)
- Offline Visit Pack in **encrypted** local storage
- Device enrolment + lost-device revocation
- Stop AURA
- No compulsory smartphone pathway (web remains essential)

## Non-goals (R1)

- Live vision navigation
- Background recording
- QR-only access
- Plain AsyncStorage for Visit Packs

## Run (after workspace install)

```bash
cd apps/companion
pnpm install
pnpm start
```

Server APIs (flags off by default):

- `POST /api/companion/visit-pack`
- `POST /api/companion/devices`
