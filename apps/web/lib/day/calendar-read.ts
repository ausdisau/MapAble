/**
 * Date and presentation boundaries for MapAble Day calendar *reads*.
 *
 * Only explicitly requested, self-owned CalendarEvent records are shown.
 * They are never treated as evidence that a worker/vehicle is verified,
 * a service has happened, or a booking has been confirmed.
 */
export const DAY_TIMEZONE = "Australia/Sydney" as const;
export const DAY_CALENDAR_EVENT_LIMIT = 50;

export type DayCalendarRecord = {
  id: string;
  title: string;
  category: string;
  startsAt: string;
  endsAt: string;
  evidenceStatus: "recorded_unverified";
};

export type CalendarEventLike = {
  id: string;
  title: string;
  eventType: string;
  startAt: Date;
  endAt: Date;
};

export type DayCalendarSelection = {
  day: string;
  from: Date;
  to: Date;
};

/** Always use explicit Sydney date parts (not runtime server/client timezone). */
export function formatSydneyDay(timestamp: Date): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: DAY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return [value("year"), value("month"), value("day")].join("-");
}

export function parseCalendarDay(
  submittedDay: string | null,
  now: Date = new Date(),
): DayCalendarSelection | null {
  if (!Number.isFinite(now.getTime())) return null;

  const today = formatSydneyDay(now);
  const day = submittedDay ?? today;
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)) return null;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;

  const midnight = new Date(Date.UTC(year, month - 1, date));
  // Strict date validation rejects e.g. 2026-02-30.
  if (
    midnight.getUTCFullYear() !== year ||
    midnight.getUTCMonth() !== month - 1 ||
    midnight.getUTCDate() !== date
  ) {
    return null;
  }

  const [todayYear, todayMonth, todayDate] = today.split("-").map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDate);
  const offset = Math.round((midnight.getTime() - todayUtc) / 86400000);
  if (offset < -7 || offset > 14) return null;

  // A padded UTC range safely includes Sydney start times on both sides
  // of daylight-saving transitions; the final results are date-filtered.
  return {
    day,
    from: new Date(Date.UTC(year, month - 1, date - 1)),
    to: new Date(Date.UTC(year, month - 1, date + 2)),
  };
}

export function projectCalendarDay(
  records: CalendarEventLike[],
  selectedDay: string,
): { events: DayCalendarRecord[]; truncated: boolean } {
  const selected = records
    .filter(
      (record) =>
        Number.isFinite(record.startAt.getTime()) &&
        formatSydneyDay(record.startAt) === selectedDay,
    )
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());

  return {
    events: selected.slice(0, DAY_CALENDAR_EVENT_LIMIT).map((record) => ({
      id: record.id,
      title: record.title.slice(0, 160),
      category: record.eventType.slice(0, 60),
      startsAt: record.startAt.toISOString(),
      endsAt: record.endAt.toISOString(),
      evidenceStatus: "recorded_unverified",
    })),
    truncated:
      selected.length > DAY_CALENDAR_EVENT_LIMIT ||
      records.length >= 200, // underlying calendar list service caps at 200
  };
}
