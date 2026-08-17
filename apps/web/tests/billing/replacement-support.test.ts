import { describe, expect, it } from "vitest";

import { calculateSupportSavings } from "@/lib/billing/replacement-calculator";
import {
  buildReplacementSupportEvidencePack,
  DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD,
  ReplacementSupportRequestSchema,
} from "@/lib/billing/replacement-support";

const validRequest = {
  participantId: "participant-demo-1",
  icanDomainDeficit: ["communication", "general_tasks_and_demands"] as const,
  proposedDevice: {
    name: "Apple Watch",
    model: "Series 10 GPS 46mm",
    unitCostAUD: 800,
  },
  replacedSupportHoursPerWeek: 5,
  hourlyWorkerRateAUD: DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD,
  justificationNotes:
    "Smartwatch fall detection and medication reminders reduce weekly support worker check-ins.",
};

describe("ReplacementSupportRequestSchema", () => {
  it("accepts a valid payload and applies default hourly rate when omitted", () => {
    const { hourlyWorkerRateAUD: _omit, ...withoutRate } = validRequest;
    const parsed = ReplacementSupportRequestSchema.safeParse(withoutRate);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.hourlyWorkerRateAUD).toBe(
      DEFAULT_NDIS_HOURLY_WORKER_RATE_AUD
    );
    expect(parsed.data.icanDomainDeficit).toEqual([
      "communication",
      "general_tasks_and_demands",
    ]);
  });

  it("rejects empty I-CAN domain deficit", () => {
    const parsed = ReplacementSupportRequestSchema.safeParse({
      ...validRequest,
      icanDomainDeficit: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects non-positive device unit cost", () => {
    const parsed = ReplacementSupportRequestSchema.safeParse({
      ...validRequest,
      proposedDevice: { ...validRequest.proposedDevice, unitCostAUD: 0 },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("calculateSupportSavings", () => {
  it("computes weekly, annual, payback, and net 12-month savings", () => {
    // 5h × $67.06 = $335.30/week; ×52 = $17,435.60/year; device $800
    const result = calculateSupportSavings({
      replacedSupportHoursPerWeek: 5,
      hourlyWorkerRateAUD: 67.06,
      unitCostAUD: 800,
    });

    expect(result.weeklyHumanSupportCostCents).toBe(33530);
    expect(result.weeklyHumanSupportCostAUD).toBe(335.3);
    expect(result.annualHumanSupportCostCents).toBe(33530 * 52);
    expect(result.annualHumanSupportCostAUD).toBe(17435.6);
    expect(result.deviceUnitCostCents).toBe(80000);
    expect(result.net12MonthSavingsCents).toBe(33530 * 52 - 80000);
    expect(result.net12MonthSavingsAUD).toBe(16635.6);
    expect(result.paybackPeriodWeeks).toBeCloseTo(80000 / 33530, 5);
  });
});

describe("buildReplacementSupportEvidencePack", () => {
  it("marks pack DRAFT_ONLY and includes cost-benefit plus justification", () => {
    const request = ReplacementSupportRequestSchema.parse(validRequest);
    const calculations = calculateSupportSavings({
      replacedSupportHoursPerWeek: request.replacedSupportHoursPerWeek,
      hourlyWorkerRateAUD: request.hourlyWorkerRateAUD,
      unitCostAUD: request.proposedDevice.unitCostAUD,
    });
    const pack = buildReplacementSupportEvidencePack({
      request,
      calculations,
    });

    expect(pack.authorityCeiling).toBe("DRAFT_ONLY");
    expect(pack.actionTaken).toBe(false);
    expect(pack.requiresHumanConfirmation).toBe(true);
    expect(pack.editable).toBe(true);
    expect(pack.framework).toBe("NDIS");
    expect(pack.supportCategory).toBe("replacement_supports");
    expect(pack.clinicalJustification.notes).toContain("Smartwatch");
    expect(pack.costBenefit.net12MonthSavingsAUD).toBe(
      calculations.net12MonthSavingsAUD
    );
    expect(pack.icanDomainLabels).toContain("Communication");
    expect(pack.prohibited).toContain("automatic_ndia_submission");
  });
});
