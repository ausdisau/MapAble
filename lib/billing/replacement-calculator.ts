import {
  fromCents,
  multiplyCents,
  subtractCents,
  toCents,
  type Cents,
} from "@/lib/billing/money";

export type CalculateSupportSavingsInput = {
  replacedSupportHoursPerWeek: number;
  hourlyWorkerRateAUD: number;
  unitCostAUD: number;
};

export type ReplacementSupportCalculations = {
  weeklyHumanSupportCostAUD: number;
  annualHumanSupportCostAUD: number;
  paybackPeriodWeeks: number;
  net12MonthSavingsAUD: number;
  weeklyHumanSupportCostCents: Cents;
  annualHumanSupportCostCents: Cents;
  deviceUnitCostCents: Cents;
  net12MonthSavingsCents: Cents;
};

/**
 * Cost-benefit projection for a mainstream device as an NDIS Replacement Support.
 * Uses integer cents arithmetic to avoid floating-point drift.
 */
export function calculateSupportSavings(
  input: CalculateSupportSavingsInput
): ReplacementSupportCalculations {
  const {
    replacedSupportHoursPerWeek,
    hourlyWorkerRateAUD,
    unitCostAUD,
  } = input;

  if (
    !Number.isFinite(replacedSupportHoursPerWeek) ||
    replacedSupportHoursPerWeek <= 0
  ) {
    throw new Error("replacedSupportHoursPerWeek must be a positive finite number");
  }
  if (!Number.isFinite(hourlyWorkerRateAUD) || hourlyWorkerRateAUD <= 0) {
    throw new Error("hourlyWorkerRateAUD must be a positive finite number");
  }
  if (!Number.isFinite(unitCostAUD) || unitCostAUD <= 0) {
    throw new Error("unitCostAUD must be a positive finite number");
  }

  const hourlyRateCents = toCents(hourlyWorkerRateAUD);
  const deviceUnitCostCents = toCents(unitCostAUD);
  const weeklyHumanSupportCostCents = multiplyCents(
    hourlyRateCents,
    replacedSupportHoursPerWeek
  );
  const annualHumanSupportCostCents = multiplyCents(
    weeklyHumanSupportCostCents,
    52
  );
  const net12MonthSavingsCents = subtractCents(
    annualHumanSupportCostCents,
    deviceUnitCostCents
  );

  const paybackPeriodWeeks =
    weeklyHumanSupportCostCents === 0
      ? Number.POSITIVE_INFINITY
      : deviceUnitCostCents / weeklyHumanSupportCostCents;

  return {
    weeklyHumanSupportCostAUD: fromCents(weeklyHumanSupportCostCents),
    annualHumanSupportCostAUD: fromCents(annualHumanSupportCostCents),
    paybackPeriodWeeks,
    net12MonthSavingsAUD: fromCents(net12MonthSavingsCents),
    weeklyHumanSupportCostCents,
    annualHumanSupportCostCents,
    deviceUnitCostCents,
    net12MonthSavingsCents,
  };
}
