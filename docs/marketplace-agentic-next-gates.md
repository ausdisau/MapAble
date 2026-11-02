# MapAble+ Marketplace next development gates — PR #10 / PR #14

**Snapshot:** 2 November 2026. **Status:** development contracts and synthetic evaluation only; NO real remote agent transport, Saleor connector, participant messaging, health-data exchange, commerce, claims or deployment. **Canonical repository:** ausdisau/MapAble.

## Outcome and evidence ledger

| Workstream | Evidence reviewed | Current status | Decision |
|---|---|---|---|
| Canonical main | SHA `43ce85df6b5b09a8577b60bf29042fbc1dc96fb0` as checked 2 Nov | Existing Core consent, authority and audit services; no integrated agentic commerce | Reuse existing Core; no parallel consent database |
| Marketplace PR #10 | Draft `ab4e2a0b7dc43d6142adb56e0962fa1cf08f63a6`, source `apps/web/packages/marketplace-inclusive/src/alpha-catalogue.ts` | Unmerged synthetic AT catalogue, basket and simulated operations | Keep as product/supplier/funding gate; do not automatically promote prices |
| Agentic Marketplace PR #14 | Draft agentic lab branch | Separate simulated agents and local participant shortlisting | Add compatibility *contract* only; no source import from PR #10 |
| Saleor | https://docs.saleor.io/quickstart/api and https://docs.saleor.io/api-usage/authentication | Product queries are public under configured store rules; checkout requires separate domain and authorisation | Contract/mock adapter now; connection requires accountable approval |
| A2A | https://a2a-protocol.org/latest/specification/ | Agent identities, task envelopes, task lifecycle and messaging are transport concepts | Do not mistake agent identity or task metadata for participant permission |
| MCP | https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization | OAuth-based authorisation for HTTP transport and resource/audience boundaries | Allowlist read-only capabilities; deny payment, clearance and disclosure |
| W3C | https://www.w3.org/WAI/WCAG22/ and https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | WCAG 2.2 AA requires keyboard access, useful status and reflow; device compatibility is additional | Automated DOM checks + disability-led manual verification |

## 1. PR reconciliation — separate branches until review

GitHub inspection found **zero exact overlapping file paths** between PRs #10 and #14 on 2 Nov 2026. That does not prove semantic compatibility.

- **PR #10 owns:** catalogue classification, AT item evidence, human product-safety escalation, illustrative price/stock, seller review, nonbinding quotes, simulated order/return/refund and explicit finance/PayCore boundaries.
- **PR #14 owns:** participant-controlled query preparation, agent message simulation, comparisons, optional worker handoff, independent consent/rights checks, evidence display, public-agent tool vocabulary.
- **Shared MapAble Core owns:** authenticated identity, provider/worker organisation relationships, participant authority and delegates, consent grants/withdrawal, audit and secure messaging. Neither PR defines a real authorisation system.
- **New `pr10-bridge.ts`:** adapter from the *draft PR #10 public TypeScript item shape* with synthetic-only evidence requirement. It preserves sample prices, source IDs, specialist requirements and NDIS funding unknown; `checkoutAllowed` is always false.
- **Integration precondition:** PR #10 merged after its own safety/finance review, catalogue contract checked against exact merged SHA, accountable human agreement to rebase/refactor PR #14, no silent integration into Workspace Router, no automatic payment activation.

**Conflict control:** avoid altering routes under `/marketplace/alpha`, old cart/billing APIs, or PR #10 files. Explicitly test products/rentals/reuse separately from real human care services. Items marked blocked/specialist in PR #10 may be described but cannot become automatically eligible for a purchase.

## 2. Saleor read-only catalogue connection evaluation

Saleor uses a headless GraphQL API at a store-specific `/graphql/` endpoint. Official quickstart documents public `products(first: ..., channel: ...)` and `variants` reads; it also separates public storefront calls from app-token administrative permissions.

**Delivered:** `saleor-public-query.ts` builds a typed public `products(first: 6, channel: $channel)` query. It validates channel slugs, parses an injected *mock* GraphQL response (strict fields and counts), and returns only names, product/variant IDs and observed-at provenance. Prices, product safety, seller verification, availability and NDIS funding are explicitly **not verified**. The query uses NO mutations, checkout IDs, inventory writes, app tokens or real HTTP transport. `SALEOR_PUBLIC_NETWORK_ENABLED=false`.

**Reasons for not connecting live yet:** an approved Saleor tenancy and channel, vendor identity contract, data residency and licence, egress/SSRF restrictions, endpoint allowlist, stale-data handling, throttling/timeout, independent AT safety/recall assessment, multiple-seller inventory policy, GST, refunds, merchant/consumer-law obligations and human finance approval are unresolved. Saleor channel prices may not equal a binding checkout amount; an AT product is not automatically NDIS-funded. Saleor is not a regulator of support workers.

**Future staging, NOT in this PR:** read-only outbound server adapter with a fixed audited HTTPS hostname/path, no client-supplied URLs, GraphQL operation allowlist, bounded pagination and response bytes, rate limit, caching and exact observedAt/supplier provenance. Obtain separate approval before using a credential or accepting vendor data; no Saleor token in a model, browser or log. Never use Saleor for a care booking authority decision.

## 3. Authenticated A2A/MCP boundary and human-approved consent receipts

### Intended request path (not deployed)

