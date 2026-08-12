import { assertNavigatorCapability } from "@/lib/ai/navigator/gates";
import {
  providerCandidateSchema,
  type EvidenceStatus,
  type HardConstraintsInput,
  type ProviderCandidate,
} from "@/lib/ai/navigator/matching/types";
import { isNavigatorMatchingEnabled } from "@/lib/config/navigator-pilot";
import {
  searchNdisProviders,
  type NdisProviderSearchParams,
  type NdisProviderSearchRow,
} from "@/lib/ingestion/ndis-providers-search";

export const NDIS_PROVIDER_HARD_FILTER_TOOL = "ndis_provider_hard_filter" as const;

const STALE_AFTER_DAYS = 365;

/** Instruction-like patterns in untrusted listing text — strip / neutralise. */
const INSTRUCTION_LIKE =
  /\b(ignore\s+(all\s+)?(previous|prior)\s+instructions?|system\s*:|you\s+are\s+an?\s+ai|do\s+not\s+follow|jailbreak|tool\s*call|<\/?(?:script|system|tool)>)/gi;

export function sanitiseUntrustedListingText(value: string): string {
  return value
    .replace(INSTRUCTION_LIKE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

export function evidenceStatusFromUpdatedAt(
  updatedAt: Date,
  now: Date = new Date(),
): EvidenceStatus {
  const ageDays =
    (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (Number.isNaN(ageDays) || ageDays > STALE_AFTER_DAYS) {
    return "stale";
  }
  return "unknown";
}

export function mapNdisRowToProviderCandidate(
  row: NdisProviderSearchRow,
  now: Date = new Date(),
): ProviderCandidate {
  const updatedAt =
    row.updated_at instanceof Date
      ? row.updated_at
      : new Date(row.updated_at);
  return providerCandidateSchema.parse({
    id: row.source_id,
    name: sanitiseUntrustedListingText(row.provider_name || "Unknown provider"),
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    services: Array.isArray(row.services) ? row.services : [],
    registrationGroups: Array.isArray(row.registration_groups)
      ? row.registration_groups
      : [],
    updatedAt,
    evidenceStatus: evidenceStatusFromUpdatedAt(updatedAt, now),
    sponsored: false,
    relatedParty: false,
    conflictNotes: [],
  });
}

export type NdisProviderHardFilterInput = {
  tenantId: string;
  participantId: string;
  actorUserId: string;
  constraints: HardConstraintsInput;
  /** Free-text query minimised into search params. */
  q?: string;
  limit?: number;
  silent?: boolean;
  now?: Date;
};

export type NdisProviderHardFilterResult = {
  candidates: ProviderCandidate[];
  count: number;
};

/**
 * Allowlisted read-only tool: ndis_provider_hard_filter.
 * Caller must verify purpose consent before invoking.
 * Requires navigator gate + matching flag.
 */
export async function ndisProviderHardFilter(
  input: NdisProviderHardFilterInput,
): Promise<NdisProviderHardFilterResult> {
  if (!isNavigatorMatchingEnabled()) {
    throw new Error("NAVIGATOR_MATCHING_DISABLED");
  }

  const gate = await assertNavigatorCapability({
    capabilityKey: "navigator.provider_search.match",
    tenantId: input.tenantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    toolName: NDIS_PROVIDER_HARD_FILTER_TOOL,
    silent: input.silent,
  });
  if (!gate.allowed) {
    throw new Error(`NAVIGATOR_GATE_DENIED:${gate.reason}`);
  }

  const params: NdisProviderSearchParams = {
    q: input.q?.trim() || undefined,
    state: input.constraints.state,
    postcode: input.constraints.postcode,
    service: input.constraints.serviceType,
    limit: Math.min(Math.max(input.limit ?? 25, 1), 50),
  };

  const { providers } = await searchNdisProviders(params);
  const now = input.now ?? new Date();
  const candidates = providers.map((row) =>
    mapNdisRowToProviderCandidate(row, now),
  );

  return { candidates, count: candidates.length };
}
