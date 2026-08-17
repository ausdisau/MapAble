import { engagementConfig } from "@/lib/config/engagement";

/** Add business days (Mon–Fri) to a date. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return result;
}

export function acknowledgementDueAt(receivedAt: Date = new Date()): Date {
  return addBusinessDays(
    receivedAt,
    engagementConfig.acknowledgementBusinessDays
  );
}
