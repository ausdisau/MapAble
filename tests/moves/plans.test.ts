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
vi.mock("@/lib/prisma", () => ({
  prisma: {
    clinicalAuthor: { findUnique: vi.fn() },
    rehabilitationPlan: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    rehabilitationPlanVersion: { create: vi.fn(), findUnique: vi.fn() },
    planAcknowledgement: { upsert: vi.fn() },
    planReview: { create: vi.fn(), findMany: vi.fn() },
  },
}));

import {
  classifyClinicalAction,
  assertClinicalBoundaryAllowed,
} from "@/lib/moves/clinical-boundaries";
import {
  addVersion,
  attemptForbiddenClinicalAction,
  createPlan,
  requireClinicalAuthor,
} from "@/lib/moves/plans-service";
import { prisma } from "@/lib/prisma";

describe("moves plans service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires clinical author registration for plan creation", async () => {
    vi.mocked(prisma.clinicalAuthor.findUnique).mockResolvedValue(null);

    await expect(
      createPlan(
        {
          participantId: "p1",
          clinicianAuthorId: "c1",
          title: "Mobility plan",
        },
        "c1",
      ),
    ).rejects.toThrow("CLINICAL_AUTHOR_REQUIRED");
  });

  it("creates a plan when actor is a verified clinical author", async () => {
    vi.mocked(prisma.clinicalAuthor.findUnique).mockResolvedValue({
      id: "ca1",
      userId: "c1",
      profession: "physiotherapist",
      registrationRef: "PHY123",
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.rehabilitationPlan.create).mockResolvedValue({
      id: "plan-1",
      title: "Mobility plan",
      status: "draft",
      goals: [],
      versions: [{ version: 1 }],
      participant: { id: "p1", name: "Alex" },
      clinicianAuthor: { id: "c1", name: "Dr Sam" },
      _count: { activities: 0, reviews: 0 },
    } as never);

    const plan = await createPlan(
      {
        participantId: "p1",
        clinicianAuthorId: "c1",
        title: "Mobility plan",
        goals: ["Walk 100m with frame"],
      },
      "c1",
    );

    expect(plan.id).toBe("plan-1");
    expect(prisma.clinicalAuthor.findUnique).toHaveBeenCalledWith({
      where: { userId: "c1" },
    });
  });

  it("adds a version only for clinical authors", async () => {
    vi.mocked(prisma.clinicalAuthor.findUnique).mockResolvedValue({
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
      versions: [{ version: 1 }],
    } as never);
    vi.mocked(prisma.rehabilitationPlanVersion.create).mockResolvedValue({
      id: "v2",
      version: 2,
    } as never);

    const version = await addVersion(
      {
        planId: "plan-1",
        instructionsJson: { exercises: [] },
        changeSummary: "Updated seated exercises",
      },
      "c1",
    );

    expect(version.version).toBe(2);
  });

  it("denies forbidden clinical boundary actions", () => {
    expect(classifyClinicalAction("diagnose").allowed).toBe(false);
    expect(classifyClinicalAction("prescribe").allowed).toBe(false);
    expect(classifyClinicalAction("alter_treatment").allowed).toBe(false);
    expect(classifyClinicalAction("increase_intensity").allowed).toBe(false);

    expect(() => assertClinicalBoundaryAllowed("prescribe")).toThrow(
      "CLINICAL_BOUNDARY_VIOLATION:prescribe",
    );
  });

  it("attemptForbiddenClinicalAction throws for prescribe", async () => {
    await expect(attemptForbiddenClinicalAction("prescribe")).rejects.toThrow(
      "CLINICAL_BOUNDARY_VIOLATION:prescribe",
    );
  });

  it("allows non-clinical coordination actions", () => {
    expect(classifyClinicalAction("schedule_activity").allowed).toBe(true);
    expect(classifyClinicalAction("record_completion").allowed).toBe(true);
    expect(classifyClinicalAction("acknowledge_plan").allowed).toBe(true);
  });
});
