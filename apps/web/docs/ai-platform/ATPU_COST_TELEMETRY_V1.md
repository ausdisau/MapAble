# MapAble AI Gateway — ATPU token unit cost and measured usage v1

**Status:** Draft, read-only calculation contract; no production usage feed, billing feed, persistence or enforcement is enabled.

## Decision

Add a dated, **immutable pricing snapshot** beside the existing canonical AI gateway and a pure cost-estimation contract that consumes **server-observed provider usage counters**. The AI gateway's registry and kill switches remain the only model-call decision boundary. This module never changes a capability's permission, consent, clinical/safeguarding determination, model routing, or identity session.

Rate source: supplied MapAble AI Token Unit Cost Datasheet v1.0, published/listed direct-API rates **as documented on 2026-11-09**. Verify rates at each release; the snapshot is **planning-only**, not a contract or vendor invoice. See:
- Anthropic: https://platform.claude.com/docs/en/about-claude/pricing
- OpenAI: https://developers.openai.com/api/docs/pricing
- Google: https://ai.google.dev/gemini-api/docs/pricing
- AI SDK 6 usage shape: https://vercel.com/blog/ai-sdk-6

## Canonical integration

- \`apps/web/lib/ai/platform/models/gateway.ts\` resolves a model; it **does not** make a generation request or return usage.
- \`apps/web/lib/ai/platform/models/registry.ts\` currently includes \`google/gemini-3.5-flash\` and \`openai/gpt-oss-120b\`. The planning snapshot prices **only** \`google/gemini-3.5-flash\` in this allowlist. \`gpt-oss-120b\` is deliberately **UNPRICED** until a verified model-specific contract exists.
- \`apps/web/lib/ai/platform/telemetry/atpu-cost.ts\` is a pure **read-only estimator**; exports are discoverable from \`apps/web/lib/ai/platform/index.ts\`. There are **no** automatic writes, billing claims or calls to AI providers.
- Exported feature flag \`MAPABLE_ATPU_COST_TELEMETRY_ENABLED\` is **false by default** and does not activate or disable models. A live metering adapter is deliberately not hooked into production call sites in this PR.

## Data provenance: keep the three cost fields separate

| Field | Provenance | Meaning |
|---|---|---|
| \`estimatedUsd\` | measured input/output/cache tokens x static listed rate | **Estimated model spend**, plus explicitly metered tool fee when provided; incomplete tool fees not included |
| \`vendorReportedUsd\` | gateway/vendor billing API or server response metadata | **Provider reported**, distinct from our rate estimate |
| \`invoiceMatchedUsd\` | explicit finance reconciliation with opaque \`invoiceEvidenceRef\` | **Invoice reconciled only after human/billing validation outside this estimator** |

Never conflate an estimate with billed usage. When no measured events exist, amounts must be **null / NO MEASURED USAGE**, not US$0. Unpriced and missing-usage events must remain visible as exceptions.

**Data minimisation:** log event IDs, capability key, product area, actual reported model ID, token counts, billing mode and only opaque invoice references. Do **not** log prompts, outputs, retrieved text, email, phone, addresses, participant or worker IDs, NDIS identifiers, secrets, session IDs, support/clinical records or any plain-text demographics. Never accept browser- or model-supplied metering events as server evidence. Avoid stable user linkable metadata; ensure retention and APP 8/privacy review before external telemetry forwarding.

## Definitions

- **1 MTU** (MapAble Token Unit, proposal): 1,000 billable tokens in the selected vendor's unit definition. This is a management unit, not a vendor invoice unit.
- **1 ATPU** (Agentic Token Production Unit, proposal): 1 **completed** workflow execution confirmed independently by the deterministic workflow engine. A correlation ID alone **cannot** attest completion. \`summarizeAtpuCost(..., completedRunIds)\` returns \`completedAtpuRuns=null\` when completion evidence is absent.
- **Cost per completed ATPU:** total attributable billed/estimated cost divided by independently confirmed completed ATPUs; **never** compute a completion unit cost when there is no completion evidence. Failed/retried model calls may incur charges; allocate them to their parent workflow run without pretending they succeeded.

## Recommended execution sequence

1. **Observability-only pilot** (owner: platform engineering): instrument trusted server \`generateText\` / \`streamText\` completion hooks. Capture AI SDK 6 \`usage.inputTokens\`, \`usage.outputTokens\`, \`usage.inputTokenDetails.cacheReadTokens\` and \`cacheWriteTokens\` where provided; record the **actual resolved model ID**. If cache-write TTL or token subtotals are unknown, return an incomplete/unpriced state. Record individual model call/step IDs; aggregate across multi-step workflows without double counting.
2. **Reconciliation** (owner: finance): ingest vendor/gateway transaction usage and invoices through authorised access, validate invoice references and assign adjustments in a separate finance-reviewed, append-only ledger. Do not grant models invoice write access.
3. **Cost centre** (owner: finance and product): budget by product/capability/model; flag overspend, unpriced usage, missing tool charges, FX exposure, context tiers and per-unit expense. No AI ability to change budgets or spending thresholds.
4. **Controlled enforcement** (separate PR): deterministic cost caps and alerting after trustworthy measured usage/billing reconciliation exists. Hard safety, autonomy, consent, service continuity and human-review safeguards must override any purely cost-driven shutdown strategy; distinguish fallback and denial.

## Spreadsheet companion

\`MapAble_ATPU_Cost_Telemetry_v2.xlsx\`: thirteen worksheets, including **Gateway Map**, **Usage Intake**, **Measured Actuals**, **Telemetry Schema**, forecasting, and rate register. Its usage sheet is intentionally **blank** until approved real metadata is ingested. Forecast totals remain hypothetical. The spreadsheet's FX and operational allowances are planning assumptions, not a live exchange-rate feed or vendor charges. Do not import the synthetic QA fixture into the actuals sheet.

The workbook's rate list has **16 pricing tiers**. Pricing keys MUST match approved gateway mappings; avoid applying an arbitrary provider's list rate to a different billing provider or model contract. Provider invoice rates, gateway markup and caching/storage charges may differ; use vendor reconciliation for actuals.

## Engineering tests

- \`node --experimental-strip-types --test apps/web/tests/ai-platform/atpu-cost.contract.test.mjs\`
- Expected Wolfram reference example: Gemini 3.5 Flash input=1,250, cached read=250, output=200 -> 1,000 uncached input. USD \`(1000*1.5 + 250*0.15 + 200*9)/1e6 = 0.0033375\`. AUD at **illustrative** FX=1.45 -> \`0.004839375\`.
- Verify missing usage, invalid negative/overlapping caches, invalid price keys, batch without confirmation, malformed personal IDs, duplicate events, invoice evidence, no data distinction, and completed-workflow separation.

## Release gates and rollback

- **GO:** draft PR with pure computation and regression tests; review-only spreadsheet/CSV/JSON.
- **NO-GO:** live provider usage claim, production credential deployment, invoice update, DB migration, automatic model switching, identity/funding/NDIS/clinical/safeguarding authorisation or production automatic cost enforcement.
- Full TS typecheck, lint, monorepo tests and build are additional gates; contract tests alone are not proof of release readiness.
- Rollback: leave \`MAPABLE_ATPU_COST_TELEMETRY_ENABLED\` unset/false and revert the draft branch. No database data or external system modified.

Read-only seed sources: \`mapable-ai-token-rate-register.json\` and Excel v1.0 provided in this conversation; source timestamps are not independently refreshed in this release. Review signed vendor billing and provider routing contract before treating prices as payable rates.
