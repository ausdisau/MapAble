export const careRecurringConfig = {
  /** Recurring Care schedules — default off for pilots. */
  enabled: process.env.MAPABLE_CARE_RECURRING_SCHEDULES_ENABLED === "true",
};

export function isCareRecurringSchedulesEnabled(): boolean {
  return careRecurringConfig.enabled;
}
