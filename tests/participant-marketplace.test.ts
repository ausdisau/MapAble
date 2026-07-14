import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/participant-marketplace", () => ({
  participantMarketplaceConfig: {
    enabled: true,
    comparisonEnabled: true,
    supportCoordinationEnabled: false,
    serviceAgreementsEnabled: false,
    messagingEnabled: false,
    sponsoredRankingEnabled: false,
    automaticProviderSelectionEnabled: false,
    automaticAgreementAcceptanceEnabled: false,
  },
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantGoal: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    participantHiddenProvider: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    participantProviderShortlist: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    organisation: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import {
  compareProviderEvidence,
  createParticipantGoal,
  discoverProviders,
} from "@/lib/marketplace/participant-marketplace-service";
import { prisma } from "@/lib/prisma";

describe("participant marketplace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves participant wording when creating a goal", async () => {
    vi.mocked(prisma.participantGoal.create).mockResolvedValue({
      id: "goal-1",
      participantLanguage: "I want to join my local art group.",
    } as never);
    const goal = await createParticipantGoal({
      participantId: "participant-1",
      title: "Join art group",
      description: "I want support to attend.",
      category: "community",
      participantLanguage: "I want to join my local art group.",
    });
    expect(goal.participantLanguage).toBe(
      "I want to join my local art group.",
    );
  });

  it("excludes hidden providers before discovery results are returned", async () => {
    vi.mocked(prisma.participantHiddenProvider.findMany).mockResolvedValue([
      { providerOrgId: "hidden-org" },
    ] as never);
    vi.mocked(prisma.organisation.findMany).mockResolvedValue([]);
    await discoverProviders({ participantId: "participant-1" });
    expect(prisma.organisation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { notIn: ["hidden-org"] },
        }),
      }),
    );
  });

  it("compares evidence without a universal or sponsored score", async () => {
    vi.mocked(prisma.participantHiddenProvider.findMany).mockResolvedValue([]);
    vi.mocked(prisma.organisation.findMany).mockResolvedValue([
      {
        id: "org-1",
        name: "Provider",
        serviceOfferings: [],
        providerCapabilityEvidence: [],
        capacityBlocks: [],
      },
    ] as never);
    const providers = await discoverProviders({ participantId: "participant-1" });
    const comparison = compareProviderEvidence(providers);
    expect(comparison[0]?.eligibility).toBe("missing_information");
    expect(comparison[0]).not.toHaveProperty("score");
    expect(comparison[0]?.sponsored).toBe(false);
  });
});
