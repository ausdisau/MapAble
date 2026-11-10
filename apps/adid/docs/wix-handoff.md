# Wix Editor/Velo integration — external AD.iD identity handoff

**Verified Wix site (2026-11-10):** Australian Disability Ltd, https://www.ausdis.com.au/, Wix Editor, Velo enabled and Wix Members Area installed.

**Do not substitute a Clerk JWT for a Wix Members session** or pass Clerk tokens through URL parameters. Wix Member sessions are issued by Wix. The Wix Headless "bring your own identity provider" flow is documented for headless sites and cannot be assumed to work unchanged with this Editor installation. Custom OIDC support in Wix depends on site/product eligibility. Confirm the supported integration path with Wix before any native member federation.

## Stage 1: safe Wix navigation link
Add a clearly labelled **Sign in to AD.iD** button or menu item to the Wix site, pointing to the *verified deployment URL* of the AD.iD portal at `/sign-in`. This sign-in is separate from Wix Member login. Open it in the same window unless the user explicitly requests a new tab. Do not embed an untrusted sign-in form or iframe in Wix.

For a Velo page with an existing button #adidSignInButton, this conceptual example illustrates external navigation (review against current Velo docs and editor environment before using):

```js
import wixLocation from "wix-location";
$w.onReady(() => {
  $w("#adidSignInButton").onClick(() => {
    wixLocation.to("https://<approved-adid-host>/sign-in");
  });
});
```

**Replace the placeholder** only after the deploy host is verified; never launch with it.

## Stage 2: optional member linking (NOT IMPLEMENTED)
1. Audit Wix Members identifiers, their login status and any linked Bookings/Pricing Plans/Orders.
2. Implement approved linking from inside authenticated Wix and AD.iD sessions with independent proof of control of both accounts, CSRF prevention, short-lived one-use state, issuer-and-subject keys, audit and revocation.
3. Use only current supported Wix APIs and eligibility; do not create fake Wix sessions using AD.iD cookies/JWT.
4. Preserve Wix Members and Wix commerce entitlements independently.
5. Complete privacy, data residency and accessibility reviews before live linking.

Wix site's current content, members, domain and sessions are unchanged by this PR.
