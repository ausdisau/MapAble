import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/transport-command", () => ({
  transportCommandConfig: {
    commandCentreEnabled: true,
    continuityRecoveryEnabled: true,
    publicTransitAdaptersEnabled: true,
    autoSubstitutionEnabled: false,
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transportTrip: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    transportReturnTripAssurance: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (fn) =>
      fn({
        transportTrip: {
          update: vi.fn(),
        },
        transportReturnTripAssurance: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
          update: vi.fn(),
        },
      })
    ),
  },
}));

vi.mock("@/lib/transport/transport-event-service", () => ({
  recordTripEvent: vi.fn(),
}));

import { linkReturnTrip } from "@/lib/transport/continuity/return-trip-service";
import { prisma } from "@/lib/prisma";

describe("return trip linkage", () => {
  it("rejects mismatched participants", async () => {
    vi.mocked(prisma.transportTrip.findUnique)
      .mockResolvedValueOnce({
        id: "out-1",
        participantId: "p-1",
      } as never)
      .mockResolvedValueOnce({
        id: "ret-1",
        participantId: "p-2",
      } as never);

    await expect(
      linkReturnTrip({
        outboundTripId: "out-1",
        returnTripId: "ret-1",
        actorUserId: "user-1",
      })
    ).rejects.toMatchObject({ code: "TRANSPORT_PARTICIPANT_MISMATCH" });
  });
});
