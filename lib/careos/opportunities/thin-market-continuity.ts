import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import { prisma } from "@/lib/prisma";

export const CAPACITY_STATUSES = [
  "available",
  "limited",
  "unknown",
  "escalate",
] as const;

export type CapacityStatus = (typeof CAPACITY_STATUSES)[number];

function assertThinMarketEnabled() {
  if (!careosOpportunitiesConfig.thinMarketContinuityEnabled) {
    throw new Error("THIN_MARKET_CONTINUITY_DISABLED");
  }
  if (careosOpportunitiesConfig.participantScoringEnabled) {
    throw new Error("PARTICIPANT_SCORING_FORBIDDEN");
  }
}

function assertCapacityStatus(status: string): asserts status is CapacityStatus {
  if (!(CAPACITY_STATUSES as readonly string[]).includes(status)) {
    throw new Error("INVALID_CAPACITY_STATUS");
  }
}

/**
 * O7 — Thin-market continuity coordinator.
 * Capacity honesty only — never participant risk scores or automatic provider selection.
 */
export async function recordThinMarketSignal(input: {
  regionKey: string;
  serviceCategory: string;
  capacityStatus: CapacityStatus;
  notes?: string;
  createdById: string;
  tenantId?: string;
}) {
  assertThinMarketEnabled();
  assertCapacityStatus(input.capacityStatus);

  return prisma.thinMarketContinuitySignal.create({
    data: {
      regionKey: input.regionKey,
      serviceCategory: input.serviceCategory,
      capacityStatus: input.capacityStatus,
      notes: input.notes,
      createdById: input.createdById,
      tenantId: input.tenantId,
      requiresHumanConfirmation: true,
    },
  });
}

export async function confirmThinMarketSignal(input: {
  signalId: string;
  confirmedByUserId: string;
}) {
  assertThinMarketEnabled();
  return prisma.thinMarketContinuitySignal.update({
    where: { id: input.signalId },
    data: {
      confirmedAt: new Date(),
      confirmedByUserId: input.confirmedByUserId,
      requiresHumanConfirmation: false,
    },
  });
}

export async function listThinMarketSignals(filters: {
  regionKey?: string;
  serviceCategory?: string;
}) {
  assertThinMarketEnabled();
  return prisma.thinMarketContinuitySignal.findMany({
    where: {
      regionKey: filters.regionKey,
      serviceCategory: filters.serviceCategory,
    },
    orderBy: { observedAt: "desc" },
    take: 100,
  });
}

/**
 * Explain capacity for discovery UIs without ranking “best” providers.
 * Explicitly rejects matching-score style inputs.
 */
export function explainThinMarketCapacity(input: {
  capacityStatus: CapacityStatus;
  /** Rejected if provided — matching scores must not drive selection. */
  matchScore?: number;
  participantRiskScore?: number;
}) {
  assertThinMarketEnabled();
  if (input.matchScore !== undefined) {
    throw new Error("MATCH_SCORES_FORBIDDEN_IN_THIN_MARKET");
  }
  if (input.participantRiskScore !== undefined) {
    throw new Error("PARTICIPANT_RISK_SCORES_FORBIDDEN");
  }
  assertCapacityStatus(input.capacityStatus);

  const explanations: Record<CapacityStatus, string> = {
    available: "Capacity observations suggest availability; participant chooses.",
    limited: "Capacity appears limited; escalate to a human coordinator if needed.",
    unknown: "Capacity is unknown — unknown remains unknown.",
    escalate: "Human continuity recovery required; no automatic reassignment.",
  };

  return {
    capacityStatus: input.capacityStatus,
    explanation: explanations[input.capacityStatus],
    automaticProviderSelection: false,
    participantScore: null,
    humanConfirmationRequired: input.capacityStatus !== "available",
  };
}
