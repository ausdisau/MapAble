# Passkeys

MapAble supports WebAuthn passkeys for passwordless sign-in.

## User flow

1. A signed-in user opens **Dashboard → Profile**.
2. The user selects **Add a passkey** and completes the browser/device prompt.
3. On the login page, the user selects **Login with passkey**, enters their
   email, and completes the browser/device prompt.

## Environment

Passkeys default to the app origin from `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, or
Vercel URL metadata. Override only when needed:

| Variable         | Description                                        |
| ---------------- | -------------------------------------------------- |
| `PASSKEY_ORIGIN` | Full origin, for example `https://mapable.com.au`. |
| `PASSKEY_RP_ID`  | Relying Party ID, usually `mapable.com.au`.        |

For production, the Authenticator RP ID must match the domain users see in the
browser. If users sign in at `mapable.com.au`, use that hostname.

## Storage

Passkey public credentials are stored in the `PasskeyCredential` table. Private
keys never leave the user's device or platform authenticator.
