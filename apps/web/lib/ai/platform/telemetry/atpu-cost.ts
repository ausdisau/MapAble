/**
 * ATPU v1 cost estimator. Entirely read-only.
 * Gateway model authorization, consent, privacy, clinical decisions and
 * safeguarding remain in their existing deterministic, server-side services.
 * This module cannot authorize a model, mint a token, or write to a ledger.
 */
import rateSnapshot from "./data/mapable-ai-token-rate-register.json" with { type: "json" };

export type TokenUsage = Readonly<{
  inputTokens: number;           // total input, including cached categories
  cachedReadTokens: number;
  shortCacheWriteTokens: number;
  longCacheWriteTokens: number;
  outputTokens: number;
}>;
export type Source = "gateway_usage" | "provider_usage" | "synthetic_fixture";
export type BillingMode = "standard" | "batch_confirmed";
export type ServerMeteredEvent = Readonly<{
  eventId: string;              // server-minted, opaque; not an email or participant ID
  atpuRunId: string;            // server-minted, opaque workflow correlation ID
  capabilityKey: string;
  area: string;
  reportedModelId: string;      // model actually called, not suggested by an LLM
  source: Source;               // trusted adapter must set this on the server
  billingMode: BillingMode;
  usage: TokenUsage;
  toolFeeUsd?: number;          // separately metered; absence means unknown
  vendorReportedUsd?: number;   // vendor/gateway supplied, not an invoice
  invoiceMatchedUsd?: number;   // separately reviewed by finance
  invoiceEvidenceRef?: string;  // opaque, auditable finance record reference
}>;
export type CostResult = Readonly<{
  status: "estimated" | "unpriced" | "invalid_usage" | "excluded_fixture" | "tier_mismatch";
  eventId: string;
  atpuRunId: string;
  pricingKey: string | null;
  pricingSnapshot: string;
  estimatedUsd: number | null;  // estimate from observed tokens times dated list price
  observedUsd: number | null;   // never a list-price calculation
  evidence: "none" | "provider_reported" | "invoice_reconciled";
  reason: string;
}>;
type Tier = Readonly<{
  model_pricing_key: string;
  input_usd_per_1m_tokens: number;
  cached_read_usd_per_1m_tokens: number;
  short_cache_write_usd_per_1m_tokens: number | null;
  long_cache_write_usd_per_1m_tokens: number | null;
  output_usd_per_1m_tokens: number;
  batch_multiplier_if_eligible: number | null;
  minimum_input_tokens: number;
  maximum_input_tokens: number;
}>;

const RATES = Object.freeze(rateSnapshot.models.map((row) => Object.freeze(row))) as readonly Tier[];
const GATEWAY_MODEL_PRICE_KEYS: Readonly<Record<string, string | null>> = Object.freeze({
  "google/gemini-3.5-flash": "gemini-3.5-flash",
  "openai/gpt-oss-120b": null, // listed in gateway registry, no verified quote
});
const OPAQUE_ID = /^[a-zA-Z0-9_.:-]{1,120}$/;
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const money = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000;
const validId = (id: unknown): id is string =>
  typeof id === "string" && OPAQUE_ID.test(id) && !id.includes("@");
export const ATPU_RATE_SNAPSHOT_VERSION: string = rateSnapshot.version;

export function getAtpuRateMetadata() {
  return Object.freeze({
    version: rateSnapshot.version,
    status: "planning_only" as const,
    currency: "USD" as const,
    tierCount: RATES.length,
    sourceRows: RATES.length,
    scope: "published list prices, not billed actuals",
  });
}
export function isAtpuCostTelemetryEnabled(
  env: { MAPABLE_ATPU_COST_TELEMETRY_ENABLED?: string } = process.env,
): boolean {
  return env.MAPABLE_ATPU_COST_TELEMETRY_ENABLED === "true";
}

