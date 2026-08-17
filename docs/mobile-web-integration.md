# Mobile ↔ web integration

The unified repository now contains a first real cross-application vertical slice between the Expo/React Native app in `apps/mobile` and the MapAble web platform in `apps/web`.

## First integrated capability: accessible-place search

The mobile app uses the existing web endpoint:

`GET /api/access/search`

The endpoint is implemented by `apps/web/app/api/access/search/route.ts` and accepts the existing `accessSearchQuerySchema` filters from `apps/web/types/access-map.ts`.

The first native slice deliberately uses only:

- `q` — text entered by the user
- `limit=5`
- `sort=relevance`

It does **not** request device location and does not send latitude or longitude automatically. Location-aware search can be added later only behind explicit location permission and a clear purpose statement.

## Mobile configuration

Set the deployed MapAble web platform URL in the Expo mobile environment:

```text
EXPO_PUBLIC_MAPABLE_API_URL=https://your-mapable-web-host.example
```

Copy `apps/mobile/.env.example` to a local `.env` when developing locally. Do not commit production secrets. `EXPO_PUBLIC_` values are public client configuration and must never contain secrets or privileged credentials.

When `EXPO_PUBLIC_MAPABLE_API_URL` is absent, the mobile UI displays a clear not-configured state and does not pretend that prototype data is live.

## Runtime boundary

The client lives in `apps/mobile/src/runtime/mapableApi.ts`.

It:

- strips a trailing slash from the configured base URL;
- requires a non-empty user search query;
- URL-encodes the text query;
- requests JSON from the existing MapAble endpoint;
- rejects non-2xx responses;
- rejects malformed response envelopes;
- returns the web platform's place, confidence, review-count and accreditation fields to the mobile UI.

The mobile UI keeps confidence visible and reminds the user that accessibility information can change.

## Authentication

This first endpoint does not introduce a new native authentication mechanism. The existing mobile architecture notes that authenticated mobile access will require either the current session approach where viable or a future token-exchange flow.

Do not embed privileged web credentials in the mobile bundle. Authenticated participant, worker, driver and provider-admin APIs should be integrated only after the native authentication and consent boundary is explicitly designed and reviewed.

## Expo web caveat

Native iOS/Android fetch is not subject to browser CORS in the same way as Expo web. If the Expo web export is hosted on a different origin from the MapAble web application, the web deployment will need an approved same-origin proxy or explicit CORS policy before this live search can work there.

## Next slices

Recommended sequence:

1. accessibility profile read/write with explicit authentication;
2. consent and communication preferences;
3. saved place/journey preferences;
4. participant calendar/bookings;
5. offline-safe drafts for the specific workflows already permitted by the mobile architecture;
6. Indy proposals that use platform data but retain deterministic permission checks and explicit approval for consequential actions.
