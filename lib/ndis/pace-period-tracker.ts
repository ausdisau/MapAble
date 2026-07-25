import {
  defaultPaceBudgetOverlay,
  getPaceBudgetOverlay,
} from "@/lib/ndis/pace-endorsement-store";

export type QuarterlyPacingResult = {
  participantId: string;
  categoryCode: string;
  quarterLabel: string;
  periodStart: string;
  periodEnd: string;
  daysRemaining: number;
  daysElapsed: number;
  quarterlyAllocationAUD: number;
  quarterSpentAUD: number;
  remainingAUD: number;
  burnRatePerDayAUD: number;
  safeDailyThresholdAUD: number;
  bookingAllowed: boolean;
  warnings: string[];
};

function calendarQuarterBounds(at: Date): { start: Date; end: Date; label: string } {
  const year = at.getUTCFullYear();
  const q = Math.floor(at.getUTCMonth() / 3);
  const start = new Date(Date.UTC(year, q * 3, 1));
  const end = new Date(Date.UTC(year, q * 3 + 3, 0, 23, 59, 59, 999));
  return { start, end, label: `Q${q + 1}` };
}

function ninetyDayWindowFromPlan(
  planStart: Date,
  planEnd: Date,
  at: Date
): { start: Date; end: Date; label: string } | null {
  if (at < planStart || at > planEnd) return null;
  const windowMs = 90 * 24 * 60 * 60 * 1000;
  let cursor = planStart.getTime();
  let index = 1;
  while (cursor <= planEnd.getTime()) {
    const start = new Date(cursor);
    const end = new Date(Math.min(cursor + windowMs - 1, planEnd.getTime()));
    if (at >= start && at <= end) {
      return { start, end, label: `P${index}` };
    }
    cursor += windowMs;
    index += 1;
  }
  return null;
}

/**
 * Evaluate quarterly / 90-day funding period pacing for a participant category.
 */
export function evaluateQuarterlyBudgetPacing(
  participantId: string,
  categoryCode: string,
  at: Date = new Date()
): QuarterlyPacingResult {
  const overlay =
    getPaceBudgetOverlay(participantId, categoryCode) ??
    defaultPaceBudgetOverlay(participantId, categoryCode);

  const planStart = overlay.planStartDate
    ? new Date(overlay.planStartDate)
    : null;
  const planEnd = overlay.planEndDate ? new Date(overlay.planEndDate) : null;

  const window =
    planStart &&
    planEnd &&
    Number.isFinite(planStart.getTime()) &&
    Number.isFinite(planEnd.getTime())
      ? ninetyDayWindowFromPlan(planStart, planEnd, at) ??
        calendarQuarterBounds(at)
      : calendarQuarterBounds(at);

  const allocation = overlay.quarterlyAllocationAUD ?? 5_000;
  const spent = overlay.quarterSpentAUD ?? 0;
  const remaining = Math.max(0, allocation - spent);

  const totalDays = Math.max(
    1,
    Math.ceil((window.end.getTime() - window.start.getTime()) / 86_400_000)
  );
  const daysElapsed = Math.max(
    1,
    Math.min(
      totalDays,
      Math.ceil((at.getTime() - window.start.getTime()) / 86_400_000)
    )
  );
  const daysRemaining = Math.max(
    0,
    Math.ceil((window.end.getTime() - at.getTime()) / 86_400_000)
  );

  const burnRatePerDayAUD = spent / daysElapsed;
  const safeDailyThresholdAUD = (allocation / 90) * 1.25;
  const projectedEndSpend = burnRatePerDayAUD * totalDays;

  const warnings: string[] = [];
  if (remaining <= 0) {
    warnings.push(
      "Current quarterly balance is exhausted — block new bookings to prevent premature drawdown."
    );
  }
  if (projectedEndSpend > allocation) {
    warnings.push(
      "Projected end-of-period spend exceeds quarterly allocation at current burn rate."
    );
  }
  if (burnRatePerDayAUD > safeDailyThresholdAUD) {
    warnings.push(
      "Daily burn exceeds safe pacing threshold (allocation/90 × 1.25)."
    );
  }

  return {
    participantId,
    categoryCode,
    quarterLabel: window.label,
    periodStart: window.start.toISOString(),
    periodEnd: window.end.toISOString(),
    daysRemaining,
    daysElapsed,
    quarterlyAllocationAUD: allocation,
    quarterSpentAUD: spent,
    remainingAUD: remaining,
    burnRatePerDayAUD: Math.round(burnRatePerDayAUD * 100) / 100,
    safeDailyThresholdAUD: Math.round(safeDailyThresholdAUD * 100) / 100,
    bookingAllowed: remaining > 0,
    warnings,
  };
}
