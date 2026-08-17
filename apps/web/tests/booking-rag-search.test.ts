import { afterEach, describe, expect, it } from "vitest";

import {
  resetBookingRAGEngine,
  searchBookingsForSnapshots,
} from "@/lib/bookings/rag/engine";
import { explainBookingStatus } from "@/lib/bookings/rag/explain-status";
import { parseBookingSearchFilters } from "@/lib/bookings/rag/filters";
import type { BookingSnapshot } from "@/lib/bookings/rag/types";

function makeSnapshot(overrides: Partial<BookingSnapshot> = {}): BookingSnapshot {
  const id = overrides.id ?? "booking-1";
  return {
    id,
    recordType: "care",
    status: "accepted",
    participantId: "participant-1",
    organisationId: "org-1",
    organisationName: "Sunrise Care",
    scheduledStartAt: new Date("2026-06-10T09:00:00Z"),
    scheduledEndAt: new Date("2026-06-10T11:00:00Z"),
    location: "Parramatta",
    title: "Morning personal care",
    summary: "Personal care visit in Parramatta with Sunrise Care.",
    searchText:
      "morning personal care parramatta sunrise care accepted support worker",
    createdAt: new Date("2026-06-01T00:00:00Z"),
    updatedAt: new Date("2026-06-02T00:00:00Z"),
    events: [
      {
        id: "evt-1",
        eventType: "status_change",
        title: "Provider accepted booking",
        createdAt: new Date("2026-06-01T12:00:00Z"),
      },
    ],
    serviceLogs: [],
    segments: [],
    includeSensitiveFields: true,
    ...overrides,
  };
}

describe("booking RAG search", () => {
  afterEach(() => {
    resetBookingRAGEngine();
  });

  it("ranks care bookings by TF match", () => {
    const care = makeSnapshot({
      id: "care-1",
      searchText: "wheelchair personal care parramatta",
    });
    const transport = makeSnapshot({
      id: "transport-1",
      recordType: "transport",
      title: "Wheelchair transport",
      searchText: "wheelchair transport pickup",
      status: "confirmed",
    });

    const hits = searchBookingsForSnapshots("wheelchair care parramatta", [
      care,
      transport,
    ]);

    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.bookingId).toBe("care-1");
    expect(hits[0]?.chunks[0]?.chunkId).toBe("care-1:summary");
    expect(hits[0]?.matchedTerms.length).toBeGreaterThan(0);
  });

  it("parses structured filters from query hints", () => {
    const filters = parseBookingSearchFilters(
      "pending transport bookings tomorrow",
    );
    expect(filters.recordType).toBe("transport");
    expect(filters.status).toBe("pending");
    expect(filters.fromDate).toBeInstanceOf(Date);
    expect(filters.toDate).toBeInstanceOf(Date);
  });

  it("filters by record type when explicit filter passed", () => {
    const care = makeSnapshot({ id: "care-1", recordType: "care" });
    const transport = makeSnapshot({
      id: "transport-1",
      recordType: "transport",
      searchText: "transport trip",
      title: "Transport trip",
    });

    const hits = searchBookingsForSnapshots("trip", [care, transport], {
      recordType: "transport",
    });

    expect(hits.every((h) => h.recordType === "transport")).toBe(true);
  });

  it("explains care booking status deterministically", () => {
    const explanation = explainBookingStatus({
      bookingId: "care-1",
      recordType: "care",
      status: "pending_provider",
    });

    expect(explanation.summary).toContain("Waiting for the provider");
    expect(explanation.nextSteps.length).toBeGreaterThan(0);
    expect(explanation.participantActions.length).toBeGreaterThan(0);
  });
});
