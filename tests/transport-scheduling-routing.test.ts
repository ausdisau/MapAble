import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/lib/auth/current-user";
import { resolveTripAccess } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { assignDriverAndVehicle } from "@/lib/transport/transport-assignment-service";
import {
  checkDriverEligibility,
  checkVehicleEligibility,
} from "@/lib/transport/transport-eligibility-service";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { buildPermissions } from "@/lib/transport/transport-response";
import { reportTripSafetyIssue } from "@/lib/transport/transport-safety-service";
import { detectScheduleConflicts } from "@/lib/transport/transport-schedule-conflict-service";
import { assertStatusTransition } from "@/lib/transport/transport-status-service";
import { mockRoutingAdapter } from "@/lib/transport/routing/mock-routing-adapter";
import { OsrmRoutingAdapter } from "@/lib/transport/routing/osrm-routing-adapter";
import { createOptimisationJob } from "@/lib/transport/routing/route-optimisation-service";

const participantUser: CurrentUser = {
  id: "participant-1",
  email: "p@test.com",
  name: "Participant",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "participant",
  roles: ["participant"],
};

const otherParticipant: CurrentUser = {
  ...participantUser,
  id: "participant-2",
  email: "p2@test.com",
};

const providerUser: CurrentUser = {
  id: "provider-admin-1",
  email: "prov@test.com",
  name: "Provider",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "transport_operator",
  roles: ["transport_operator"],
};

const driverUser: CurrentUser = {
  id: "driver-user-1",
  email: "driver@test.com",
  name: "Driver",
  phone: null,
  timezone: "Australia/Sydney",
  locale: "en-AU",
  primaryRole: "driver",
  roles: ["driver"],
};

const baseTrip = {
  id: "trip-1",
  tripRequestId: null,
  participantId: "participant-1",
  providerOrganisationId: "org-1",
  legacyTransportBookingId: null,
  rideRunId: null,
  status: "driver_vehicle_assigned" as const,
  pickupAddress: "123 Secret St",
  pickupSuburb: "Sydney",
  pickupLat: -33.87,
  pickupLng: 151.21,
  dropoffAddress: "456 Hospital Rd",
  dropoffSuburb: "Sydney",
  dropoffLat: -33.88,
  dropoffLng: 151.22,
  accessNotes: "Ring bell",
  scheduledStart: new Date("2026-06-01T09:00:00Z"),
  scheduledEnd: new Date("2026-06-01T10:00:00Z"),
  mobilityRequirements: {},
  disputeReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transportTripRequest: { create: vi.fn() },
    transportTripStop: { createMany: vi.fn() },
    transportTripEvent: { create: vi.fn() },
    transportDispatchAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    transportDriver: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    transportVehicle: { findFirst: vi.fn(), findUnique: vi.fn() },
    transportDriverVerification: {},
    transportVehicleVerification: {},
    transportVehicleFeature: {},
    transportDriverAvailability: { findFirst: vi.fn() },
    transportScheduleConflict: { createMany: vi.fn() },
    transportRouteEstimate: { findFirst: vi.fn(), create: vi.fn() },
    transportRouteSegment: { createMany: vi.fn() },
    transportRouteOptimisationJob: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    transportRouteOptimisationResult: { createMany: vi.fn() },
    transportLiveLocation: { create: vi.fn() },
    transportTripEvidence: { create: vi.fn() },
    transportSafetyCheck: { findMany: vi.fn().mockResolvedValue([]) },
    transportHandoverRecord: { findMany: vi.fn().mockResolvedValue([]) },
    transportSafetyEvent: { create: vi.fn() },
    transportIncidentLink: { create: vi.fn() },
    dataAccessLog: { create: vi.fn() },
    consentRecord: { findFirst: vi.fn() },
    organisationMember: { findMany: vi.fn() },
    booking: { findFirst: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  checkConsent: vi.fn().mockResolvedValue(false),
}));

