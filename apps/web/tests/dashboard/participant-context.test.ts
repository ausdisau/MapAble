import { describe, expect, it } from "vitest";

import {
  getParticipantContextActions,
  type ParticipantContextCounts,
} from "@/lib/dashboard/participant-context";

const EMPTY_COUNTS: ParticipantContextCounts = {
  bookings: 0,
  careBookings: 0,
  transportTrips: 0,
  unreadNotifications: 0,
  openSupportTickets: 0,
};

describe("participant contextual dashboard", () => {
  it("shows deterministic navigation when no records exist", () => {
    const actions = getParticipantContextActions(EMPTY_COUNTS);
    expect(actions.map((action) => action.id)).toEqual([
      "bookings",
      "care",
      "transport",
    ]);
    expect(actions[0]?.evidence).toBe("No bookings on record");
  });

  it("prioritises open support requests and unread notifications without inventing emergencies", () => {
    const actions = getParticipantContextActions({
      ...EMPTY_COUNTS,
      openSupportTickets: 2,
      unreadNotifications: 1,
      bookings: 3,
    });
    expect(actions.map((action) => action.id)).toEqual([
      "support",
      "notifications",
      "bookings",
    ]);
    expect(actions[0]?.href).toBe("/dashboard/safety/support");
    expect(actions[2]?.evidence).toContain("not a count of upcoming shifts");
  });

  it("does not infer worker availability, matching, or eligibility from aggregate counts", () => {
    const actions = getParticipantContextActions({
      ...EMPTY_COUNTS,
      careBookings: 2,
      transportTrips: 4,
    });
    const visibleText = JSON.stringify(actions).toLowerCase();
    expect(visibleText).not.toContain("available worker");
    expect(visibleText).not.toContain("eligible");
    expect(visibleText).not.toContain("match score");
  });

  it("limits suggestions without hiding the sidebar destinations", () => {
    const actions = getParticipantContextActions({
      bookings: 5,
      careBookings: 4,
      transportTrips: 3,
      unreadNotifications: 2,
      openSupportTickets: 1,
    });
    expect(actions).toHaveLength(3);
  });
});
