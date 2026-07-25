import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/strategic-2026", () => ({
  isPlatformShieldEnabled: () => true,
}));

const findUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

import { evaluateProviderComplianceShield } from "@/lib/compliance/platform-shield";

describe("evaluateProviderComplianceShield", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns FULLY_COVERED when all hard checks pass", async () => {
    findUnique.mockResolvedValue({
      id: "wp1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "verified",
      wwccStatus: "verified",
      firstAidStatus: "verified",
      insuranceStatus: "verified",
      updatedAt: new Date(),
      trustCredentials: [
        {
          status: "verified",
          expiresAt: new Date(Date.now() + 90 * 86400000),
        },
      ],
    });

    const result = await evaluateProviderComplianceShield("wp1");
    expect(result.activeShieldTier).toBe("FULLY_COVERED");
    expect(result.isShielded).toBe(true);
    expect(result.dispatchEligible).toBe(true);
    expect(result.blockingDeficits).toHaveLength(0);
    expect(result.notice).toMatch(/registered partner/i);
    expect(result.notice).not.toMatch(/MapAble is an NDIS-registered/i);
  });

  it("returns NON_COMPLIANT when NDISWC missing", async () => {
    findUnique.mockResolvedValue({
      id: "wp1",
      active: true,
      verificationStatus: "verified",
      workerScreeningStatus: "pending",
      wwccStatus: "verified",
      firstAidStatus: "verified",
      insuranceStatus: "verified",
      updatedAt: new Date(),
      trustCredentials: [{ status: "verified", expiresAt: null }],
    });

    const result = await evaluateProviderComplianceShield("wp1");
    expect(result.activeShieldTier).toBe("NON_COMPLIANT");
    expect(result.isShielded).toBe(false);
    expect(result.dispatchEligible).toBe(false);
    expect(result.blockingDeficits.some((d) => /NDISWC/i.test(d))).toBe(true);
    expect(result.deficitsHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("throws when worker missing", async () => {
    findUnique.mockResolvedValue(null);
    await expect(evaluateProviderComplianceShield("missing")).rejects.toThrow(
      "WORKER_NOT_FOUND"
    );
  });
});
