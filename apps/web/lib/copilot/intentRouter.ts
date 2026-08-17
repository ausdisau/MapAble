import type { CopilotIntent, CopilotIntentType } from "@/lib/copilot/types";

const COMBINED_CARE =
  /\b(support\s*worker|care\s*worker|personal\s*care|support\s*at|help\s*me\s*at|attendant|shift)\b/i;
const COMBINED_TRANSPORT =
  /\b(transport|wheelchair\s*transport|ride|trip|pick\s*up|drop\s*off|driver|taxi|cab)\b/i;
const BILLING =
  /\b(invoice|claim|line\s*item|plan\s*manager|payment|receipt|billing|ndis\s*number\s*on\s*invoice)\b/i;
const INCIDENT =
  /\b(complaint|incident|unsafe|harm|abuse|neglect|exploitation|urgent|emergency|report\s*a\s*problem|sexual\s*misconduct)\b/i;
const JOBS =
  /\b(job|interview|employer|resume|cv|workplace|employment|work\s*experience)\b/i;
const NDIS =
  /\b(ndis|plan|budget|funding|support\s*category|core\s*supports|capacity\s*building)\b/i;
const TRANSPORT =
  /\b(transport|wheelchair|accessible\s*vehicle|driver|trip|pickup|dropoff|physio\s*transport)\b/i;
const SUPPORT =
  /\b(support\s*worker|care|shift|help\s*at\s*home|community\s*access|support\s*at)\b/i;
const PLACES =
  /\b(place|venue|accessible|map|location|find\s*near)\b/i;
const HEALTH =
  /\b(health|medication|allied\s*health|therapy|physio|hospital|gp)\b/i;
const PROVIDER_FINDER =
  /\b(find\s+(a\s+)?provider|provider\s*finder|registered\s*provider|ndis\s*registered|service\s*provider|care\s*provider|occupational\s*therap|\bot\b|speech\s*path|support\s*worker|allied\s*health|therapy\s*provider)\b/i;
const PROVIDER_FINDER_LOCATION =
  /\b(near\s+me|near\s+\w|in\s+[a-z]{3,}|around\s+\w|close\s+to)\b/i;

export type ClassifyIntentOptions = {
  context?: "provider_finder" | "default";
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Deterministic intent classification — no LLM calls.
 */
export function classifyIntent(
  query: string,
  mode?: string,
  options?: ClassifyIntentOptions,
): CopilotIntent {
  const q = normalizeQuery(query);
  const filters: Record<string, unknown> = { mode: mode ?? "All" };

  if (!q) {
    return {
      type: "unknown",
      confidence: 0,
      filters,
      reason: "Empty query",
    };
  }

  if (INCIDENT.test(q)) {
    return {
      type: "incident",
      confidence: 0.92,
      filters: { ...filters, safety: true },
      reason: "Matched incident or safeguarding keywords",
    };
  }

  if (BILLING.test(q)) {
    return {
      type: "billing",
      confidence: 0.9,
      filters: { ...filters, billing: true },
      reason: "Matched billing or invoice keywords",
    };
  }

  const hasCare = COMBINED_CARE.test(q) || SUPPORT.test(q);
  const hasTransport = COMBINED_TRANSPORT.test(q) || TRANSPORT.test(q);

  if (hasCare && hasTransport) {
    return {
      type: "combined",
      confidence: 0.95,
      filters: { ...filters, bundle: "care_transport" },
      reason: "Matched both care/support and transport keywords",
    };
  }

  if (mode === "Transport" || (hasTransport && !hasCare)) {
    return {
      type: "transport",
      confidence: 0.85,
      filters,
      reason: "Matched transport keywords or Transport mode",
    };
  }

  if (mode === "Support" || (hasCare && !hasTransport)) {
    return {
      type: "support",
      confidence: 0.85,
      filters,
      reason: "Matched support/care keywords or Support mode",
    };
  }

  if (JOBS.test(q) || mode === "Jobs") {
    return {
      type: "jobs",
      confidence: 0.88,
      filters,
      reason: "Matched employment keywords",
    };
  }

  const looksLikeProviderSearch =
    PROVIDER_FINDER.test(q) ||
    (PROVIDER_FINDER_LOCATION.test(q) &&
      /\b(provider|therapy|therap|worker|physio|ndis)\b/i.test(q));

  if (
    looksLikeProviderSearch &&
    !hasCare &&
    !hasTransport &&
    options?.context === "provider_finder"
  ) {
    return {
      type: "provider_finder",
      confidence: 0.9,
      filters: { ...filters, providerSearch: true },
      reason: "Matched provider directory search on Provider Finder",
    };
  }

  if (looksLikeProviderSearch && !hasCare && !hasTransport) {
    return {
      type: "provider_finder",
      confidence: 0.82,
      filters: { ...filters, providerSearch: true },
      reason: "Matched provider or therapy search keywords",
    };
  }

  if (NDIS.test(q) || mode === "NDIS") {
    return {
      type: "ndis",
      confidence: 0.88,
      filters,
      reason: "Matched NDIS plan or budget keywords",
    };
  }

  if (PLACES.test(q) || mode === "Places") {
    return {
      type: "places",
      confidence: 0.8,
      filters,
      reason: "Matched places or accessibility keywords",
    };
  }

  if (HEALTH.test(q)) {
    return {
      type: "health",
      confidence: 0.75,
      filters,
      reason: "Matched health-related keywords",
    };
  }

  if (hasTransport) {
    return {
      type: "transport",
      confidence: 0.7,
      filters,
      reason: "Partial transport keyword match",
    };
  }

  if (hasCare) {
    return {
      type: "support",
      confidence: 0.7,
      filters,
      reason: "Partial support keyword match",
    };
  }

  return {
    type: "unknown",
    confidence: 0.3,
    filters,
    reason: "No strong keyword match",
  };
}

export function intentLabel(type: CopilotIntentType): string {
  const labels: Record<CopilotIntentType, string> = {
    support: "Support",
    transport: "Transport",
    combined: "Care + transport",
    jobs: "Jobs",
    places: "Places",
    provider_finder: "Find providers",
    ndis: "NDIS plan",
    billing: "Billing",
    incident: "Safety",
    health: "Health",
    unknown: "General",
  };
  return labels[type];
}
