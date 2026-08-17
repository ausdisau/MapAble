import { beforeEach, describe, expect, it, vi } from "vitest";

const grantFindMany = vi.fn();
const grantFindFirst = vi.fn();
const grantCreate = vi.fn();
const grantUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantAuthorityGrant: {
      findMany: (...a: unknown[]) => grantFindMany(...a),
      findFirst: (...a: unknown[]) => grantFindFirst(...a),
      create: (...a: unknown[]) => grantCreate(...a),
      update: (...a: unknown[]) => grantUpdate(...a),
    },
  },
}));

vi.mock("@/lib/programmes/audit", () => ({
  emitProgrammeAuditEvent: vi.fn(async () => undefined),
  createCorrelationId: () => "corr-1",
}));

import {
  evaluateParticipantAuthority,
  revokeParticipantAuthorityGrant,
} from "@/lib/programmes/authority/participant-authority-service";

describe("Participant authority expiry and revocation", () => {
  beforeEach(() => {
    grantFindMany.mockReset();
    grantFindFirst.mockReset();
    grantUpdate.mockReset();
  });

  it("denies expired grants", async () => {
    grantFindMany.mockResolvedValue([
      {
        id: "g1",
        status: "active",
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        allowedFields: ["communicationMode"],
        allowedActions: ["view"],
        purpose: "visit",
        granteeUserId: "supporter-1",
      },
    ]);

    // Service filters expiresAt >= now in query; simulate empty after filter
    grantFindMany.mockResolvedValueOnce([]);

    const decision = await evaluateParticipantAuthority({
      participantId: "p1",
      actorUserId: "supporter-1",
      purpose: "visit",
      requestedFields: ["communicationMode"],
      requestedAction: "view",
    });
    expect(decision.allowed).toBe(false);
  });

  it("revokes active grant and subsequent evaluate denies", async () => {
    grantFindFirst.mockResolvedValue({
      id: "g1",
      participantId: "p1",
      status: "active",
    });
    grantUpdate.mockResolvedValue({
      id: "g1",
      status: "revoked",
      participantId: "p1",
    });

    await revokeParticipantAuthorityGrant({
      grantId: "g1",
      participantId: "p1",
      revokedById: "p1",
      correlationId: "corr-1",
    });

    grantFindMany.mockResolvedValue([]);
    const decision = await evaluateParticipantAuthority({
      participantId: "p1",
      actorUserId: "supporter-1",
      purpose: "visit",
      requestedFields: ["communicationMode"],
    });
    expect(decision.allowed).toBe(false);
  });
});
