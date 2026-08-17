import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/moves-rehabilitation", () => ({
  movesRehabilitationConfig: {
    enabled: true,
    telehealthEnabled: true,
    deviceImportEnabled: true,
    diagnoseEnabled: false,
    prescribeEnabled: false,
    alterTreatmentEnabled: false,
    intensityAutoIncreaseEnabled: false,
  },
  ensureMovesRehabilitationEnabled: vi.fn(),
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/moves/plans-service", () => ({
  requireClinicalAuthor: vi.fn(),
}));
vi.mock("@/lib/telehealth/video/mock-video-adapter", () => ({
  mockVideoAdapter: {
    createRoom: vi.fn().mockResolvedValue({
      externalRoomId: "room-1",
      joinUrl: "/telehealth/mock/room-1",
    }),
  },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    telehealthSessionRecord: { create: vi.fn() },
    healthDeviceImport: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  importHealthDeviceData,
  revokeHealthDeviceImport,
} from "@/lib/moves/telehealth-service";
import { prisma } from "@/lib/prisma";

describe("moves integrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("imports device data with source label", async () => {
    vi.mocked(prisma.healthDeviceImport.create).mockResolvedValue({
      id: "import-1",
      participantId: "p1",
      sourceLabel: "Fitbit Charge 6",
      payloadJson: { steps: 1200 },
      importedAt: new Date(),
      revokedAt: null,
    });

    const record = await importHealthDeviceData(
      {
        participantId: "p1",
        sourceLabel: "Fitbit Charge 6",
        payload: { steps: 1200 },
      },
      "p1",
    );

    expect(record.sourceLabel).toBe("Fitbit Charge 6");
    expect(prisma.healthDeviceImport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceLabel: "Fitbit Charge 6",
          participantId: "p1",
        }),
      }),
    );
  });

  it("requires source label for device import", async () => {
    await expect(
      importHealthDeviceData(
        {
          participantId: "p1",
          sourceLabel: "   ",
          payload: {},
        },
        "p1",
      ),
    ).rejects.toThrow("SOURCE_LABEL_REQUIRED");
  });

  it("revokes device import for participant", async () => {
    vi.mocked(prisma.healthDeviceImport.findUnique).mockResolvedValue({
      id: "import-1",
      participantId: "p1",
      sourceLabel: "Apple Watch",
      payloadJson: {},
      importedAt: new Date(),
      revokedAt: null,
    });
    vi.mocked(prisma.healthDeviceImport.update).mockResolvedValue({
      id: "import-1",
      participantId: "p1",
      sourceLabel: "Apple Watch",
      revokedAt: new Date(),
    } as never);

    const revoked = await revokeHealthDeviceImport({
      importId: "import-1",
      participantId: "p1",
      actorUserId: "p1",
    });

    expect(revoked.revokedAt).toBeTruthy();
  });

  it("prevents revoking another participant's import", async () => {
    vi.mocked(prisma.healthDeviceImport.findUnique).mockResolvedValue({
      id: "import-1",
      participantId: "p1",
      sourceLabel: "Garmin",
      revokedAt: null,
    } as never);

    await expect(
      revokeHealthDeviceImport({
        importId: "import-1",
        participantId: "p2",
        actorUserId: "p2",
      }),
    ).rejects.toThrow("PARTICIPANT_MISMATCH");
  });
});
