# OAuth sign-in

MapAble uses [NextAuth.js](https://next-auth.js.org/) with optional OAuth providers. Email/password (`credentials`) always remains available.

## Enable providers

Set env vars (see `.env.example`). Facebook and Auth0 buttons render when their provider is configured. Google and Microsoft are public-facing entry points on `/login` and `/register`; successful sign-in still requires the matching server-side client id and secret to be configured.

| Provider  | Env vars                                                                                                                    | Callback URL                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Auth0     | `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL` or `AUTH0_ISSUER`                                         | `{NEXTAUTH_URL}/api/auth/callback/auth0`    |
| Google    | `GOOGLE_CLIENT_ID`, `GOOGLE_ID`, or `AUTH_GOOGLE_ID`, plus `GOOGLE_CLIENT_SECRET`, `GOOGLE_SECRET`, or `AUTH_GOOGLE_SECRET` | `{NEXTAUTH_URL}/api/auth/callback/google`   |
| Facebook  | `FACEBOOK_CLIENT_ID` or `FACEBOOK_APP_ID`, plus `FACEBOOK_CLIENT_SECRET` or `FACEBOOK_APP_SECRET`                           | `{NEXTAUTH_URL}/api/auth/callback/facebook` |
| Microsoft | `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, optional `AZURE_AD_TENANT_ID`                                               | `{NEXTAUTH_URL}/api/auth/callback/azure-ad` |

Use the same `NEXTAUTH_URL` as production (e.g. `https://your-app.vercel.app`).

### Auth0

- In Auth0, create a **Regular Web Application** and add `{NEXTAUTH_URL}/api/auth/callback/auth0` to **Allowed Callback URLs**.
- Add `{NEXTAUTH_URL}` to **Allowed Logout URLs** and **Allowed Web Origins** if you use Auth0-hosted logout or embedded flows later.
- Enable Google and/or Facebook under Auth0 **Authentication → Social**, then enable those connections for the MapAble application.
- Set `AUTH0_ISSUER_BASE_URL` to the tenant origin, for example `https://your-tenant.au.auth0.com` (no path).

### Microsoft tenant

- `AZURE_AD_TENANT_ID=common` — work, school, and personal Microsoft accounts (default).
- Set to your Entra tenant GUID to restrict to a single organisation.

## Behaviour

- First OAuth sign-in **creates** a `participant` user (role assignment + participant/accessibility profiles), same as registration.
- Existing users are matched by **email** and signed in to that account.
- OAuth-only users get a random `passwordHash`; they can set a password later via **Forgot password** if they want email login too.

### Facebook

- In [Meta for Developers](https://developers.facebook.com/), enable **Facebook Login** on the app and add the callback URL above under **Valid OAuth Redirect URIs**.
- Request the **email** permission if you need account linking; sign-in is rejected when Facebook does not return an email address.

## Vercel

Add the same variables in the Vercel project → Settings → Environment Variables for Preview and Production.