/** Only existing gateway registry model IDs are mapped; no model substitution. */
export function pricingKeyForGatewayModel(modelId: string): string | null {
  return Object.prototype.hasOwnProperty.call(GATEWAY_MODEL_PRICE_KEYS, modelId)
    ? GATEWAY_MODEL_PRICE_KEYS[modelId] : null;
}
function validEvent(e: ServerMeteredEvent): boolean {
  if (!e || !validId(e.eventId) || !validId(e.atpuRunId) ||
      !validId(e.capabilityKey) || !validId(e.area) ||
      typeof e.reportedModelId !== "string" || e.reportedModelId.length > 120 ||
      (e.source !== "gateway_usage" && e.source !== "provider_usage" && e.source !== "synthetic_fixture") ||
      (e.billingMode !== "standard" && e.billingMode !== "batch_confirmed")) return false;
  const u = e.usage;
  if (!u || ![u.inputTokens,u.cachedReadTokens,u.shortCacheWriteTokens,u.longCacheWriteTokens,u.outputTokens].every(integer)) return false;
  if (u.cachedReadTokens + u.shortCacheWriteTokens + u.longCacheWriteTokens > u.inputTokens) return false;
  if (e.billingMode === "batch_confirmed" &&
      (u.cachedReadTokens + u.shortCacheWriteTokens + u.longCacheWriteTokens) !== 0) return false;
  if ((e.toolFeeUsd !== undefined && !money(e.toolFeeUsd)) ||
      (e.vendorReportedUsd !== undefined && !money(e.vendorReportedUsd)) ||
      (e.invoiceMatchedUsd !== undefined && !money(e.invoiceMatchedUsd))) return false;
  if (e.invoiceMatchedUsd !== undefined && !validId(e.invoiceEvidenceRef)) return false;
  return true;
}
function result(e: ServerMeteredEvent, status: CostResult["status"],
  reason: string, pricingKey: string | null, estimatedUsd: number | null): CostResult {
  const validSource = e?.source === "gateway_usage" || e?.source === "provider_usage";
  const valid = validSource && status !== "invalid_usage" && status !== "excluded_fixture";
  const evidence: CostResult["evidence"] = !valid ? "none" :
    money(e.invoiceMatchedUsd) && validId(e.invoiceEvidenceRef) ? "invoice_reconciled" :
    money(e.vendorReportedUsd) ? "provider_reported" : "none";
  return Object.freeze({
    status, reason,
    eventId: e?.eventId ?? "invalid",
    atpuRunId: e?.atpuRunId ?? "invalid",
    pricingKey,
    pricingSnapshot: ATPU_RATE_SNAPSHOT_VERSION,
    estimatedUsd,
    observedUsd: evidence === "invoice_reconciled" ? e.invoiceMatchedUsd! :
      evidence === "provider_reported" ? e.vendorReportedUsd! : null,
    evidence,
  });
}
export function estimateAtpuEventCost(e: ServerMeteredEvent): CostResult {
  if (!validEvent(e)) return result(e, "invalid_usage", "invalid_or_incomplete_measurement", null, null);
  if (e.source === "synthetic_fixture")
    return result(e, "excluded_fixture", "fixture_never_actual_cost", null, null);
  const pricingKey = pricingKeyForGatewayModel(e.reportedModelId);
  if (!pricingKey) return result(e,"unpriced","no_allowlisted_pricing_key",null,null);
  const tier = RATES.find((row) => row.model_pricing_key === pricingKey);
  if (!tier) return result(e,"unpriced","no_rate_for_model",pricingKey,null);
  const u = e.usage;
  if (u.inputTokens < tier.minimum_input_tokens || u.inputTokens > tier.maximum_input_tokens)
    return result(e,"tier_mismatch","context_tier_not_valid",pricingKey,null);
  if ((u.shortCacheWriteTokens > 0 && tier.short_cache_write_usd_per_1m_tokens === null) ||
      (u.longCacheWriteTokens > 0 && tier.long_cache_write_usd_per_1m_tokens === null) ||
      (e.billingMode === "batch_confirmed" && tier.batch_multiplier_if_eligible === null))
    return result(e,"unpriced","billing_mode_or_cache_rate_missing",pricingKey,null);
  const uncached = u.inputTokens - u.cachedReadTokens -
    u.shortCacheWriteTokens - u.longCacheWriteTokens;
  const tokensUsd = (
    uncached * tier.input_usd_per_1m_tokens +
    u.cachedReadTokens * tier.cached_read_usd_per_1m_tokens +
    u.shortCacheWriteTokens * (tier.short_cache_write_usd_per_1m_tokens ?? 0) +
    u.longCacheWriteTokens * (tier.long_cache_write_usd_per_1m_tokens ?? 0) +
    u.outputTokens * tier.output_usd_per_1m_tokens
  ) / rateSnapshot.base_rate_denominator_tokens;
  const factor = e.billingMode === "batch_confirmed" ? tier.batch_multiplier_if_eligible! : 1;
  const estimatedUsd = tokensUsd * factor + (e.toolFeeUsd ?? 0);
  return result(e,"estimated","observed_token_counts_times_dated_list_rate",pricingKey,estimatedUsd);
}

