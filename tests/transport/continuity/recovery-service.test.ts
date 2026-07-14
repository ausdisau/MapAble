import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/transport-command", () => ({
  transportCommandConfig: {
    commandCentreEnabled: true,
    continuityRecoveryEnabled: true,
    publicTransitAdaptersEnabled: true,
    autoSubstitutionEnabled: false,
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/transport/accessibility/evidence-service", () => ({
  assessVehicleCompatibility: vi.fn(),
}));

vi.mock("@/lib/transport/transport-event-service", () => ({
  recordTripEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: { findUnique: vi.fn() },
    transportContinuityRecoveryRequest: { create: vi.fn() },
    transportDisruptionEvent: { create: vi.fn() },
  },
}));

import { assessVehicleCompatibility } from "@/lib/transport/accessibility/evidence-service";
import { proposeRecoveryOptions } from "@/lib/transport/continuity/recovery-service";
import { prisma } from "@/lib/prisma";

describe("continuity recovery service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.transportTrip.findUnique).mockResolvedValue({
      id: "trip-1",
      participantId: "p-1",
      mobilityRequirements: { requiresWheelchairAccessible: true },
      dispatchAssignments: [],
    } as never);
    vi.mocked(prisma.transportDisruptionEvent.create).mockResolvedValue({} as never);
  });

  it("escalates when no evidence-compliant options exist", async () => {
    vi.mocked(assessVehicleCompatibility).mockResolvedValue({
      compatible: false,
      evidenceBased: false,
      reasons: ["No evidence"],
      evidenceSources: [],
      freshness: [],
    });
    vi.mocked(prisma.transportContinuityRecoveryRequest.create).mockResolvedValue({
      id: "req-1",
      status: "escalated",
    } as never);

    const result = await proposeRecoveryOptions({
      tripId: "trip-1",
      trigger: "driver_cancel",
      actorUserId: "op-1",
      optionDrafts: [
        {
          optionKey: "alt-vehicle",
          label: "Alternate vehicle",
          description: "Backup van",
          vehicleId: "veh-2",
        },
      ],
    });

    expect(result.escalated).toBe(true);
    expect(result.options).toHaveLength(0);
  });

  it("presents options awaiting confirmation when evidence passes", async () => {
    vi.mocked(assessVehicleCompatibility).mockResolvedValue({
      compatible: true,
      evidenceBased: true,
      reasons: [],
      evidenceSources: ["assessor report"],
      freshness: [],
    });
    vi.mocked(prisma.transportContinuityRecoveryRequest.create).mockResolvedValue({
      id: "req-2",
      status: "awaiting_confirmation",
      options: [
        {
          id: "opt-1",
          optionKey: "alt-vehicle",
          label: "Alternate vehicle",
          description: "Backup van",
        },
      ],
    } as never);

    const result = await proposeRecoveryOptions({
      tripId: "trip-1",
      trigger: "vehicle_failure",
      actorUserId: "op-1",
      optionDrafts: [
        {
          optionKey: "alt-vehicle",
          label: "Alternate vehicle",
          description: "Backup van",
          vehicleId: "veh-2",
        },
      ],
    });

    expect(result.escalated).toBe(false);
    expect(result.options).toHaveLength(1);
    expect(result.request.status).toBe("awaiting_confirmation");
  });
});
