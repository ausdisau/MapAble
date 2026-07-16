# Indoor accessibility — privacy and threat model

## Threats and mitigations

| Threat | Mitigation |
|--------|------------|
| Unauthorised publication | RBAC + publication state machine + audit events |
| IDOR on floor plans | Public APIs filter by `published` + `public`; restricted plans excluded |
| Restricted venue exposure | Zone type `restricted` filtered from partner/public DTOs |
| Malicious SVG | Render as image; no `dangerouslySetInnerHTML` on uploads |
| Malicious 3D assets | Feature flag off by default; validation scaffold; lazy load |
| Share token leakage | Opaque tokens; SHA-256 hash storage; expiry and revocation |
| Checkpoint forgery | HMAC-signed tokens; server-side resolution |
| Partner API credential theft | Hashed keys; scopes; rate limits (configured per client) |
| Webhook replay | Signed payloads with timestamp (scaffold in `partner/api-auth.ts`) |
| Evidence photo metadata | Strip EXIF on public images (existing media pipeline) |
| Cross-venue permission escalation | Venue-scoped permission checks |
| Stale offline data | Downloaded/expiry labels in offline UI |
| Profile leakage | Preferences not in URLs/analytics; visit plans use selective scopes |
| Analytics leakage | No preference values in analytics events |
| Moderation abuse | Rate limits; proposals not direct edits |
| Scraping | Partner rate limits; no bulk unrestricted downloads |

## Personal data

- Functional preferences only — no diagnosis fields.
- Visit plan sharing is opt-in per field scope.
- Checkpoint scans do not build movement histories.
