import { afterEach, describe, expect, it, vi } from "vitest";

import { bookingServicesToolNames } from "@/lib/agent/booking-services-tools";
import {
  isBookingLookupQuery,
  shouldRouteToBookingAgent,
} from "@/lib/bookings/rag/copilot-route";
import { isBookingServicesAgentConfigured } from "@/lib/config/booking-services-agent";

describe("booking services agent config", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("is disabled unless explicitly enabled", () => {
    delete process.env.BOOKING_SERVICES_AGENT_ENABLED;
    expect(isBookingServicesAgentConfigured()).toBe(false);
    process.env.BOOKING_SERVICES_AGENT_ENABLED = "true";
    expect(isBookingServicesAgentConfigured()).toBe(true);
  });
});

describe("booking services tools", () => {
  it("maps tool names for agent observability", () => {
    expect(bookingServicesToolNames.searchBookings).toBe("searchBookings");
    expect(bookingServicesToolNames.getBookingContext).toBe("getBookingContext");
    expect(bookingServicesToolNames.explainBookingStatus).toBe(
      "explainBookingStatus",
    );
  });
});

describe("booking copilot routing", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it("detects booking lookup queries", () => {
    expect(isBookingLookupQuery("When is my next visit?")).toBe(true);
    expect(isBookingLookupQuery("Show my bookings")).toBe(true);
    expect(isBookingLookupQuery("OT near Parramatta")).toBe(false);
  });

  it("routes only when agent is enabled", () => {
    delete process.env.BOOKING_SERVICES_AGENT_ENABLED;
    expect(shouldRouteToBookingAgent("my booking status")).toBe(false);

    process.env.BOOKING_SERVICES_AGENT_ENABLED = "true";
    expect(shouldRouteToBookingAgent("my booking status")).toBe(true);
    expect(shouldRouteToBookingAgent("NDIS providers near me")).toBe(false);
  });
});

describe("createBookingServicesAgent", () => {
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
    vi.resetModules();
  });

  it("throws when agent is not configured", async () => {
    delete process.env.BOOKING_SERVICES_AGENT_ENABLED;
    const { createBookingServicesAgent } = await import(
      "@/lib/agent/booking-services-agent"
    );

    expect(() =>
      createBookingServicesAgent({
        id: "u1",
        email: "a@b.com",
        name: "Test",
        phone: null,
        timezone: "Australia/Sydney",
        locale: "en-AU",
        primaryRole: "participant",
        roles: ["participant"],
      }),
    ).toThrow("Booking services agent is not enabled");
  });
});
