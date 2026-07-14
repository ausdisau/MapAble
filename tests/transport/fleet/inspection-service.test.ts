import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    vehicleInspection: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import {
  getLatestInspection,
  isVehicleInspectionCurrent,
  recordVehicleInspection,
} from "@/lib/transport/fleet/inspection-service";
import { prisma } from "@/lib/prisma";

describe("fleet inspection service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("records an inspection with evidence source", async () => {
    vi.mocked(prisma.vehicleInspection.create).mockResolvedValue({
      id: "insp-1",
      outcome: "pass",
    } as never);

    await recordVehicleInspection({
      vehicleId: "veh-1",
      inspectedAt: new Date(),
      outcome: "pass",
      evidenceSource: "authorised assessor",
    });

    expect(prisma.vehicleInspection.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ evidenceSource: "authorised assessor" }),
      })
    );
  });

  it("returns false when latest inspection failed", async () => {
    vi.mocked(prisma.vehicleInspection.findFirst).mockResolvedValue({
      outcome: "fail",
      expiresAt: null,
    } as never);

    expect(await isVehicleInspectionCurrent("veh-1")).toBe(false);
  });

  it("returns latest inspection ordered by date", async () => {
    vi.mocked(prisma.vehicleInspection.findFirst).mockResolvedValue({
      id: "insp-2",
    } as never);

    await getLatestInspection("veh-1");
    expect(prisma.vehicleInspection.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { inspectedAt: "desc" } })
    );
  });
});
