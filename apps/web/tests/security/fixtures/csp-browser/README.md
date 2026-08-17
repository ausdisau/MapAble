# CSP browser fixtures

Sanitised CSP violation reports captured from Playwright browsers against a
local synthetic page (`Content-Security-Policy-Report-Only` + blocked script).

## Provenance

| File                          | Engine   | Method                                                     | Status                                                                   |
| ----------------------------- | -------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `chromium-legacy.json`        | Chromium | `report-uri` POST intercept                                | captured                                                                 |
| `chromium-reporting-api.json` | Chromium | same violation fields remapped to Reporting API JSON shape | captured                                                                 |
| `firefox-legacy.json`         | Firefox  | `report-uri` POST intercept                                | captured                                                                 |
| WebKit                        | WebKit   | —                                                          | `NOT_RUN` (host missing WebKit system libs; see `capture-manifest.json`) |

Hosts were rewritten to `https://fixture.local`. User-agent detail is replaced
with `synthetic-browser` where present. No cookies, credentials, or external
browsing data are included.

Re-capture:

```bash
node scripts/security/capture-csp-browser-fixtures.mjs
```
