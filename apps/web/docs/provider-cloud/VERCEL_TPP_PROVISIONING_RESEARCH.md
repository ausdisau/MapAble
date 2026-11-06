# ProviderCloud domain provisioning: Vercel / TPP Wholesale
Status: proposed integration, investigated 6 November 2026; not deployed. The Phase A draft PR is only a default-disabled, non-persistent synthetic preview.

## Current MapAble state
Repository `ausdisau/MapAble` main was `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0` when inspected. Existing ProviderCloud workforce feature is default-off in `apps/web/lib/config/provider-workforce.ts`. Organisation membership, enterprise tenancy, audit and outbox primitives already exist. `apps/web/docs/careos-platform-gap-analysis.md` calls white-label tenancy foundational, not production ready. The current preview deliberately creates no new source-of-truth, migration or external API request.

## Read-only connected Vercel results
Team projects: `mapableau` (Create React App, project `prj_iAhQk0b6IhigXw58PFiYfiHSATmW`) and `mapableau-new` (Next.js, project `prj_EL1M4DxsXdPDUJpLeJ90zivUb3mf`). `mapable.com.au` is attached to `mapableau`; `mapable-beta.vercel.app` is attached to `mapableau-new`. Both reported verified project-domain associations. This does not verify public uptime, DNS/TLS readiness for ProviderCloud, a current production deployment, canonical `MapAble` repository linkage or residency. Do not reassign an existing production domain or change an existing project.

## Vercel
Vercel for Platforms supports one multi-tenant application serving provider websites with unique hostnames, as well as per-customer deployments if stronger isolation becomes necessary: https://vercel.com/for/platforms . The REST API supports project domain addition (published endpoint `POST /v10/projects/{idOrName}/domains`), project-domain verification, and DNS configuration reads (`GET /v6/domains/{domain}/config`). Confirm exact authentication, project/team, current request body and DNS response contract against https://vercel.com/docs/rest-api before implementing.

A domain's project verification is NOT proof of correct DNS routing, TLS/certificate readiness or tenant identity. Keep independent statuses for ownership, DNS, HTTPS, website publication and licence renewal. Obtain exact DNS records from the Vercel API and preserve existing MX/SPF/DKIM/DMARC, DNSSEC and CAA records. Wildcard subdomains require planned controlled-zone DNS/delegation. The platform domain `mapable.com.au` must not be casually delegated.

## TPP Wholesale
Current public API overview: https://www.tppwholesale.com.au/api/ . TPP advertises modern REST/JSON domain availability, registration, renewal/transfer, registrant/customer accounts, prices, orders and DNS management. The newer key/secret authentication exchanges credentials for an hour-long JWT at `POST /jwt/auth/token/`; tokens are tied to originating IP, requiring fixed egress. Publicly described endpoint examples include `GET /domains/{domain}/check-availability`, `GET /products/prices`, `POST /accounts`, `POST /order` and `GET /dns-records`. Treat endpoint semantics as tentative until the authenticated current OpenAPI reference and reseller terms are checked. Do not mix these with historical 2015 `auth.pl` session-ID flows (https://www.tppwholesale.com.au/api-legacy/).

A server-side worker with stable outbound IP, secure reseller credentials, bounded retries and external order reconciliation is mandatory before purchasing. Review Vercel Static IP eligibility, cost, region, and Australian fixed-egress alternatives. No browser TPP tokens, no duplicate charges when an order times out. The .au registrant must have the appropriate Australian eligibility, and the provider should be the lawful registrant rather than MapAble by default.

## Next-phase model and controls (NOT implemented)
- `ProviderDomainBinding`: one unique normalised hostname, organisation and tenant, mode, Vercel project ref, ownership/DNS/TLS/publication states, quarantine period.
- `ProviderDomainRegistration`: customer registrant, external registrar/order refs, expiry and renewal policy; separate from hosting.
- `ProviderDomainJob`: idempotency key, attempts, outbox and reconciliation.
- Existing MapAble billing and audit services own payment records and access evidence, not a new duplicate ledger.

Every new domain operation must derive the actor from the server session and require a real current provider-organisation membership and specific domain-management scope. Headers (`Host`, `x-mapable-tenant-id`) and payload organisation IDs are never grants of authority. Reject duplicate hostnames, dangling DNS takeover, unauthorised reassignment, unknown ownership, and unverified TLS. Require human approval for paid registration, DNS edits, release/transfer and public launch. Never expose private participant records through white-label site routing. Use privacy-minimised registrant/contact storage, complaints/abuse path and audit history.

## Accessibility and participant rights
WCAG 2.2 AA minimum, keyboard/switch/AAC and screen reader checks, 200%-400% zoom, accessible errors and status announcements, text alternatives to DNS diagrams, non-colour-only statuses, human-assisted completion and independent participant access to public provider pages. Never suggest NDIS provider status, worker screening, accessibility accreditation or clinical safety without current evidence.

## Delivery gates
A: synthetic-only default-OFF preview (this PR). B: approved persistent unique hostname ownership, scoped authorisation, Vercel read-only configuration and mock reconciler; then separately authorised BYOD pilot. C: authenticated TPP Swagger, sandbox/test credentials, fixed egress, account eligibility, pricing/GST and explicit paid order approval. D: renewals, monitoring and isolated enterprise deployments. No automatic merge, deploy, domain assignment, DNS change, registrar checkout, production migration or flag activation.