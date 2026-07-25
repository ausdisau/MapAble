import { afterEach, describe, expect, it } from "vitest";

import {
  clearPaceBudgetOverlays,
  seedPaceBudgetOverlay,
} from "@/lib/ndis/pace-endorsement-store";
import { evaluateQuarterlyBudgetPacing } from "@/lib/ndis/pace-period-tracker";

describe("evaluateQuarterlyBudgetPacing", () => {
  afterEach(() => {
    clearPaceBudgetOverlays();
  });

  it("allows booking when remaining balance is positive", () => {
    seedPaceBudgetOverlay({
      participantId: "p1",
      supportCategoryCode: "0001",
      expirationDate: "2026-12-31T00:00:00.000Z",
      remainingCategoryBudget: 8000,
      totalCategoryBudget: 20000,
      planStartDate: "2026-01-01T00:00:00.000Z",
      planEndDate: "2026-12-31T23:59:59.999Z",
      quarterlyAllocationAUD: 5000,
      quarterSpentAUD: 1200,
    });

    const result = evaluateQuarterlyBudgetPacing(
      "p1",
      "0001",
      new Date("2026-07-15T12:00:00.000Z")
    );
    expect(result.bookingAllowed).toBe(true);
    expect(result.remainingAUD).toBe(3800);
    expect(result.daysRemaining).toBeGreaterThan(0);
    expect(result.quarterLabel).toMatch(/^P\d+$|^Q\d+$/);
  });

  it("blocks booking and warns when allocation exhausted", () => {
    seedPaceBudgetOverlay({
      participantId: "p2",
      supportCategoryCode: "0001",
      expirationDate: "2026-12-31T00:00:00.000Z",
      remainingCategoryBudget: 0,
      totalCategoryBudget: 20000,
      quarterlyAllocationAUD: 1000,
      quarterSpentAUD: 1000,
    });

    const result = evaluateQuarterlyBudgetPacing("p2", "0001");
    expect(result.bookingAllowed).toBe(false);
    expect(result.remainingAUD).toBe(0);
    expect(result.warnings.some((w) => /exhausted/i.test(w))).toBe(true);
  });

  it("warns when burn exceeds safe daily threshold", () => {
    seedPaceBudgetOverlay({
      participantId: "p3",
      supportCategoryCode: "0001",
      expirationDate: "2026-12-31T00:00:00.000Z",
      remainingCategoryBudget: 100,
      totalCategoryBudget: 5000,
      quarterlyAllocationAUD: 900,
      // High spend early in quarter → high burn
      quarterSpentAUD: 800,
      planStartDate: "2026-01-01T00:00:00.000Z",
      planEndDate: "2026-12-31T23:59:59.999Z",
    });

    const result = evaluateQuarterlyBudgetPacing(
      "p3",
      "0001",
      new Date("2026-01-05T12:00:00.000Z")
    );
    expect(result.burnRatePerDayAUD).toBeGreaterThan(
      result.safeDailyThresholdAUD
    );
    expect(result.warnings.some((w) => /burn/i.test(w))).toBe(true);
  });
});