export type AiSdkUsage = Readonly<{
  inputTokens?: number;
  outputTokens?: number;
  inputTokenDetails?: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
}>;
/**
 * For AFTER an authenticated server-side AI SDK generation, not the resolver.
 * Raw provider/gateway usage counters may omit cache details. Missing usage
 * must NOT be turned into a zero-cost event; callback owner should flag it.
 * An explicit cache-write TTL is required because vendor tiers differ.
 */
export function normalizeAiSdkUsage(
  raw: AiSdkUsage,
  cacheWriteTtl: "short" | "long" | "unknown" = "unknown",
): TokenUsage | null {
  const input = raw?.inputTokens, output = raw?.outputTokens;
  if (!integer(input) || !integer(output)) return null;
  const d = raw.inputTokenDetails;
  const read = d?.cacheReadTokens;
  const writes = d?.cacheWriteTokens;
  const noCache = d?.noCacheTokens;
  if (read !== undefined && !integer(read)) return null;
  if (writes !== undefined && !integer(writes)) return null;
  if (noCache !== undefined && !integer(noCache)) return null;
  // If provider omitted cache fields entirely, don't invent a no-cache claim.
  if (read === undefined && writes === undefined &&
      !(integer(noCache) && noCache === input)) return null;
  if ((writes ?? 0) > 0 && cacheWriteTtl === "unknown") return null;
  if ((read ?? 0) + (writes ?? 0) > input) return null;
  if (noCache !== undefined && noCache + (read ?? 0) + (writes ?? 0) !== input) return null;
  return {
    inputTokens: input,
    cachedReadTokens: read ?? 0,
    shortCacheWriteTokens: cacheWriteTtl === "short" ? (writes ?? 0) : 0,
    longCacheWriteTokens: cacheWriteTtl === "long" ? (writes ?? 0) : 0,
    outputTokens: output,
  };
}
/**
 * Cost telemetry counts distinct calls and distinct run correlation IDs.
 * "Completed ATPUs" needs confirmed workflow state from the deterministic
 * orchestrator; model usage alone cannot assert task completion.
 */
export function summarizeAtpuCost(
  events: readonly ServerMeteredEvent[],
  completedRunIds?: readonly string[],
) {
  const eventIds = new Set<string>();
  const correlatedRuns = new Set<string>();
  const actualRunIds = new Set<string>();
  let estimatedUsd = 0, observedUsd = 0, invoiceUsd = 0;
  let estimatedCount = 0, observedCount = 0, invoiceCount = 0;
  let unpriced = 0, invalid = 0, fixtures = 0, duplicates = 0;
  for (const e of events) {
    if (eventIds.has(e.eventId)) { duplicates++; continue; }
    eventIds.add(e.eventId);
    const x = estimateAtpuEventCost(e);
    if (x.status === "excluded_fixture") { fixtures++; continue; }
    if (x.status === "invalid_usage") { invalid++; continue; }
    correlatedRuns.add(e.atpuRunId);
    if (x.estimatedUsd !== null) { estimatedUsd += x.estimatedUsd; estimatedCount++; }
    if (x.observedUsd !== null) { observedUsd += x.observedUsd; observedCount++; }
    if (x.evidence === "invoice_reconciled") { invoiceUsd += x.observedUsd!; invoiceCount++; }
    if (x.status === "unpriced" || x.status === "tier_mismatch") unpriced++;
  }
  if (completedRunIds) {
    for (const id of completedRunIds) {
      if (validId(id) && correlatedRuns.has(id)) actualRunIds.add(id);
    }
  }
  return Object.freeze({
    uniqueMeteredEvents: correlatedRuns.size ? eventIds.size - invalid - fixtures : 0,
    correlatedRuns: correlatedRuns.size,
    completedAtpuRuns: completedRunIds ? actualRunIds.size : null,
    pricedEstimateUsd: estimatedCount ? estimatedUsd : null,
    providerOrInvoiceReportedUsd: observedCount ? observedUsd : null,
    invoiceReconciledUsd: invoiceCount ? invoiceUsd : null,
    unpricedEvents: unpriced,
    invalidEvents: invalid,
    excludedFixtures: fixtures,
    duplicateEvents: duplicates,
  });
}
