import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/act/handoff/service", () => ({
  createActHandoffFromHitl: vi.fn(),
  getActHandoffForTenant: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    navigatorDecisionPassport: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    navigatorGovernedMemoryItem: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { createActHandoffFromHitl } from "@/lib/act/handoff/service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  createNavigatorEscalation,
  EMERGENCY_GUIDANCE_AU,
} from "@/lib/ai/navigator/escalation/service";
import {
  assertApprovedMemoryCategory,
  deleteMemoryItem,
  upsertMemoryItem,
  withdrawMemoryItem,
} from "@/lib/ai/navigator/memory/service";
import {
  correctDecisionPassport,
  createDecisionPassport,
  getDecisionPassport,
  setAiOptOut,
} from "@/lib/ai/navigator/passport/service";
import {
  isNavigatorMemoryEnabled,
  isNavigatorPassportEnabled,
  isNavigatorPilotEnabled,
} from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

function basePassportRow(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: "pass-1",
    tenantId: "tenant-1",
    participantId: "p1",
    actorUserId: "p1",
    sessionId: "sess-1",
    goalSummary: "Find a support worker nearby",
    interpretationJson: { summary: "Support worker in Sydney" },
    hardConstraintsJson: [{ label: "Wheelchair access" }],
    rankingWeightsJson: { proximity: 0.5 },
    sourcesJson: [{ label: "NDIS register" }],
    shortlistJson: [
      { id: "o1", label: "Outlet One", factors: ["nearby"] },
    ],
    uncertaintyNotes: [],
    limitationsNotes: [],
    conflictsOfInterest: [],
    aiInvolved: true,
    modelIndependentRules: ["hard_filter_registration"],
    nextStep: "Review shortlist",
    nextStepController: "participant",
    consentedPurpose: "navigator.provider_search",
    consentRecordId: "consent-1",
    aiOptedOut: false,
    status: "active",
    correlationId: "corr-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function clearPilotEnv() {
  delete process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED;
  delete process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT;
  delete process.env.MAPABLE_NAVIGATOR_PILOT_MEMORY;
  delete process.env.MAPABLE_NAVIGATOR_PILOT_ENVELOPES;
  delete process.env.MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED;
  delete process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING;
}

describe("Navigator Phase 2 — flags default false", () => {
  beforeEach(() => {
    clearPilotEnv();
  });

  afterEach(() => {
    clearPilotEnv();
  });

  it("keeps pilot, passport, and memory flags off by default", () => {
    expect(isNavigatorPilotEnabled()).toBe(false);
    expect(isNavigatorPassportEnabled()).toBe(false);
    expect(isNavigatorMemoryEnabled()).toBe(false);
  });

  it("refuses passport create when flag is off", async () => {
    await expect(
      createDecisionPassport({
        tenantId: "t1",
        participantId: "p1",
        actorUserId: "p1",
        sessionId: "s1",
        goalSummary: "Find support",
        consentedPurpose: "navigator.provider_search",
      }),
    ).rejects.toThrow("NAVIGATOR_PASSPORT_DISABLED");
  });

  it("refuses memory upsert when flag is off", async () => {
    await expect(
      upsertMemoryItem({
        tenantId: "t1",
        participantId: "p1",
        creatingActorId: "p1",
        purpose: "navigator.provider_search",
        category: "explicit_preference",
        contentSummary: "Prefers mornings",
        provenance: "participant_stated",
      }),
    ).rejects.toThrow("NAVIGATOR_MEMORY_DISABLED");
  });
});

