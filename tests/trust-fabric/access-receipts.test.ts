import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createMock,
  findManyMock,
  findUniqueMock,
  updateMock,
  auditMock,
  consentFindMock,
} = vi.hoisted(() => ({
  createMock: vi.fn(),
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  updateMock: vi.fn(),
  auditMock: vi.fn(),
  consentFindMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    participantAccessReceipt: {
      create: createMock,
      findMany: findManyMock,
      findUnique: findUniqueMock,
      update: updateMock,
    },
    consentRecord: {
      findUnique: consentFindMock,
      findMany: vi.fn().mockResolvedValue([]),
    },
    accessibilityProfile: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    careServiceLog: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    transportTrip: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    breakGlassAccessSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    decisionNoticeRecord: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

vi.mock("@/lib/communication-passport/service", () => ({
  getCommunicationPassport: vi.fn().mockResolvedValue({
    version: 1,
    modes: ["speech"],
  }),
}));

import {
  challengeAccessReceipt,
  listParticipantAccessHistory,
  recordPurposeBoundAccessReceipt,
  TrustFabricError,
} from "@/lib/trust-fabric/receipt-service";
import { createDecisionNotice } from "@/lib/trust-fabric/decision-notice";
import { exportParticipantTrustBundle } from "@/lib/trust-fabric/export-service";

beforeEach(() => {
  vi.clearAllMocks();
  process.env.MAPABLE_TRUST_FABRIC_ENABLED = "true";
  process.env.MAPABLE_PARTICIPANT_ACCESS_HISTORY_ENABLED = "true";
  createMock.mockResolvedValue({
    id: "receipt-1",
    correlationId: "corr-1",
  });
  auditMock.mockResolvedValue(undefined);
});

describe("purpose-bound access receipts", () => {
  it("records receipt with categories and emits audit", async () => {
    const result = await recordPurposeBoundAccessReceipt({
      actorUserId: "worker-1",
      participantId: "taylor-1",
      organisationId: "org-1",
      purpose: "prepare_support_visit",
      fieldCategories: ["communication_preferences"],
      authoritySource: "consent",
      consentRecordId: "consent-1",
      outcome: "disclosed",
    });

    expect(result?.id).toBe("receipt-1");
    expect(createMock).toHaveBeenCalled();
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "trust_fabric.access_receipt.created",
        participantId: "taylor-1",
      }),
    );
  });

  it("no-ops when flag off", async () => {
    process.env.MAPABLE_TRUST_FABRIC_ENABLED = "false";
    const result = await recordPurposeBoundAccessReceipt({
      actorUserId: "worker-1",
      participantId: "taylor-1",
      purpose: "prepare_support_visit",
      fieldCategories: ["communication_preferences"],
      authoritySource: "consent",
      outcome: "disclosed",
    });
    expect(result).toBeNull();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects empty purpose", async () => {
    await expect(
      recordPurposeBoundAccessReceipt({
        participantId: "taylor-1",
        purpose: "  ",
        fieldCategories: ["communication_preferences"],
        authoritySource: "consent",
        outcome: "disclosed",
      }),
    ).rejects.toBeInstanceOf(TrustFabricError);
  });
});

describe("participant access history IDOR", () => {
  it("allows participant to view own history", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "r1",
        purpose: "visit prep",
        fieldCategories: ["communication_preferences"],
        authoritySource: "consent",
        consentRecordId: "c1",
        expiresAt: null,
        outcome: "disclosed",
        challengedAt: null,
        createdAt: new Date("2026-07-17T00:00:00Z"),
        actorUser: { id: "w1", name: "Alex Worker" },
        organisation: { id: "o1", name: "Harbour Supports" },
      },
    ]);
    consentFindMock.mockResolvedValue({ status: "active", expiryDate: null });

    const history = await listParticipantAccessHistory("taylor-1", "taylor-1");
    expect(history).toHaveLength(1);
    expect(history[0]?.actorDisplayName).toBe("Alex Worker");
    expect(history[0]?.authorityActive).toBe(true);
  });

  it("denies cross-participant history", async () => {
    await expect(
      listParticipantAccessHistory("taylor-1", "other-user"),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe("challenge and decision notice", () => {
  it("challenges own receipt", async () => {
    findUniqueMock.mockResolvedValue({
      id: "r1",
      participantId: "taylor-1",
      challengedAt: null,
      consentRecordId: "c1",
      organisationId: "o1",
      correlationId: "corr",
      outcome: "disclosed",
    });
    updateMock.mockResolvedValue({});

    const result = await challengeAccessReceipt({
      receiptId: "r1",
      participantId: "taylor-1",
      note: "Please stop sharing with this worker",
    });
    expect(result.consentRevokeSuggested).toBe(true);
    expect(updateMock).toHaveBeenCalled();
  });

  it("creates decision notice without chain-of-thought", async () => {
    const { prisma } = await import("@/lib/prisma");
    (prisma.decisionNoticeRecord.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "dn-1",
      decision: "worker_not_ready",
      responsibleSystem: "workforce-readiness",
      reasonCodes: ["credential_expired"],
      evidenceRefs: ["cred-1"],
      unknowns: [],
      humanOwnerUserId: "admin-1",
      participantId: "taylor-1",
      organisationId: "org-1",
      reviewPath: "/dashboard/access-history",
      correctionPath: "/dashboard/consent",
      correlationId: "corr-dn",
      createdAt: new Date(),
    });

    const notice = await createDecisionNotice({
      decision: "worker_not_ready",
      responsibleSystem: "workforce-readiness",
      reasonCodes: ["credential_expired"],
      evidenceRefs: ["cred-1"],
      humanOwnerUserId: "admin-1",
      participantId: "taylor-1",
      organisationId: "org-1",
      reviewPath: "/dashboard/access-history",
      correctionPath: "/dashboard/consent",
    });

    expect(notice?.includesModelChainOfThought).toBe(false);
    expect(notice?.reasonCodes).toContain("credential_expired");
  });
});

describe("portability export", () => {
  it("exports own bundle and denies others", async () => {
    findManyMock.mockResolvedValue([]);
    await expect(
      exportParticipantTrustBundle("taylor-1", "other"),
    ).rejects.toMatchObject({ status: 403 });

    const bundle = await exportParticipantTrustBundle("taylor-1", "taylor-1");
    expect(bundle.publicClaimState).toBe("internal_alpha");
    expect(bundle.participantId).toBe("taylor-1");
    expect(createMock).toHaveBeenCalled();
  });
});
