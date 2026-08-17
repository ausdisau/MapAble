import { beforeEach, describe, expect, it, vi } from "vitest";

const actHandoffCreate = vi.fn();
const actHandoffFindFirst = vi.fn();
const actHandoffFindUnique = vi.fn();
const actHandoffFindMany = vi.fn();
const actHandoffUpdate = vi.fn();
const userFindFirst = vi.fn();
const tenantMembershipFindMany = vi.fn();
const createNotification = vi.fn();
const createAuditEvent = vi.fn();
const commitAction = vi.fn();

vi.mock("@/lib/notifications/notification-service", () => ({
  createNotification: (args: unknown) => createNotification(args),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: (args: unknown) => createAuditEvent(args),
}));

vi.mock("@/lib/aura-harness/memory-store", () => ({
  vectorMemoryStore: {
    commitAction: (...args: unknown[]) => commitAction(...args),
  },
}));

vi.mock("@/lib/db/transaction-service", () => ({
  runInTransaction: async <T>(fn: (tx: unknown) => Promise<T>) =>
    fn({
      actHandoff: {
        findFirst: (...args: unknown[]) => actHandoffFindFirst(...args),
        create: (...args: unknown[]) => actHandoffCreate(...args),
      },
      user: {
        findFirst: (...args: unknown[]) => userFindFirst(...args),
      },
      tenantMembership: {
        findMany: (...args: unknown[]) => tenantMembershipFindMany(...args),
      },
    }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    actHandoff: {
      findUnique: (...args: unknown[]) => actHandoffFindUnique(...args),
      findFirst: (...args: unknown[]) => actHandoffFindFirst(...args),
      findMany: (...args: unknown[]) => actHandoffFindMany(...args),
      update: (...args: unknown[]) => actHandoffUpdate(...args),
    },
  },
}));

describe("A2H tenant hardening", () => {
  beforeEach(() => {
    vi.resetModules();
    actHandoffCreate.mockReset();
    actHandoffFindFirst.mockReset();
    actHandoffFindUnique.mockReset();
    actHandoffFindMany.mockReset();
    actHandoffUpdate.mockReset();
    userFindFirst.mockReset();
    tenantMembershipFindMany.mockReset();
    createNotification.mockReset();
    createAuditEvent.mockReset();
    commitAction.mockReset();
    createNotification.mockResolvedValue({ id: "n1" });
    createAuditEvent.mockResolvedValue(undefined);
    commitAction.mockResolvedValue(undefined);
    actHandoffFindFirst.mockResolvedValue(null);
    tenantMembershipFindMany.mockResolvedValue([{ userId: "assignee-1" }]);
    userFindFirst.mockResolvedValue({ id: "assignee-1" });
    actHandoffCreate.mockImplementation(
      async (args: { data: Record<string, unknown> }) => ({
        id: "handoff-1",
        ...args.data,
        createdAt: new Date(),
        resolvedAt: null,
        resolveNote: null,
      }),
    );
    process.env.MAPABLE_AURA_HARNESS_ENABLED = "true";
    process.env.MAPABLE_A2H_HANDOFF_ENABLED = "true";
  });

  it("stores tenantId and participantId on create", async () => {
    const { createActHandoffFromHitl } = await import(
      "@/lib/act/handoff/service"
    );
    const handoff = await createActHandoffFromHitl({
      fingerprint: "fp-1",
      toolName: "ndis_search",
      payload: { q: "support" },
      decision: {
        outcome: "HITL_PENDING",
        policyAction: "REQUIRE_HITL",
        reason: "elevated risk",
        guardrailIds: ["test"],
        profile: {
          actionId: "fp-1",
          rawGamma: 60,
          normalizedGamma: 60,
          variance: 0,
          concentrationCoeff: 10,
          requiresHITL: true,
          highGamma: true,
          highConcentration: false,
        },
      },
      requesterUserId: "requester-1",
      tenantId: "tenant-a",
      participantId: "participant-1",
    });

    expect(handoff?.tenantId).toBe("tenant-a");
    expect(handoff?.participantId).toBe("participant-1");
    expect(actHandoffCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: "tenant-a",
          participantId: "participant-1",
        }),
      }),
    );
  });

  it("blocks cross-tenant resolve and forbids non-assignee approve", async () => {
    const { resolveActHandoff } = await import("@/lib/act/handoff/service");
    actHandoffFindUnique.mockResolvedValue({
      id: "handoff-1",
      status: "pending",
      tenantId: "tenant-a",
      participantId: "participant-1",
      requesterUserId: "requester-1",
      assigneeUserId: "assignee-1",
      fingerprint: "fp-1",
      toolName: "ndis_search",
      payloadJson: {},
      gamma: 60,
      cConc: 10,
    });

    await expect(
      resolveActHandoff({
        handoffId: "handoff-1",
        actorUserId: "assignee-1",
        decision: "approve",
        tenantId: "tenant-b",
      }),
    ).rejects.toThrow("ACT_HANDOFF_TENANT_MISMATCH");

    await expect(
      resolveActHandoff({
        handoffId: "handoff-1",
        actorUserId: "stranger",
        decision: "approve",
        tenantId: "tenant-a",
      }),
    ).rejects.toThrow("ACT_HANDOFF_FORBIDDEN");
  });

  it("lists only tenant-scoped handoffs for the actor", async () => {
    const { listActHandoffsForTenant } = await import(
      "@/lib/act/handoff/service"
    );
    actHandoffFindMany.mockResolvedValue([{ id: "h1" }]);
    await listActHandoffsForTenant({
      tenantId: "tenant-a",
      actorUserId: "assignee-1",
    });
    expect(actHandoffFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: "tenant-a",
        }),
      }),
    );
  });
});