```text
Participant + accessible no-AI review
  -> MapAble Core authenticated session / tenant / authorised delegate
  -> Consent and purpose selection + revocable active grant in Core
  -> Human-approved consent receipt, recipient/audience, expiry
  -> Server checks current consent state, authority, agent trust registry
  -> A2A task envelope (task ID, nonce, tenant, audience, scope, expiry)
  -> Deny-by-default MCP tool allowlist
  -> Proposal/evidence returned for participant review; NO autonomous execution
  -> Minimal audit receipt + complaints, correction and withdrawal
```

**Delivered:** pure `a2a-mcp-boundary.ts` evaluator that requires a simulated server-resolved human identity, current-rechecked purpose/recipient-scoped consent grant, verified agent identity, same tenant, authenticated transport, replay check, scoped public-read tool, and short-lived task. It returns `DRY_RUN_READ_ONLY` for a fully consistent synthetic example; **`executionAllowed` is always false**. All external messaging, orders, payment, private screening queries, sensitive data and funding decisions are held.

**Critical distinction:** existing `apps/web/lib/consent/consent-receipt-service.ts` creates an audit receipt. A prior `granted` receipt alone does NOT prove a current unrevoked consent grant. Before *any future live request*, server code must use actual session identification, `checkConsent`/`requireConsent`, `hasParticipantAuthority`, fresh grant/expiry/withdrawal lookups, and `createAuditEvent` or an approved audit service; never accept the evaluator's typed "trusted" context from a browser, provider payload, or LLM. Build atomic nonce replay tracking and key rotation in a persisted server store. Current client-side simulation has NONE of those production controls.

**Hard blocks:** private worker clearance status (only authorised official portal), participant records without consent, agent self-approval, untrusted instructions in provider messages, alternative recipients, different tenants, late/duplicate requests, spending money or booking shifts, supported decision-making misrepresented as substitute authority.

For future real A2A, use the current published specification to validate identity, agent cards and task lifecycle, but treat all cards/messages as untrusted until trust registry and legal purpose have been checked. For MCP follow latest 2026-07-28 OAuth guidance (token audience/resource, scopes, issuer) under an authenticated server gateway. Agent transport authentication is not a substitute for participant consent.

## 4. Accessibility verification — synthetic automated checks and pending human work

Automated browser-DOM tests are **preflight only**, not WCAG conformance. CI will verify labels, named controls, an announced outcome, button-only comparison/shortlisting/withdrawal and a keyboard path. No measured mobile layout conformance is established.

| Gate | Method and acceptance | Current status |
|---|---|---|
| Keyboard | Tab/Shift+Tab, Enter/Space, visible focus, logical order; all user decisions possible | Automated DOM path only; manual keyboard outstanding |
| WCAG 2.2 AA reflow | At 320 CSS px and 400% zoom no two-dimensional scroll, clipped text or action loss | Manual/browser viewport pending |
| Screen readers | NVDA/JAWS on Windows, VoiceOver on iOS/Safari, TalkBack on Android; role/state/feedback read correctly | Pending manual test |
| AAC/speech | Compatible with AAC keyboard injection, speech recognition, long response intervals; editable response/preferred format | Pending participant-led test |
| Switch / physical access | No gesture-only or precise small targets; switch scanning, dwell and repeat control workable | Pending device test |
| Contrast/motion | WCAG non-text contrast, 44px target design goal, no colour-only state, reduced motion | Design-only; verify visually |
| Consent/withdraw | Comprehensible consequence, reversibility, no forced time limit, separate worker/provider disclosure | Synthetic unit/UI coverage; real human review pending |
| Interrupted sessions | No silent disclosure/retry, deliberate resume/timeout, recover safely | Current in-memory state resets on reload; design requirement for any real service |
| No-AI/human help | Equivalent ordinary provider search and accessible human complaint route | Product integration/human service model pending |

**Do not collect real participant, health, worker or financial data** in these tests. Include people with physical and communication disabilities as paid/recruited testers and capture methodology, consent and remediation. Do not turn scripted CI into "tested with disabled participants."

## 5. Gate matrix and required approvals

| Gate | Exit evidence | Accountable human decision |
|---|---|---|
| G1 Reconciliation | PR #10 exact merged SHA, fresh contract comparison, documented safety/finance owner | MapAble engineering + product owner |
| G2 Saleor | Real partner contract, approved read-only staging tenancy, security/egress validation, currency and product data mapping | Commerce owner + privacy/security |
| G3 A2A/MCP | MapAble Core authorisation enforced server-side, replay/idempotency database, OAuth audience, revocation, audit, independent pen test | Identity/security and participant-rights reviewer |
| G4 Accessibility | WCAG 2.2 AA audit, disabled-person co-design, keyboard/TalkBack/VoiceOver/AAC/switch evidence and remediation log | Accessibility lead + participant representatives |
| G5 Commerce | Verified supplier, recall/product safety, merchant liability, NDIS financial advice limits, PayCore replay and Stripe mode remediation | Finance/legal/NDIS safeguards |
| G6 Release | Green CI, synthetic preview SHA, rollout/rollback, operations readiness and explicit human go decision | Release owner |

**Decision:** implement gate tests and contract under draft PR #14, **hold public beta, real Saleor and real agent-to-agent transport**. PR #10 remains unmodified. No deployment, endpoint, credential, payment or provider enquiry is activated.

## Evidence limitations

Current code and PR snapshots are more authoritative than previous strategy docs; these branches can change. Public Saleor/A2A/MCP/WCAG documents are specification references, not assurances that MapAble has implemented them. No formal accessibility, privacy impact or legal compliance determination has been completed. Recheck on the actual deployed SHA before any release.
