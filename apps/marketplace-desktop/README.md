# MapAble Marketplace Desktop — closed alpha

A thin Electron 45/TypeScript desktop shell loading the **same Next.js web closed-alpha** as a browser. The Next.js server owns login and server-side tester allowlisting; the desktop does not implement identity or payment itself.

**Status: IN DEVELOPMENT. No signed installation packages, public downloads, external source imports, Stripe, order processing, NDIS claims, or production approval.**

## Dev run
1. Configure the web alpha following \`apps/web/docs/commerce/closed-alpha-web-desktop.md\`.
2. Start Next.js on 127.0.0.1 with your existing NextAuth test account.
3. \`cd apps/marketplace-desktop && npm install && npm run typecheck && npm run build\`
4. Set \`MAPABLE_DESKTOP_ALPHA_ORIGIN=http://127.0.0.1:3000\` locally and run \`npm run dev\`.
5. Login must stay on the same site; third-party OAuth or web resources are intentionally blocked pending an independent allowlist/desktop security review. If your login needs them, use the browser alpha instead.

The renderer has \`nodeIntegration=false\`, \`contextIsolation=true\`, \`sandbox=true\`, \`webSecurity=true\`, no preload/IPC, denied browser permissions, denied new windows, and same-origin navigation. Specific billing/checkout paths are explicitly denied. It does **not** ship a local Next.js server; the app requires a reachable configured origin.

For preview HTTPS use \`MAPABLE_DESKTOP_ALPHA_ORIGIN=https://<reviewed-preview-origin>\` and the normal MapAble Core sign-in/allowlist. Never insert raw secrets in renderer environment variables. **Packaged execution is refused** unless separate explicit release approval and an exact reviewed HTTPS origin match are present; signing, code integrity, authenticator compatibility and distribution review are still required.

## Open beta
The desktop app uses the **same** server-governed, read-only catalogue adapter as web. Never fetch external suppliers from Electron and never expose API keys through desktop IPC. Beta source approval, provenance, licensing, stale-record handling and market-policy gates live in Next.js/MapAble Core.

## Security follow-ups
- Verify tested Chromium/Electron patched version before signing a build.
- Review OAuth identity on desktop, CSP, certificate errors, deep links, offline storage, OS secure credential storage, enterprise distribution, code signing and auto-update.
- Run keyboard/voice/assistive technology tests and a vulnerability scan against the packaged release.
- Do not mark an installer as safe or release it without an explicit security owner signoff.
