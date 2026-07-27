import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  careOSMissionCreate,
  careOSMissionEventCreate,
  careOSMissionEventFindUnique,
} = vi.hoisted(() => ({
  careOSMissionCreate: vi.fn(),
  careOSMissionEventCreate: vi.fn(),
  careOSMissionEventFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careOSMission: { create: careOSMissionCreate },
    careOSMissionEvent: {
      create: careOSMissionEventCreate,
      findUnique: careOSMissionEventFindUnique,
    },
  },
}));

import {
  appendMissionEvent,
  createCanonicalMission,
  toFabricMissionView,
} from "@/lib/careos/canonical-mission-service";

describe("canonical CareOS mission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates missions with required canonical fields", async () => {
    careOSMissionCreate.mockResolvedValue({
      id: "m1",
      participantId: "p1",
      requestId: "r1",
      missionType: "APPOINTMENT",
      desiredOutcome: "Attend appointment",
      status: "proposed",
      modulesJson: ["care", "transport"],
      createdAt: new Date("2026-07-14T00:00:00Z"),
      updatedAt: new Date("2026-07-14T00:00:00Z"),
    });

    await createCanonicalMission({
      participantId: "p1",
      requestId: "r1",
      missionType: "APPOINTMENT",
      desiredOutcome: "Attend appointment",
      modulesJson: ["care", "transport"],
    });

    expect(careOSMissionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        participantId: "p1",
        requestId: "r1",
        missionType: "APPOINTMENT",
        desiredOutcome: "Attend appointment",
        stateVersion: 1,
      }),
    });
  });

  it("maps fabric compatibility view from desiredOutcome and modulesJson", () => {
    const view = toFabricMissionView({
      id: "m1",
      participantId: "p1",
      tenantId: null,
      requestId: "r1",
      missionType: "CAREOS_NETWORK",
      desiredOutcome: "Get to clinic",
      status: "ready",
      authorityDecisionId: null,
      inputSummary: {},
      graphJson: {},
      modulesJson: ["care", "transport"],
      alertsJson: [],
      proposalsJson: [],
      stateVersion: 2,
      correlationId: "r1",
      workflowRunId: null,
      createdAt: new Date("2026-07-14T00:00:00Z"),
      updatedAt: new Date("2026-07-14T00:00:00Z"),
    });

    expect(view.goal).toBe("Get to clinic");
    expect(view.modules).toEqual(["care", "transport"]);
  });

  it("is idempotent for mission events with the same eventKey", async () => {
    careOSMissionEventFindUnique.mockResolvedValue({ id: "existing" });
    const event = await appendMissionEvent({
      missionId: "m1",
      participantId: "p1",
      eventType: "worker_cancelled",
      sourceModule: "care",
      summary: "Worker cancelled",
      eventKey: "worker_cancelled:care:shift-1",
    });
    expect(event.id).toBe("existing");
    expect(careOSMissionEventCreate).not.toHaveBeenCalled();
  });
});
