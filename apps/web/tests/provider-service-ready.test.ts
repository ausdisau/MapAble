import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/onboarding/onboarding-evaluator", () => ({
  evaluateProviderOnboarding: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      count: vi.fn(),
    },
  },
}));

import { evaluateProviderOnboarding } from "@/lib/onboarding/onboarding-evaluator";
import {
  assertProviderReadyToServe,
  evaluateProviderServiceReady,
  ProviderNotReadyError,
} from "@/lib/onboarding/provider-service-ready";
import { prisma } from "@/lib/prisma";

describe("provider service-ready gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks service-ready when onboarding and workers pass", async () => {
    vi.mocked(evaluateProviderOnboarding).mockResolvedValue({
      role: "provider",
      profileCompletenessScore: 100,
      readyToMatch: true,
      checklist: [
        { id: "profile", label: "Profile", complete: true, blocker: true },
      ],
    });
    vi.mocked(prisma.workerProfile.count).mockResolvedValue(2);

    const evaluation = await evaluateProviderServiceReady("org-1");

    expect(evaluation.serviceReady).toBe(true);
    expect(evaluation.checklist.some((item) => item.id === "verified_workers")).toBe(
      true
    );
  });

  it("blocks when no verified workers", async () => {
    vi.mocked(evaluateProviderOnboarding).mockResolvedValue({
      role: "provider",
      profileCompletenessScore: 100,
      readyToMatch: true,
      checklist: [
        { id: "profile", label: "Profile", complete: true, blocker: true },
      ],
    });
    vi.mocked(prisma.workerProfile.count).mockResolvedValue(0);

    const evaluation = await evaluateProviderServiceReady("org-1");

    expect(evaluation.serviceReady).toBe(false);
    expect(
      evaluation.checklist.find((item) => item.id === "verified_workers")?.complete
    ).toBe(false);
  });

  it("assertProviderReadyToServe throws ProviderNotReadyError with blockers", async () => {
    vi.mocked(evaluateProviderOnboarding).mockResolvedValue({
      role: "provider",
      profileCompletenessScore: 40,
      readyToMatch: false,
      checklist: [
        {
          id: "verification",
          label: "Verification approved",
          complete: false,
          blocker: true,
        },
      ],
    });
    vi.mocked(prisma.workerProfile.count).mockResolvedValue(0);

    await expect(assertProviderReadyToServe("org-1")).rejects.toBeInstanceOf(
      ProviderNotReadyError
    );

    try {
      await assertProviderReadyToServe("org-1");
    } catch (error) {
      expect(error).toBeInstanceOf(ProviderNotReadyError);
      if (error instanceof ProviderNotReadyError) {
        expect(error.code).toBe("PROVIDER_NOT_READY");
        expect(error.blockers.length).toBeGreaterThan(0);
      }
    }
  });
});
