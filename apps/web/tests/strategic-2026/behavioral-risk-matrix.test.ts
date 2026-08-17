import { beforeEach, describe, expect, it, vi } from "vitest";

const findIncidents = vi.fn();
const findNotes = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    incidentReport: {
      findMany: (...args: unknown[]) => findIncidents(...args),
    },
    careProgressNote: {
      findMany: (...args: unknown[]) => findNotes(...args),
    },
  },
}));

import { calculateBehavioralRiskIndex } from "@/lib/ai/behavioral-risk-matrix";

describe("calculateBehavioralRiskIndex", () => {
  beforeEach(() => {
    findIncidents.mockReset();
    findNotes.mockReset();
  });

  it("returns stable advisory score with no signals", async () => {
    findIncidents.mockResolvedValue([]);
    findNotes.mockResolvedValue([]);

    const result = await calculateBehavioralRiskIndex("participant-1");
    expect(result.score).toBe(1);
    expect(result.band).toBe("stable");
    expect(result.authorityCeiling).toBe("ADVISORY_ONLY");
    expect(result.requiresHumanConfirmation).toBe(true);
    expect(result.actionTaken).toBe(false);
    expect(result.notice).toMatch(/never auto-escalates/i);
  });

  it("elevates score for immediate risk and critical language", async () => {
    findIncidents.mockResolvedValue([
      {
        id: "i1",
        severity: "high",
        description: "Immediate self-harm concern during shift",
        immediateRiskPresent: true,
        safeguardingConcern: true,
        createdAt: new Date(),
      },
      {
        id: "i2",
        severity: "medium",
        description: "Routine disruption",
        immediateRiskPresent: false,
        safeguardingConcern: false,
        createdAt: new Date(),
      },
      {
        id: "i3",
        severity: "medium",
        description: "Worker turnover noted",
        immediateRiskPresent: false,
        safeguardingConcern: false,
        createdAt: new Date(),
      },
    ]);
    findNotes.mockResolvedValue([
      { body: "Participant sensory overload meltdown", createdAt: new Date() },
    ]);

    const result = await calculateBehavioralRiskIndex("participant-1");
    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(["high", "critical"]).toContain(result.band);
    expect(result.drivers.length).toBeGreaterThan(0);
    expect(result.trend.length).toBeGreaterThan(0);
    expect(result.actionTaken).toBe(false);
  });
});
