import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantAuthorityGrant: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/programmes/audit", () => ({
  emitProgrammeAuditEvent: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { evaluateParticipantAuthority } from "@/lib/programmes/authority/participant-authority-service";
import { programmeFoundationFixtures } from "@/tests/fixtures/programme-foundation";

describe("participant authority evaluation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows participant to access own data", async () => {
    const result = await evaluateParticipantAuthority({
      participantId: programmeFoundationFixtures.participantId,
      actorUserId: programmeFoundationFixtures.participantId,
      purpose: "view_calendar",
      requestedFields: ["calendar.events"],
    });

    expect(result.allowed).toBe(true);
    expect(result.allowedFields).toContain("calendar.events");
    expect(prisma.participantAuthorityGrant.findMany).not.toHaveBeenCalled();
  });

  it("denies supporter without matching grant", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findMany).mockResolvedValue([]);

    const result = await evaluateParticipantAuthority({
      participantId: programmeFoundationFixtures.participantId,
      actorUserId: programmeFoundationFixtures.supporterId,
      purpose: "view_calendar",
      requestedFields: ["calendar.events"],
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("allows supporter with matching scoped grant", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findMany).mockResolvedValue([
      {
        id: "grant-1",
        participantId: programmeFoundationFixtures.participantId,
        granteeUserId: programmeFoundationFixtures.supporterId,
        granteeOrganisationId: null,
        purpose: "view_calendar",
        allowedFields: ["calendar.events"],
        allowedActions: ["view"],
        status: "active",
        consentRecordId: null,
        expiresAt: null,
        createdById: programmeFoundationFixtures.participantId,
        revokedById: null,
        revokedAt: null,
        correlationId: "corr-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await evaluateParticipantAuthority({
      participantId: programmeFoundationFixtures.participantId,
      actorUserId: programmeFoundationFixtures.supporterId,
      purpose: "view_calendar",
      requestedFields: ["calendar.events"],
      requestedAction: "view",
    });

    expect(result.allowed).toBe(true);
    expect(result.grantId).toBe("grant-1");
  });
});

describe("source registry fixtures", () => {
  it("warns on draft mock sources", async () => {
    const { getFixtureProgrammeSourceAdapter } =
      await import("@/lib/programmes");
    const adapter = getFixtureProgrammeSourceAdapter();
    const sources = await adapter.searchSources({ programmeId: "pathways" });
    expect(sources.length).toBeGreaterThan(0);

    const draft = sources.find((s) => s.authorityStatus === "draft");
    expect(draft).toBeDefined();

    const warning = await adapter.getSupersessionWarning(draft!.id);
    expect(warning.message).toMatch(/Draft|MOCK/i);
  });
});
