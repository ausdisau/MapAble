# Cohesive session navigation slice

Base commit: `4b8e848d8dae958e925cc46a158ac3485988ec53` (`main`).

## Before / after journey

| Step | Before | After |
| --- | --- | --- |
| Browse public site | Always shows Log in / Get started | Session-aware account control; loading state while checking; signed-in shows My MapAble |
| Sign in | Full `/login` page with safe `callbackUrl` | Unchanged full-page flows; header CTAs pass the current local path/query |
| Return to task | Middleware + `safeAuthCallbackPath` | Same helpers, plus rejection of auth-form callback loops and `safeAuthCallbackFromLocation` |
| My MapAble | Dashboard shell with flat link grid + Sign out | Grouped navigation, shared account menu, Explore MapAble link |
| Sign out | Goes to `/login` | Clears MapAble client storage keys and returns to `/` |

Signed-in people can still browse the public homepage; there is no automatic homepage redirect.

## How session and role reach the UI

- Display: NextAuth `SessionProvider` + `useSession()` in `MapAbleUserBar` (client only on marketing pages, so personal data is not baked into publicly cached HTML).
- Dashboard shells may pass `userName` / `role` from `requireAuth()` as a hydration hint only.
- Authorisation: unchanged server guards (`requireAuth`, `requirePermission`, role layouts). The account menu is not an authorisation boundary.

## Overlap with related PRs

- Canonical #26 (participant contextual dashboard): complementary; this slice keeps deep links and does not replace the Hireup-inspired left sidebar experiment.
- Canonical #31 (MapAbleID read-only): no conflict; account menu links to existing profile/consent routes only.
- Canonical #38 (My Support preview): no conflict; discover links stay on existing finder routes.
- Legacy mapableau-new #710: patterns reviewed (account dialog, loading/signed-in states). Canonical adaptation avoids nested SignInForm duplication and keeps the full-page login route authoritative.
- Legacy #711 (Stripe marketplace): out of scope; untouched.

## Remaining review

- Manual screen-reader, AAC/switch and lived-experience review.
- Multi-tab sign-out observation on a protected preview with synthetic accounts.
- Vercel preview for this canonical branch once a non-production protected target is available.