describe("Navigator Phase 2 — Decision Passport", () => {
  beforeEach(() => {
    clearPilotEnv();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_PASSPORT = "true";
    vi.mocked(prisma.navigatorDecisionPassport.create).mockReset();
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockReset();
    vi.mocked(prisma.navigatorDecisionPassport.update).mockReset();
    vi.mocked(createAuditEvent).mockClear();
  });

  afterEach(() => {
    clearPilotEnv();
  });

  it("creates a passport and audits navigator.passport.created", async () => {
    vi.mocked(prisma.navigatorDecisionPassport.create).mockResolvedValue(
      basePassportRow() as never,
    );

    const view = await createDecisionPassport({
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      sessionId: "sess-1",
      goalSummary: "Find a support worker nearby",
      interpretation: { summary: "Support worker in Sydney" },
      hardConstraints: [{ label: "Wheelchair access" }],
      rankingWeights: { proximity: 0.5 },
      sources: [{ label: "NDIS register" }],
      shortlist: [{ id: "o1", label: "Outlet One", factors: ["nearby"] }],
      aiInvolved: true,
      modelIndependentRules: ["hard_filter_registration"],
      consentedPurpose: "navigator.provider_search",
      consentRecordId: "consent-1",
    });

    expect(view.id).toBe("pass-1");
    expect(view.goal).toBe("Find a support worker nearby");
    expect(view.routes.continueWithoutAi).toBe("/provider-finder");
    expect(view.routes.optOut).toBe("/api/navigator/pilot/opt-out");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "navigator.passport.created",
        entityId: "pass-1",
      }),
    );
  });

  it("denies cross-tenant / cross-participant get (IDOR)", async () => {
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue(
      null,
    );

    expect(
      await getDecisionPassport({
        id: "pass-1",
        tenantId: "other-tenant",
        participantId: "p1",
      }),
    ).toBeNull();

    expect(prisma.navigatorDecisionPassport.findFirst).toHaveBeenCalledWith({
      where: {
        id: "pass-1",
        tenantId: "other-tenant",
        participantId: "p1",
      },
    });
  });

  it("applies participant correction", async () => {
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue(
      basePassportRow() as never,
    );
    vi.mocked(prisma.navigatorDecisionPassport.update).mockResolvedValue(
      basePassportRow({
        status: "corrected",
        interpretationJson: {
          summary: "Support worker in Parramatta",
          correctionNote: "Wrong suburb",
        },
      }) as never,
    );

    const view = await correctDecisionPassport({
      id: "pass-1",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      interpretation: { summary: "Support worker in Parramatta" },
      note: "Wrong suburb",
    });

    expect(view.status).toBe("corrected");
    expect(view.interpretation.summary).toBe("Support worker in Parramatta");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "navigator.passport.corrected" }),
    );
  });

  it("sets AI opt-out without deleting the passport", async () => {
    vi.mocked(prisma.navigatorDecisionPassport.findFirst).mockResolvedValue(
      basePassportRow() as never,
    );
    vi.mocked(prisma.navigatorDecisionPassport.update).mockResolvedValue(
      basePassportRow({ aiOptedOut: true }) as never,
    );

    const view = await setAiOptOut({
      id: "pass-1",
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
    });

    expect(view.aiOptedOut).toBe(true);
    expect(view.id).toBe("pass-1");
    expect(prisma.navigatorDecisionPassport.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ aiOptedOut: true }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "navigator.passport.ai_opt_out",
        metadata: expect.objectContaining({ retained: true }),
      }),
    );
  });
});

