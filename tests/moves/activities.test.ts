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
vi.mock("@/lib/prisma", () => ({
  prisma: {
    rehabilitationPlan: { findUnique: vi.fn() },
    rehabilitationActivity: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { COMPLETION_NOT_IMPROVEMENT_DISCLAIMER } from "@/lib/moves/clinical-boundaries";
import {
  completeActivity,
  scheduleActivity,
} from "@/lib/moves/activities-service";
import { prisma } from "@/lib/prisma";

describe("moves activities service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not mark completion as clinical improvement", async () => {
    vi.mocked(prisma.rehabilitationActivity.findUnique).mockResolvedValue({
      id: "act-1",
      status: "scheduled",
      plan: { id: "plan-1", participantId: "p1", title: "Plan", status: "active" },
    } as never);
    vi.mocked(prisma.rehabilitationActivity.update).mockResolvedValue({
      id: "act-1",
      status: "completed",
      plan: { id: "plan-1", participantId: "p1", title: "Plan", status: "active" },
    } as never);

    const result = await completeActivity({
      activityId: "act-1",
      participantId: "p1",
      participantFeedback: "Felt okay",
    });

    expect(result.clinicalImprovementClaimed).toBe(false);
    expect(result.disclaimer).toBe(COMPLETION_NOT_IMPROVEMENT_DISCLAIMER);
    expect(result.activity.status).toBe("completed");
  });

  it("rejects completion when participant does not match", async () => {
    vi.mocked(prisma.rehabilitationActivity.findUnique).mockResolvedValue({
      id: "act-1",
      status: "scheduled",
      plan: { id: "plan-1", participantId: "p1", title: "Plan", status: "active" },
    } as never);

    await expect(
      completeActivity({
        activityId: "act-1",
        participantId: "other-participant",
      }),
    ).rejects.toThrow("PARTICIPANT_MISMATCH");
  });

  it("schedules activities via clinical author pathway", async () => {
    const { requireClinicalAuthor } = await import("@/lib/moves/plans-service");
    vi.mocked(requireClinicalAuthor).mockResolvedValue({
      id: "ca1",
      userId: "c1",
      profession: "physiotherapist",
      registrationRef: null,
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.rehabilitationPlan.findUnique).mockResolvedValue({
      id: "plan-1",
      participantId: "p1",
    } as never);
    vi.mocked(prisma.rehabilitationActivity.create).mockResolvedValue({
      id: "act-1",
      title: "Seated stretches",
      status: "scheduled",
      plan: { id: "plan-1", participantId: "p1", title: "Plan", status: "active" },
    } as never);

    const activity = await scheduleActivity(
      {
        planId: "plan-1",
        title: "Seated stretches",
        instructionsAccessible: "Gently stretch arms for 30 seconds.",
      },
      "c1",
    );

    expect(activity.title).toBe("Seated stretches");
    expect(requireClinicalAuthor).toHaveBeenCalledWith("c1");
  });
});