vi.mock("@/lib/api/organisation-scope", () => ({
  getUserOrganisationIds: vi.fn().mockResolvedValue(["org-1"]),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { prisma } from "@/lib/prisma";
import { createTransportTrip, getTransportTripForUser } from "@/lib/transport/transport-trip-service";
import { logDataAccess } from "@/lib/transport/data-access-log-service";
import { createIncident } from "@/lib/incidents/incident-service";

vi.mock("@/lib/incidents/incident-service", () => ({
  createIncident: vi.fn().mockResolvedValue({ id: "incident-1" }),
}));

describe("transport status transitions", () => {
  it("blocks invalid status path", () => {
    expect(() =>
      assertStatusTransition("requested", "trip_completed")
    ).toThrow(TransportApiError);
  });

  it("allows driver pre-start to en route", () => {
    expect(() =>
      assertStatusTransition("pre_start_check_required", "en_route_to_pickup", {
        driverOnly: true,
      })
    ).not.toThrow();
  });
});

describe("mock routing adapter", () => {
  it("returns distance and duration", async () => {
    const result = await mockRoutingAdapter.estimateRoute({
      origin: { lat: -33.87, lng: 151.21 },
      destination: { lat: -33.88, lng: 151.22 },
    });
    expect(result.distanceMetres).toBeGreaterThan(0);
    expect(result.durationSeconds).toBeGreaterThan(0);
  });
});

describe("OSRM adapter response mapping", () => {
  it("maps route response with mocked HTTP", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        routes: [{ distance: 5000, duration: 600, legs: [{ distance: 5000, duration: 600 }] }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new OsrmRoutingAdapter("http://osrm.test");
    const result = await adapter.estimateRoute({
      origin: { lat: -33.87, lng: 151.21 },
      destination: { lat: -33.88, lng: 151.22 },
    });
    expect(result.distanceMetres).toBe(5000);
    expect(result.durationSeconds).toBe(600);
    vi.unstubAllGlobals();
  });
});

describe("address shaping by role", () => {
  it("hides exact pickup from summary access", async () => {
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue(
      null
    );
    vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(null);

    const access = await resolveTripAccess(otherParticipant, baseTrip);
    expect(access).toBe("none");
  });

  it("shows exact pickup for participant", async () => {
    const access = await resolveTripAccess(participantUser, baseTrip);
    expect(access).toBe("exact");
    const perms = buildPermissions(participantUser, baseTrip, access, false);
    expect(perms.canViewExactPickup).toBe(true);
  });

  it("assigned driver can view exact pickup", async () => {
    vi.mocked(prisma.transportDriver.findFirst).mockResolvedValue({
      id: "td-1",
      userId: driverUser.id,
      organisationId: "org-1",
      active: true,
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
      id: "assign-1",
      tripId: baseTrip.id,
      driverId: "td-1",
      active: true,
    } as never);

    const access = await resolveTripAccess(driverUser, baseTrip);
    expect(access).toBe("exact");
  });

  it("unassigned driver cannot view trip", async () => {
    vi.mocked(prisma.transportDriver.findFirst).mockResolvedValue({
      id: "td-2",
      userId: driverUser.id,
      active: true,
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue(
      null
    );

    const access = await resolveTripAccess(driverUser, baseTrip);
    expect(access).toBe("none");
  });
});

describe("eligibility checks", () => {
  beforeEach(() => {
    vi.mocked(prisma.transportDriver.findUnique).mockResolvedValue({
      id: "td-1",
      active: true,
      verifications: [
        { kind: "licence", status: "verified", expiresAt: null },
        { kind: "screening", status: "verified", expiresAt: null },
        { kind: "training", status: "verified", expiresAt: null },
      ],
    } as never);
    vi.mocked(prisma.transportVehicle.findUnique).mockResolvedValue({
      id: "tv-1",
      active: true,
      verifications: [
        { kind: "registration", status: "verified", expiresAt: null },
        { kind: "insurance", status: "verified", expiresAt: null },
        { kind: "inspection", status: "verified", expiresAt: null },
      ],
      features: [{ wheelchairAccessible: true, rampAvailable: true, liftAvailable: false }],
    } as never);
  });

  it("eligible driver passes", async () => {
    const r = await checkDriverEligibility("td-1", { requireAccessTraining: true });
    expect(r.eligible).toBe(true);
  });

  it("ineligible driver fails", async () => {
    vi.mocked(prisma.transportDriver.findUnique).mockResolvedValue({
      id: "td-1",
      active: true,
      verifications: [{ kind: "licence", status: "pending_review", expiresAt: null }],
    } as never);
    const r = await checkDriverEligibility("td-1");
    expect(r.eligible).toBe(false);
  });

  it("ineligible vehicle fails wheelchair requirement", async () => {
    const r = await checkVehicleEligibility("tv-1", {
      requiresWheelchairAccessible: true,
    });
    expect(r.eligible).toBe(true);
    vi.mocked(prisma.transportVehicle.findUnique).mockResolvedValue({
      id: "tv-1",
      active: true,
      verifications: [
        { kind: "registration", status: "verified", expiresAt: null },
        { kind: "insurance", status: "verified", expiresAt: null },
        { kind: "inspection", status: "verified", expiresAt: null },
      ],
      features: [{ wheelchairAccessible: false, rampAvailable: false, liftAvailable: false }],
    } as never);
    const r2 = await checkVehicleEligibility("tv-1", {
      requiresWheelchairAccessible: true,
    });
    expect(r2.eligible).toBe(false);
  });
});

describe("schedule conflicts", () => {
  it("detects overlapping driver assignment", async () => {
    vi.mocked(prisma.transportDispatchAssignment.findMany).mockResolvedValue([
      {
        tripId: "other-trip",
        trip: {
          id: "other-trip",
          status: "accepted",
          scheduledStart: new Date("2026-06-01T09:30:00Z"),
          scheduledEnd: new Date("2026-06-01T10:30:00Z"),
        },
      },
    ] as never);
    vi.mocked(prisma.transportDriverAvailability.findFirst).mockResolvedValue(
      null
    );

    const result = await detectScheduleConflicts({
      tripId: "trip-1",
      driverId: "td-1",
      scheduledStart: new Date("2026-06-01T09:00:00Z"),
      scheduledEnd: new Date("2026-06-01T10:00:00Z"),
    });
    expect(result.hasConflict).toBe(true);
  });
});

describe("trip access via service", () => {
  beforeEach(() => {
    vi.mocked(prisma.transportTrip.findUnique).mockImplementation(
      (async ({
        where,
      }: {
        where: { id?: string };
      }) => {
        if (where.id === "trip-1") return baseTrip;
        return null;
      }) as never
    );
    vi.mocked(prisma.transportRouteEstimate.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dataAccessLog.create).mockResolvedValue({} as never);
  });

  it("participant can view own trip", async () => {
    const res = await getTransportTripForUser(participantUser, "trip-1");
    expect(res.trip.id).toBe("trip-1");
    expect(res.trip.pickup.address).toBe("123 Secret St");
    expect(prisma.dataAccessLog.create).toHaveBeenCalled();
  });

  it("participant cannot view another participant trip", async () => {
    await expect(
      getTransportTripForUser(otherParticipant, "trip-1")
    ).rejects.toMatchObject({ code: "TRANSPORT_TRIP_NOT_FOUND" });
  });
});

describe("assignment guards", () => {
  beforeEach(() => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      ...baseTrip,
      status: "dispatch_pending",
    } as never);
    vi.mocked(prisma.transportDriver.findFirst).mockResolvedValue({
      id: "td-1",
      organisationId: "org-1",
      active: true,
    } as never);
    vi.mocked(prisma.transportVehicle.findFirst).mockResolvedValue({
      id: "tv-1",
      organisationId: "org-1",
      active: true,
    } as never);
    vi.mocked(prisma.transportDriver.findUnique).mockResolvedValue({
      id: "td-1",
      active: true,
      verifications: [
        { kind: "licence", status: "verified", expiresAt: null },
        { kind: "screening", status: "verified", expiresAt: null },
        { kind: "training", status: "verified", expiresAt: null },
      ],
    } as never);
    vi.mocked(prisma.transportVehicle.findUnique).mockResolvedValue({
      id: "tv-1",
      active: true,
      verifications: [
        { kind: "registration", status: "verified", expiresAt: null },
        { kind: "insurance", status: "verified", expiresAt: null },
        { kind: "inspection", status: "verified", expiresAt: null },
      ],
      features: [],
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transportDriverAvailability.findFirst).mockResolvedValue(
      null
    );
    vi.mocked(prisma.transportDispatchAssignment.updateMany).mockResolvedValue({
      count: 0,
    });
    vi.mocked(prisma.transportDispatchAssignment.create).mockResolvedValue(
      {} as never
    );
    vi.mocked(prisma.transportTrip.update).mockResolvedValue({
      ...baseTrip,
      status: "driver_vehicle_assigned",
    } as never);
    vi.mocked(prisma.transportTripEvent.create).mockResolvedValue({} as never);
  });

  it("blocks ineligible driver assignment", async () => {
    vi.mocked(prisma.transportDriver.findUnique).mockResolvedValue({
      id: "td-1",
      active: true,
      verifications: [],
    } as never);
    await expect(
      assignDriverAndVehicle(providerUser, "trip-1", "org-1", "td-1", "tv-1")
    ).rejects.toMatchObject({ code: "TRANSPORT_DRIVER_NOT_ELIGIBLE" });
  });
});

describe("optimisation placeholder", () => {
  it("stores job and results", async () => {
    vi.mocked(prisma.transportRouteOptimisationJob.create).mockResolvedValue({
      id: "job-1",
      status: "pending",
    } as never);
    vi.mocked(prisma.transportRouteOptimisationJob.update).mockResolvedValue(
      {} as never
    );
    vi.mocked(prisma.transportRouteOptimisationResult.createMany).mockResolvedValue(
      { count: 1 }
    );
    vi.mocked(prisma.transportRouteOptimisationJob.findUnique).mockResolvedValue({
      id: "job-1",
      status: "completed",
      results: [{ summary: "Suggestion" }],
    } as never);

    const job = await createOptimisationJob({
      input: {
        stops: [
          { lat: -33.87, lng: 151.21 },
          { lat: -33.88, lng: 151.22 },
        ],
      },
    });
    expect(job.status).toBe("completed");
  });
});

describe("audit and safety", () => {
  it("status update creates trip event", async () => {
    vi.mocked(prisma.transportTripEvent.create).mockResolvedValue({
      id: "ev-1",
    } as never);
    await recordTripEvent({
      tripId: "trip-1",
      actorUserId: driverUser.id,
      eventType: "driver_status",
      fromStatus: "driver_accepted",
      toStatus: "en_route_to_pickup",
    });
    expect(prisma.transportTripEvent.create).toHaveBeenCalled();
  });

  it("safety report creates safety event", async () => {
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue(baseTrip as never);
    vi.mocked(prisma.transportDriver.findFirst).mockResolvedValue({
      id: "td-1",
      userId: driverUser.id,
    } as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue({
      driverId: "td-1",
      active: true,
    } as never);
    vi.mocked(prisma.transportSafetyEvent.create).mockResolvedValue({
      id: "se-1",
    } as never);
    vi.mocked(prisma.transportTripEvent.create).mockResolvedValue({} as never);

    const { phase4Config } = await import("@/lib/config/phase4");
    const previousIncidentReporting = phase4Config.incidentReportingEnabled;
    phase4Config.incidentReportingEnabled = true;
    try {
      const result = await reportTripSafetyIssue(driverUser, "trip-1", {
        category: "vehicle_issue",
        description: "Brake warning light on",
        severity: "high",
        escalateToIncident: true,
      });
      expect(result.safetyEvent.id).toBe("se-1");
      expect(createIncident).toHaveBeenCalled();
    } finally {
      phase4Config.incidentReportingEnabled = previousIncidentReporting;
    }
  });

  it("data access log on sensitive read", async () => {
    await logDataAccess({
      actor: participantUser,
      resourceType: "TransportTrip",
      resourceId: "trip-1",
      accessType: "read_detail",
      participantId: "participant-1",
    });
    expect(prisma.dataAccessLog.create).toHaveBeenCalled();
  });
});

describe("participant create trip", () => {
  it("creates trip request and trip", async () => {
    vi.mocked(prisma.transportTripRequest.create).mockResolvedValue({
      id: "req-1",
    } as never);
    vi.mocked(prisma.transportTrip.create).mockResolvedValue({
      ...baseTrip,
      id: "trip-new",
      status: "requested",
      providerOrganisationId: null,
    } as never);
    vi.mocked(prisma.transportTripStop.createMany).mockResolvedValue({
      count: 2,
    });
    vi.mocked(prisma.transportTripEvent.create).mockResolvedValue({} as never);
    vi.mocked(prisma.transportDispatchAssignment.findFirst).mockResolvedValue(
      null
    );

    const res = await createTransportTrip(participantUser, {
      pickupAddress: "1 A St",
      dropoffAddress: "2 B St",
      scheduledStart: "2026-06-01T09:00:00.000Z",
    });
    expect(res.trip.id).toBe("trip-new");
  });
});