describe("Navigator Phase 2 — governed memory", () => {
  beforeEach(() => {
    clearPilotEnv();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_MEMORY = "true";
    vi.mocked(prisma.navigatorGovernedMemoryItem.create).mockReset();
    vi.mocked(prisma.navigatorGovernedMemoryItem.findFirst).mockReset();
    vi.mocked(prisma.navigatorGovernedMemoryItem.update).mockReset();
    vi.mocked(createAuditEvent).mockClear();
  });

  afterEach(() => {
    clearPilotEnv();
  });

  it("rejects forbidden memory category labels", () => {
    expect(() => assertApprovedMemoryCategory("diagnosis")).toThrow(
      /NAVIGATOR_MEMORY_FORBIDDEN_CATEGORY/,
    );
    expect(() => assertApprovedMemoryCategory("emotion")).toThrow(
      /NAVIGATOR_MEMORY_FORBIDDEN_CATEGORY/,
    );
    expect(() => assertApprovedMemoryCategory("inferred_capacity")).toThrow(
      /NAVIGATOR_MEMORY_FORBIDDEN_CATEGORY/,
    );
    expect(() => assertApprovedMemoryCategory("clinical_assessment")).toThrow(
      /NAVIGATOR_MEMORY_FORBIDDEN_CATEGORY/,
    );
    expect(() =>
      assertApprovedMemoryCategory("explicit_preference"),
    ).not.toThrow();
  });

  it("rejects forbidden categories on upsert", async () => {
    await expect(
      upsertMemoryItem({
        tenantId: "t1",
        participantId: "p1",
        creatingActorId: "p1",
        purpose: "navigator.provider_search",
        category: "diagnosis",
        contentSummary: "Has condition X",
        provenance: "inferred",
      }),
    ).rejects.toThrow();
  });

  it("withdraws and soft-deletes memory items", async () => {
    const now = new Date();
    const existing = {
      id: "mem-1",
      tenantId: "t1",
      participantId: "p1",
      purpose: "navigator.provider_search",
      category: "explicit_preference",
      contentSummary: "Prefers mornings",
      provenance: "participant_stated",
      verification: "participant_stated",
      creatingActorId: "p1",
      consentRecordId: null,
      confidence: "stated",
      expiresAt: null,
      correctedAt: null,
      withdrawnAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      reviewedAt: null,
    };

    vi.mocked(prisma.navigatorGovernedMemoryItem.findFirst).mockResolvedValue(
      existing as never,
    );
    vi.mocked(prisma.navigatorGovernedMemoryItem.update).mockResolvedValueOnce({
      ...existing,
      verification: "withdrawn",
      withdrawnAt: now,
    } as never);

    const withdrawn = await withdrawMemoryItem({
      id: "mem-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
    });
    expect(withdrawn.verification).toBe("withdrawn");
    expect(withdrawn.withdrawnAt).toBeTruthy();

    vi.mocked(prisma.navigatorGovernedMemoryItem.findFirst).mockResolvedValue({
      ...existing,
      withdrawnAt: now,
      verification: "withdrawn",
    } as never);
    vi.mocked(prisma.navigatorGovernedMemoryItem.update).mockResolvedValueOnce({
      ...existing,
      verification: "deleted",
      deletedAt: now,
    } as never);

    const deleted = await deleteMemoryItem({
      id: "mem-1",
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
    });
    expect(deleted.verification).toBe("deleted");
    expect(deleted.deletedAt).toBeTruthy();
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "navigator.memory.withdrawn" }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "navigator.memory.deleted" }),
    );
  });
});

describe("Navigator Phase 2 — escalation", () => {
  beforeEach(() => {
    clearPilotEnv();
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    vi.mocked(createActHandoffFromHitl).mockReset();
    vi.mocked(createAuditEvent).mockClear();
    vi.mocked(prisma.navigatorDecisionPassport.updateMany).mockReset();
  });

  afterEach(() => {
    clearPilotEnv();
  });

  it("requires tenant id", async () => {
    await expect(
      createNavigatorEscalation({
        tenantId: "",
        participantId: "p1",
        actorUserId: "p1",
        reason: "participant_request",
      }),
    ).rejects.toThrow("NAVIGATOR_ESCALATION_TENANT_REQUIRED");
  });

  it("returns emergency guidance for immediate_danger and creates handoff", async () => {
    vi.mocked(createActHandoffFromHitl).mockResolvedValue({
      id: "handoff-1",
      status: "pending",
    } as never);

    const result = await createNavigatorEscalation({
      tenantId: "tenant-1",
      participantId: "p1",
      actorUserId: "p1",
      reason: "immediate_danger",
      note: "Caller described immediate danger",
    });

    expect(result.emergencyGuidance).toBe(EMERGENCY_GUIDANCE_AU);
    expect(result.emergencyGuidance).toContain("000");
    expect(result.handoffId).toBe("handoff-1");
    expect(createActHandoffFromHitl).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        participantId: "p1",
        toolName: "navigator.provider_search.escalate",
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "navigator.escalation.created",
        metadata: expect.objectContaining({
          emergencyGuidanceReturned: true,
        }),
      }),
    );
  });
});
