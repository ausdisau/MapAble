import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pricingRule: {
      findMany: vi.fn(),
    },
    pricingPolicyVersion: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { validateChargeLinesAgainstPolicy } from "@/lib/billing/policy/validate";
import { prisma } from "@/lib/prisma";
import type { ChargeLineInput } from "@/types/billing";

describe("pricing policy validation", () => {
  beforeEach(() => {
    vi.mocked(prisma.pricingRule.findMany).mockReset();
  });

  it("flags missing verified policy as POLICY_REVIEW_REQUIRED", async () => {
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([]);

    const lines: ChargeLineInput[] = [
      {
        description: "Direct support",
        supportItemCode: "01_011_0107_1_1",
        unit: "hour",
        quantity: 2,
        unitRateCents: 999999,
        gstApplicable: false,
        lineType: "direct_support",
      },
    ];

    const result = await validateChargeLinesAgainstPolicy({
      lines,
      asOf: new Date("2026-07-01T00:00:00.000Z"),
    });

    expect(result.status).toBe("POLICY_REVIEW_REQUIRED");
    expect(result.ok).toBe(false);
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it("flags rate above verified cap", async () => {
    vi.mocked(prisma.pricingRule.findMany).mockResolvedValue([
      {
        id: "rule1",
        policyVersionId: "pv1",
        supportItemNumber: "01_011_0107_1_1",
        supportItemName: "Assistance",
        priceCapCents: 6500,
        unit: "hour",
        status: "active",
        supportCategory: null,
        registrationGroup: null,
        weekdayOrTimeBand: null,
        remoteLoading: null,
        providerType: null,
        gstTreatment: "input_taxed",
        cancellationRules: null,
        travelRules: null,
        nonLabourRules: null,
        requiredEvidence: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        policyVersion: {
          id: "pv1",
          status: "active",
          effectiveFrom: new Date("2026-01-01"),
          effectiveTo: null,
          policy: { organisationId: null, jurisdiction: "AU" },
        },
      },
    ] as never);

    const result = await validateChargeLinesAgainstPolicy({
      lines: [
        {
          description: "Direct support",
          supportItemCode: "01_011_0107_1_1",
          unit: "hour",
          quantity: 1,
          unitRateCents: 9000,
          gstApplicable: false,
          lineType: "direct_support",
        },
      ],
    });

    expect(result.status).toBe("POLICY_REVIEW_REQUIRED");
    expect(result.capsExceeded).toBe(true);
  });
});
