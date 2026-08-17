import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/support-coordination", () => ({
  supportCoordinationConfig: {
    enabled: true,
    enquiriesEnabled: true,
    evidencePacksEnabled: true,
    supervisionEnabled: true,
    fundingDecisionEnabled: false,
    capacityDeterminationEnabled: false,
    automaticProviderSelectionEnabled: false,
  },
  ensureSupportCoordinationEnabled: vi.fn(),
}));
vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));
vi.mock("@/lib/support-coordinator/consent-gate", () => ({
  requireCoordinatorAuthority: vi.fn(),
  hasCoordinatorAuthority: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coordinationCase: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    coordinationCaseAssignment: { create: vi.fn() },
    coordinationCaseNote: { create: vi.fn() },
    coordinationTask: {
      create: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

import {
  addNote,
  addTask,
  createCase,
  listCaseload,
  setPriority,
} from "@/lib/support-coordination/coordination-case-service";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorAuthority } from "@/lib/support-coordinator/consent-gate";

describe("support coordination domain", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a coordination case with operational priority", async () => {
    vi.mocked(prisma.coordinationCase.create).mockResolvedValue({
      id: "case-1",
      title: "Plan review",
      operationalPriority: "high",
      participant: { id: "p1", name: "Alex" },
      coordinator: { id: "c1", name: "Sam" },
      tasks: [],
      assignments: [],
      _count: { notes: 0, enquiries: 0, evidenceRequests: 0 },
    } as never);

    const created = await createCase(
      {
        participantId: "p1",
        coordinatorId: "c1",
        title: "Plan review",
        operationalPriority: "high",
      },
      "c1",
    );

    expect(created.operationalPriority).toBe("high");
    expect(requireCoordinatorAuthority).toHaveBeenCalledWith(
      expect.objectContaining({ participantId: "p1", coordinatorId: "c1" }),
    );
  });

  it("lists caseload with waiting-on indicators", async () => {
    vi.mocked(prisma.coordinationCase.findMany).mockResolvedValue([
      {
        id: "case-1",
        title: "Service continuity",
        tasks: [{ id: "t1", status: "open", waitingOn: "provider" }],
      },
    ] as never);
    vi.mocked(prisma.coordinationTask.groupBy).mockResolvedValue([
      { caseId: "case-1", _count: { _all: 1 } },
    ] as never);

    const caseload = await listCaseload("c1");
    expect(caseload[0].waitingOnTaskCount).toBe(1);
  });

  it("adds internal notes without overwriting participant accounts", async () => {
    vi.mocked(prisma.coordinationCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "p1",
    } as never);
    vi.mocked(prisma.coordinationCaseNote.create).mockResolvedValue({
      id: "note-1",
      visibility: "internal",
      body: "Coordinator note only",
    } as never);

    const note = await addNote({
      caseId: "case-1",
      authorId: "c1",
      body: "Coordinator note only",
      visibility: "internal",
    });

    expect(note.visibility).toBe("internal");
    expect(prisma.coordinationCaseNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: "internal" }),
      }),
    );
  });

  it("adds tasks with waiting-on field", async () => {
    vi.mocked(prisma.coordinationCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "p1",
    } as never);
    vi.mocked(prisma.coordinationTask.create).mockResolvedValue({
      id: "task-1",
      waitingOn: "participant",
    } as never);

    const task = await addTask({
      caseId: "case-1",
      title: "Collect report",
      createdById: "c1",
      waitingOn: "participant",
    });

    expect(task.waitingOn).toBe("participant");
  });

  it("sets operational priority without funding side-effects", async () => {
    vi.mocked(prisma.coordinationCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "p1",
    } as never);
    vi.mocked(prisma.coordinationCase.update).mockResolvedValue({
      id: "case-1",
      operationalPriority: "urgent",
    } as never);

    const updated = await setPriority({
      caseId: "case-1",
      operationalPriority: "urgent",
      actorUserId: "c1",
    });

    expect(updated.operationalPriority).toBe("urgent");
  });
});
