import { describe, expect, it } from "vitest";

import {
  DAY_CALENDAR_EVENT_LIMIT,
  formatSydneyDay,
  parseCalendarDay,
  projectCalendarDay,
} from "@/lib/day/calendar-read";

const clock = new Date("2026-11-09T01:00:00.000Z"); // 12:00 Sydney AEDT

describe("MapAble Day self-calendar projection", () => {
  it("uses an explicit Sydney date regardless of runtime timezone", () => {
    expect(formatSydneyDay(clock)).toBe("2026-11-09");
    expect(formatSydneyDay(new Date("2026-10-03T13:30:00Z"))).toBe("2026-10-03");
    expect(formatSydneyDay(new Date("2026-10-03T14:30:00Z"))).toBe("2026-10-04");
  });

  it("selects today when no day is requested", () => {
    expect(parseCalendarDay(null, clock)?.day).toBe("2026-11-09");
  });

  it("rejects impossible dates, malformed inputs and out-of-range dates", () => {
    for (const invalid of [
      "2026-02-30",
      "2026-11-09T00:00",
      "2026-11-9",
      "2026-99-01",
      "0000-01-01",
      "2026-10-01",
      "2026-12-01",
      "",
    ]) {
      expect(parseCalendarDay(invalid, clock)).toBeNull();
    }
  });

  it("allows a bounded day selection without leaking entire history", () => {
    expect(parseCalendarDay("2026-11-02", clock)?.day).toBe("2026-11-02");
    expect(parseCalendarDay("2026-11-23", clock)?.day).toBe("2026-11-23");
    expect(parseCalendarDay("2026-11-01", clock)).toBeNull();
    expect(parseCalendarDay("2026-11-24", clock)).toBeNull();
  });

  it("filters by Sydney day, sorts and never calls a record confirmed", () => {
    const result = projectCalendarDay(
      [
        {
          id: "late",
          title: "Later appointment",
          eventType: "appointment",
          startAt: new Date("2026-11-09T01:30:00Z"),
          endAt: new Date("2026-11-09T02:00:00Z"),
        },
        {
          id: "next",
          title: "Tomorrow",
          eventType: "appointment",
          startAt: new Date("2026-11-09T13:30:00Z"),
          endAt: new Date("2026-11-09T14:00:00Z"),
        },
        {
          id: "early",
          title: "Morning support",
          eventType: "care_shift",
          startAt: new Date("2026-11-08T22:00:00Z"),
          endAt: new Date("2026-11-08T23:00:00Z"),
        },
      ],
      "2026-11-09",
    );
    expect(result.events.map((event) => event.id)).toEqual(["early", "late"]);
    expect(result.events.every((event) => event.evidenceStatus === "recorded_unverified")).toBe(true);
    expect(result.events.some((event) => event.id === "next")).toBe(false);
  });

  it("caps output and notes possible truncation", () => {
    const rows = Array.from({ length: DAY_CALENDAR_EVENT_LIMIT + 5 }, (_, index) => ({
      id: String(index),
      title: "Same-day calendar entry",
      eventType: "appointment",
      startAt: new Date("2026-11-09T01:00:00Z"),
      endAt: new Date("2026-11-09T02:00:00Z"),
    }));
    const result = projectCalendarDay(rows, "2026-11-09");
    expect(result.events).toHaveLength(DAY_CALENDAR_EVENT_LIMIT);
    expect(result.truncated).toBe(true);
  });

  it("never retains calendar description, location, participant identifiers or access notes", () => {
    const source = {
      id: "fixture",
      title: "Private event",
      eventType: "appointment",
      startAt: new Date("2026-11-09T01:00:00Z"),
      endAt: new Date("2026-11-09T02:00:00Z"),
      description: "RESTRICTED DESCRIPTION",
      participantId: "private-participant",
      mobilityRequirements: "RESTRICTED ACCESS",
      location: "RESTRICTED LOCATION",
    };
    const result = projectCalendarDay([source], "2026-11-09");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("RESTRICTED");
    expect(serialized).not.toContain("private-participant");
  });
});
