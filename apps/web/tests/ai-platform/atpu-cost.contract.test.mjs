import assert from "node:assert/strict";
import test from "node:test";

import {
  getAtpuRateMetadata,
  isAtpuCostTelemetryEnabled,
  estimateAtpuEventCost,
  normalizeAiSdkUsage,
  pricingKeyForGatewayModel,
  summarizeAtpuCost,
} from "../../lib/ai/platform/telemetry/atpu-cost.ts";

const base = {
  eventId: "event:20261109:1",
  atpuRunId: "run:atlas:1",
  area: "Access",
  capabilityKey: "search.nl_interpreter",
  reportedModelId: "google/gemini-3.5-flash",
  source: "gateway_usage",
  billingMode: "standard",
  usage: {
    inputTokens: 1250,
    cachedReadTokens: 250,
    shortCacheWriteTokens: 0,
    longCacheWriteTokens: 0,
    outputTokens: 200,
  },
};
test("rate snapshot is a read-only planning list, not billed actuals", () => {
  const meta = getAtpuRateMetadata();
  assert.equal(meta.version, "2026-11-09");
  assert.equal(meta.status, "planning_only");
  assert.equal(meta.tierCount, 16);
  assert.equal(meta.currency, "USD");
});
test("existing gateway model is explicitly mapped, gpt-oss unpriced", () => {
  assert.equal(pricingKeyForGatewayModel("google/gemini-3.5-flash"), "gemini-3.5-flash");
  assert.equal(pricingKeyForGatewayModel("openai/gpt-oss-120b"), null);
  assert.equal(pricingKeyForGatewayModel("anthropic/claude-haiku-5.5"), null);
});
test("Wolfram cross-checked mixed cache calculation is 0.0033375 USD", () => {
  const x = estimateAtpuEventCost(base);
  assert.equal(x.status, "estimated");
  assert.ok(Math.abs(x.estimatedUsd - 0.0033375) < 1e-14);
  assert.equal(x.observedUsd, null);
  assert.equal(x.evidence, "none");
});
test("unpriced gateway model is not silently repriced", () => {
  const x = estimateAtpuEventCost({ ...base, reportedModelId: "openai/gpt-oss-120b" });
  assert.equal(x.status, "unpriced");
  assert.equal(x.estimatedUsd, null);
});
test("missing counters never become a zero-cost event", () => {
  const x = estimateAtpuEventCost({ ...base, usage: { ...base.usage, inputTokens: undefined } });
  assert.equal(x.status, "invalid_usage");
  assert.equal(x.estimatedUsd, null);
});
test("cached categories cannot exceed input total", () => {
  const x = estimateAtpuEventCost({
    ...base, usage: { ...base.usage, cachedReadTokens: 1300 },
  });
  assert.equal(x.status, "invalid_usage");
});
test("batch mode with cache requires explicit vendor reconciliation", () => {
  const x = estimateAtpuEventCost({ ...base, billingMode: "batch_confirmed" });
  assert.equal(x.status, "invalid_usage");
});
test("synthetic fixtures cannot report real spend", () => {
  const x = estimateAtpuEventCost({ ...base, source: "synthetic_fixture", vendorReportedUsd: 25 });
  assert.equal(x.status, "excluded_fixture");
  assert.equal(x.observedUsd, null);
});
test("vendor charge is not invoice evidence", () => {
  const x = estimateAtpuEventCost({ ...base, vendorReportedUsd: 0.004 });
  assert.equal(x.evidence, "provider_reported");
  assert.equal(x.observedUsd, 0.004);
  assert.equal(x.estimatedUsd, 0.0033375);
});
test("invoice matched charge requires opaque finance evidence reference", () => {
  const invalid = estimateAtpuEventCost({ ...base, invoiceMatchedUsd: 0.004 });
  assert.equal(invalid.status, "invalid_usage");
  const x = estimateAtpuEventCost({
    ...base, vendorReportedUsd: 0.004, invoiceMatchedUsd: 0.0042,
    invoiceEvidenceRef: "invoice:verified:20261109",
  });
  assert.equal(x.evidence, "invoice_reconciled");
  assert.equal(x.observedUsd, 0.0042);
});
test("SDK normalisation requires complete counters and confirmed cache-write TTL", () => {
  const normalized = normalizeAiSdkUsage({
    inputTokens: 1250,
    outputTokens: 200,
    inputTokenDetails: { noCacheTokens: 1000, cacheReadTokens: 250 },
  });
  assert.deepEqual(normalized, base.usage);
  assert.equal(normalizeAiSdkUsage({inputTokens: 20,outputTokens: 1}), null);
  assert.equal(normalizeAiSdkUsage({
    inputTokens: 20, outputTokens: 1, inputTokenDetails: {
      noCacheTokens: 10, cacheWriteTokens: 10,
    },
  }), null);
});
test("dedupes events and only counts completed ATPUs with completion evidence", () => {
  const x = summarizeAtpuCost([base, base, {...base,eventId:"event:20261109:2"}]);
  assert.equal(x.duplicateEvents, 1);
  assert.equal(x.correlatedRuns, 1);
  assert.equal(x.completedAtpuRuns, null);
  const complete = summarizeAtpuCost([base],["run:atlas:1"]);
  assert.equal(complete.completedAtpuRuns, 1);
});
test("no measured usage is unknown, not zero dollars", () => {
  const x = summarizeAtpuCost([]);
  assert.equal(x.pricedEstimateUsd, null);
  assert.equal(x.providerOrInvoiceReportedUsd, null);
});
test("rejects personal IDs in telemetry", () => {
  const x = estimateAtpuEventCost({...base, eventId:"person@example.com"});
  assert.equal(x.status,"invalid_usage");
});
test("telemetry feature flag does not turn on model generation", () => {
  assert.equal(isAtpuCostTelemetryEnabled({}),false);
  assert.equal(isAtpuCostTelemetryEnabled({MAPABLE_ATPU_COST_TELEMETRY_ENABLED:"true"}),true);
});
