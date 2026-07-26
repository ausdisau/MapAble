# Human accessibility smoke script — public informational site

**Target:** WCAG 2.2 AA smoke (does not claim full conformance).  
**Scope:** Allowlisted informational routes only (see `lib/public/informational/routes.ts`).  
**Status:** All rows remain `NOT_RUN` until a human records evidence.  
**Do not** activate the first-party accessibility panel or AccessiBe as a condition of this script.

## Environments

| Surface                | URL / build                | Notes                             |
| ---------------------- | -------------------------- | --------------------------------- |
| Local production build | `pnpm build && pnpm start` | Local evidence only               |
| Production             | `https://mapable.com.au`   | Requires deployed remediation SHA |

## Script

For each allowlisted path (`/`, `/about`, `/contact`, `/privacy`, `/terms`, `/accessibility-statement`, `/guides`, `/resources`, `/help`, `/data-deletion`, plus programme explainers if included):

1. **Keyboard-only (Chrome or Firefox)** — Tab through skip link → landmarks → main links/forms; confirm visible focus; no trap.
2. **NVDA + Firefox or Chrome** — Announce page title, H1, landmarks; link purpose clear; form labels/errors announced on `/contact` if form enabled.
3. **VoiceOver + Safari** (where available) — Same checks as NVDA for title, H1, landmarks, links.
4. **Zoom** — 200% and 400%; content reflows; no horizontal scrolling of essential content; controls remain usable.
5. **Forced colours / high contrast** — Text and controls remain distinguishable.
6. **Reduced motion** — OS reduce-motion on; no essential information lost; decorative motion stops or is minimal.
7. **Switch / voice control** (where available) — Representative navigation to homepage CTA and one legal page.

## Evidence form (redacted)

Record: tester, date, commit SHA, URL, overallStatus (`NOT_RUN` | `INCOMPLETE` | `VERIFIED` | `PASS` | `FAILED` | `FAIL` | `BLOCKED` | `OWNER_ACTION_REQUIRED`), journeys with `evidenceRef` for any `VERIFIED`/`PASS`.  
Validate with: `pnpm audit:human-release-evidence -- --evidence ./artifacts/human-release-session.redacted.json`  
The validator is fail-closed: only explicit PASS/VERIFIED evidence exits 0; NOT_RUN/incomplete/blocked/failed never become VERIFIED.

## Status

| Check          | Status    |
| -------------- | --------- |
| Keyboard-only  | `NOT_RUN` |
| NVDA           | `NOT_RUN` |
| VoiceOver      | `NOT_RUN` |
| 200%/400% zoom | `NOT_RUN` |
| Forced colours | `NOT_RUN` |
| Reduced motion | `NOT_RUN` |
| Switch / voice | `NOT_RUN` |
