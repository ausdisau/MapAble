# MapAble Unified — Local Workspace Router

**Scope:** a development-only, localhost-bound, real process runner and accessible
landing page in the canonical ausdisau/MapAble repository. Not a production
MapAble participant portal, managed cloud process supervisor, or payment system.

## Files and dependency ownership

    tools/workspace-router/
      config.mjs          Fixed app commands, port/query limits, scrubbed logs
      server.mjs          Local API, child-process lifecycle, same-machine search
      index.html          Accessible landing page and app control surfaces
      styles.css          Self-hosted responsive theme
      app.js              Client status polling, safe DOM/text rendering
      server.test.mjs     Node test runner, security and behaviour checks
      README.md           This guide
    .github/workflows/workspace-router.yml
    package.json          dev:workspace and test:workspace scripts

No application dependencies are relocated. apps/web remains the pnpm/React 18
Next.js platform; apps/mobile remains the npm/React 19 Expo SDK 57 app.
The local developer tool is not a production web ecosystem component.

## Quick start

Requires Node.js 20+ (Replit currently declares Node 24), pnpm 10.12.1,
and an npm installation.

~~~sh
pnpm --dir apps/web install --frozen-lockfile
npm --prefix apps/mobile install
npm run dev:workspace
~~~

Open http://127.0.0.1:4317 on the SAME computer. The two UI buttons launch
exactly the following allowlisted root package scripts:

- Web: pnpm dev:web -> pnpm --dir apps/web dev
- Mobile: npm run dev:mobile -> npm --prefix apps/mobile start

The runner signals local process tree termination when Stop is selected.
Ctrl+C closes the router and signals its managed children to terminate.
It does not stop externally started processes and cannot detect all background
processes on the system. Port 3000 is used for Web HTTP readiness checking.

Optional: set MAPABLE_WORKSPACE_PORT to an integer from 1024 to 65535.
The listener always remains bound to 127.0.0.1.

## Real behaviour versus unverified claims

**Implemented in the draft:** an actual child-process launcher and stopper;
local process status and exit events; bounded, best-effort credential-redacted
terminal output; HTTP reachability check; text-only local API search against
GET /api/access/search; honest waiting, failure, empty and not-configured states.

**Not proven:** external production status; whether Metro has established an
authenticated tunnel; device connectivity; web database health; readiness of
other API routes; later source commits merged into the monorepo.

**Never performed:** payment, NDIS claim, clinical action, provider verification,
production deployment, network location lookup, secrets export, git subtree sync,
database migration or worker dispatch.

The local search is invoked only after a user enters text and selects Search.
Only the supplied q, limit=5 and sort=relevance parameters go to the locally
running web API. No GPS coordinates or device location are requested.
Returned results show name, suburb, category and provenance text when present;
the result status is never represented as universally verified.

## Security controls

- Local loopback-only listener plus exact Host check.
- Random per-session 256-bit header token protects ALL data APIs. Control writes
  additionally require same-origin Origin and application/json.
- No CORS allowances, third-party scripts, remote fonts, iframe maps or inline
  JavaScript. Restrictive Content Security Policy and cache-control no-store.
- Browser cannot submit an arbitrary shell command, arguments or working
  directory; only two known scripts are executed.
- Process output is bounded to 180 lines, truncated and scrubbed for common
  credential patterns. Browser rendering uses textContent, not innerHTML.
- On Windows, spawn fixed cmd.exe /c scripts and taskkill the process tree;
  on POSIX use detached process groups, SIGTERM and SIGKILL fallback.
- Treat unexpected process output as potentially sensitive even after
  best-effort redaction. Review logs before sharing screenshots.

**Do not** publish this router behind a proxy, cloud tunnel, Replit public
port, Vercel or Next.js API route. It is not designed for multi-user operations.

## Accessibility acceptance

Target WCAG 2.2 AA, with native inputs/buttons, minimum 44px controls,
text-labelled status, visible focus, single-column reflow and reduced-motion
support. Log announcements are intentionally off to avoid screen-reader spam.
A dedicated live region announces command outcomes and failures. Validate
keyboard-only navigation, screen readers, switch and AAC, 200–400% zoom,
text size, contrast, high-contrast mode and interrupted sessions with disabled
participants before broader use. Code checks alone do not certify accessibility.

## Tests

~~~sh
npm run test:workspace
node --check tools/workspace-router/config.mjs
node --check tools/workspace-router/server.mjs
node --check tools/workspace-router/app.js
npm run typecheck:mobile
npm run typecheck:web
~~~

The last two commands require the corresponding app dependencies; they are
separate application checks and not part of the small local-router CI job.

Negative tests include missing token, invalid Host and Origin, unsupported
command, invalid search query and unapproved log clearing. Human smoke tests
must cover real Windows/POSIX child process cleanup, HTTP readiness, local
API availability, network interruption and missing pnpm/npm.

## Migration and release caution

The canonical README and docs/repository-amalgamation.md document an
import from ausdisau/mapableau-new at e0a8b6907b25b23eda82fcbc3b722c088861b704.
The inspected unified main is b51cb9b73395769c46c3f64dd6094120bc2cedac,
committed 17 August 2026. Standalone development continued in October 2026.
Thus sync must be reconciled manually; a green local process does not establish
parity with current Marketplace, Care, Transport, Jobs or PayCore code.

This PR must remain draft until the owner reviews tests and the exact head SHA.
Do not merge, deploy, change secrets, run payment services or attempt to
auto-reconcile the two repositories without separately approved planning.
