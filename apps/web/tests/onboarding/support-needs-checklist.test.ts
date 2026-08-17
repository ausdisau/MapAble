import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueProfile = vi.fn();
const countConsent = vi.fn();
const countFunding = vi.fn();
const countSupportNeeds = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantProfile: {
      findUnique: (...args: unknown[]) => findUniqueProfile(...args),
    },
    consentRecord: {
      count: (...args: unknown[]) => countConsent(...args),
    },
    participantFundingSource: {
      count: (...args: unknown[]) => countFunding(...args),
    },
    iCanV6IntakeSubmission: {
      count: (...args: unknown[]) => countSupportNeeds(...args),
    },
  },
}));

vi.mock("@/lib/provider/verification/verification-case-service", () => ({
  isProviderEligibleForMatching: vi.fn(),
}));

import { evaluateParticipantOnboarding } from "@/lib/onboarding/onboarding-evaluator";

describe("evaluateParticipantOnboarding support_needs item", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueProfile.mockResolvedValue({ displayName: "Alex" });
    countConsent.mockResolvedValue(1);
    countFunding.mockResolvedValue(0);
  });

  it("marks support_needs incomplete without a lite/full submission", async () => {
    countSupportNeeds.mockResolvedValue(0);
    const evaluation = await evaluateParticipantOnboarding("user-1");
    const item = evaluation.checklist.find((i) => i.id === "support_needs");
    expect(item).toBeDefined();
    expect(item?.complete).toBe(false);
    expect(item?.blocker).toBe(false);
    expect(item?.href).toBe("/register/support-needs");
    // Incomplete optional item should not block ready-to-match.
    expect(evaluation.readyToMatch).toBe(true);
  });

  it("marks support_needs complete when a snapshot exists", async () => {
    countSupportNeeds.mockResolvedValue(1);
    const evaluation = await evaluateParticipantOnboarding("user-1");
    const item = evaluation.checklist.find((i) => i.id === "support_needs");
    expect(item?.complete).toBe(true);
    expect(item?.href).toBeUndefined();
  });
});
