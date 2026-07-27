import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const vehicleAccessibilityEvidence = { findMany: vi.fn() };
  const mobilityDeviceCompatibility = { findMany: vi.fn() };
  const restraintCapability = { findMany: vi.fn() };
  const vehicleInspection = { findMany: vi.fn() };
  const transportVehicleFeature = { findMany: vi.fn() };
  return {
    prisma: {
      vehicleAccessibilityEvidence,
      mobilityDeviceCompatibility,
      restraintCapability,
      vehicleInspection,
      transportVehicleFeature,
    },
  };
});

import { assessVehicleCompatibility } from "@/lib/transport/accessibility/evidence-service";
import { prisma } from "@/lib/prisma";

describe("evidence-based vehicle compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.vehicleAccessibilityEvidence.findMany).mockResolvedValue([]);
    vi.mocked(prisma.mobilityDeviceCompatibility.findMany).mockResolvedValue([]);
    vi.mocked(prisma.restraintCapability.findMany).mockResolvedValue([]);
    vi.mocked(prisma.transportVehicleFeature.findMany).mockResolvedValue([]);
  });

  it("rejects generic wheelchair label without ramp/lift evidence", async () => {
    vi.mocked(prisma.transportVehicleFeature.findMany).mockResolvedValue([
      {
        wheelchairAccessible: true,
        rampAvailable: false,
        liftAvailable: false,
        hoistAvailable: false,
        assistanceAnimalFriendly: true,
      },
    ] as never);
    vi.mocked(prisma.vehicleInspection.findMany).mockResolvedValue([
      {
        outcome: "pass",
        evidenceSource: "annual inspection",
        inspectedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    ] as never);

    const result = await assessVehicleCompatibility("veh-1", {
      requiresWheelchairAccessible: true,
      requiresRamp: true,
    });

    expect(result.compatible).toBe(false);
    expect(result.reasons.some((r) => r.includes("Generic wheelchair-accessible"))).toBe(
      true
    );
  });

  it("accepts when device compatibility evidence exists", async () => {
    vi.mocked(prisma.vehicleAccessibilityEvidence.findMany).mockResolvedValue([
      {
        kind: "ramp_measurement",
        source: "certified assessor",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000 * 30),
      },
    ] as never);
    vi.mocked(prisma.mobilityDeviceCompatibility.findMany).mockResolvedValue([
      {
        deviceType: "manual_wheelchair",
        compatible: true,
        evidenceSource: "assessor report",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000 * 30),
      },
    ] as never);
    vi.mocked(prisma.vehicleInspection.findMany).mockResolvedValue([
      {
        outcome: "pass",
        evidenceSource: "annual inspection",
        inspectedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    ] as never);
    vi.mocked(prisma.transportVehicleFeature.findMany).mockResolvedValue([
      {
        wheelchairAccessible: true,
        rampAvailable: true,
        liftAvailable: false,
        hoistAvailable: false,
        assistanceAnimalFriendly: true,
      },
    ] as never);

    const result = await assessVehicleCompatibility("veh-1", {
      requiresWheelchairAccessible: true,
    });

    expect(result.compatible).toBe(true);
    expect(result.evidenceBased).toBe(true);
  });
});
