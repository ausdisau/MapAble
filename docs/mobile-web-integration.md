# Mobile ↔ web integration

The unified repository contains cross-application vertical slices between the Expo/React Native app in `apps/mobile` and the MapAble web platform in `apps/web`.

## 1. Accessible-place search

The mobile app uses the existing web endpoint:

`GET /api/access/search`

The first native search slice deliberately sends only:

- `q` — text entered by the user;
- `limit=5`;
- `sort=relevance`.

It does **not** request device location and does not send latitude or longitude automatically. Location-aware search must remain behind explicit permission and a clear purpose statement.

## 2. Native identity + My Access

The mobile app now has a server-mediated browser sign-in flow for participant identity and accessibility preferences.

### Authorization flow

1. The native app creates a cryptographically random PKCE verifier with `expo-crypto`.
2. It derives an S256 challenge and random `state` value.
3. The app opens `GET /api/mobile/auth/authorize` in the system browser.
4. If there is no MapAble web session, the endpoint redirects to the existing `/login` experience. Passwords, passkeys and two-factor codes remain in the web authentication flow and are never collected by the React Native screen.
5. After web authentication, MapAble issues a short-lived signed authorization code bound to the PKCE challenge and the allowlisted `mapable://auth/callback` redirect.
6. The native app validates `state` and exchanges the code plus verifier at `POST /api/mobile/auth/token`.
7. The server returns a 15-minute bearer token limited to:
   - `identity:read`;
   - `accessibility:read`;
   - `accessibility:write`.

The access token is accepted only by explicitly mobile-safe API boundaries. The remainder of the web API continues to require its existing web session and permission checks.

### Identity endpoint

`GET /api/mobile/auth/me`

Requires a mobile bearer token with `identity:read` and returns only the current user's identity/role context needed by the client.

### Accessibility endpoints

The existing endpoints now accept either the existing web cookie session or a correctly scoped mobile bearer token:

- `GET /api/accessibility-profile` — `accessibility:read`;
- `PATCH /api/accessibility-profile` — `accessibility:write`;
- `GET /api/accessibility-profile/digital-preferences` — `accessibility:read`;
- `PATCH /api/accessibility-profile/digital-preferences` — `accessibility:write`.

The existing audit event for accessibility changes remains in place. Preference values are not added to the audit metadata.

### Mobile My Access behaviour

`apps/mobile/src/components/MobileIdentityCard.tsx` provides:

- browser-based sign-in;
- explicit signed-in identity context;
- loading/error states;
- high-contrast, reduced-motion and large-text synchronization;
- communication preferences for plain language, AAC, Auslan, written-only, support-person, SMS, email and phone;
- local sign-out.

The general accessibility profile PATCH schema contains defaults, so communication updates use a fetch-and-merge operation before writing. This prevents a narrow communication change from resetting unrelated accessibility data.

## Configuration

### Mobile public configuration

Set the deployed MapAble web platform URL in the Expo environment:

```text
EXPO_PUBLIC_MAPABLE_API_URL=https://your-mapable-web-host.example
```

`EXPO_PUBLIC_` values are public client configuration. Never put secrets or privileged credentials in them.

### Web/server configuration

Production must set a dedicated secret for signing mobile authorization/access tokens:

```text
MOBILE_AUTH_SECRET=<high-entropy server-only secret>
```

Allowed native callbacks may be configured as a comma-separated server-only value:

```text
MOBILE_AUTH_REDIRECT_URIS=mapable://auth/callback
```

When `MOBILE_AUTH_REDIRECT_URIS` is absent, the current implementation defaults to only `mapable://auth/callback`.

In non-production environments only, mobile token signing can fall back to the existing NextAuth secret so local development can start without an additional secret. Production fails closed when `MOBILE_AUTH_SECRET` is missing.

## Security boundary and current limitations

This is a controlled integration slice, not a finished production mobile identity system.

- Native credentials are never posted directly to the mobile app.
- The authorization flow uses PKCE S256 and `state` checking.
- Redirect URIs are exact-match allowlisted.
- Authorization codes expire after two minutes.
- Access tokens expire after 15 minutes and carry only three mobile scopes.
- A supplied but invalid Bearer header never falls back to a web cookie session.
- The native app currently keeps the access token and PKCE transaction **in memory only**. Restarting the app signs the user out.
- There is not yet a refresh-token, token-revocation or device-session registry.
- Authorization codes are signed/stateless rather than persisted as one-time database records. PKCE protects code interception, but production hardening should add one-time code/session persistence and revocation before long-lived native sessions are introduced.
- Expo web does not run the native custom-scheme account-link flow; it shows an explicit native-only state.

## Verification

The repository includes `apps/web/tests/mobile-auth-token.test.ts`, covering:

- successful PKCE exchange;
- rejection of the wrong verifier;
- redirect-URI binding;
- access-scope enforcement;
- tamper rejection.

The mobile/web CI workflow also type-checks the Expo application and verifies the cross-app contract anchors.

## Next slices

Recommended sequence after this boundary is stable:

1. persist/revoke native device sessions securely and add refresh-token rotation;
2. consent receipts and purpose-specific sharing controls;
3. saved place/journey preferences;
4. participant calendar/bookings;
5. transport booking and trip state;
6. offline-safe drafts for the workflows already permitted by the mobile architecture;
7. Indy proposals that use platform data while retaining deterministic permission checks and explicit approval for consequential actions.
