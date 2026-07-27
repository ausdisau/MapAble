import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/support-coordination", () => ({
  supportCoordinationConfig: {
    enabled: true,
    enquiriesEnabled: false,
    evidencePacksEnabled: true,
    supervisionEnabled: false,
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
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coordinationCase: { findUnique: vi.fn() },
    evidenceRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    evidencePack: { create: vi.fn() },
  },
}));

import {
  addClaimWithProvenance,
  buildPack,
  createEvidenceRequest,
} from "@/lib/support-coordination/evidence-pack-service";
import { prisma } from "@/lib/prisma";

describe("evidence packs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.coordinationCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "p1",
    } as never);
  });

  it("creates evidence request for plan review", async () => {
    vi.mocked(prisma.evidenceRequest.create).mockResolvedValue({
      id: "req-1",
      purpose: "plan_review",
      status: "requested",
    } as never);

    const request = await createEvidenceRequest(
      {
        caseId: "case-1",
        participantId: "p1",
        purpose: "plan_review",
      },
      "c1",
    );

    expect(request.purpose).toBe("plan_review");
  });

  it("requires sourceRef for every claim", async () => {
    vi.mocked(prisma.evidenceRequest.findUnique).mockResolvedValue({
      id: "req-1",
      caseId: "case-1",
      provenanceJson: [],
    } as never);

    await expect(
      addClaimWithProvenance({
        requestId: "req-1",
        claim: { statement: "Goal met", sourceRef: "" },
        actorUserId: "c1",
      }),
    ).rejects.toThrow("EVIDENCE_SOURCE_REF_REQUIRED");
  });

  it("adds claim with provenance", async () => {
    vi.mocked(prisma.evidenceRequest.findUnique).mockResolvedValue({
      id: "req-1",
      caseId: "case-1",
      provenanceJson: [],
    } as never);
    vi.mocked(prisma.evidenceRequest.update).mockResolvedValue({
      id: "req-1",
      status: "partially_fulfilled",
      provenanceJson: [
        { statement: "Goal met", sourceRef: "doc:abc123" },
      ],
    } as never);

    const updated = await addClaimWithProvenance({
      requestId: "req-1",
      claim: { statement: "Goal met", sourceRef: "doc:abc123" },
      actorUserId: "c1",
    });

    expect(updated.status).toBe("partially_fulfilled");
  });

  it("builds evidence pack from fulfilled requests", async () => {
    vi.mocked(prisma.evidenceRequest.findMany).mockResolvedValue([
      {
        id: "req-1",
        provenanceJson: [
          { statement: "Supports in place", sourceRef: "plan:2026" },
        ],
      },
    ] as never);
    vi.mocked(prisma.evidencePack.create).mockResolvedValue({
      id: "pack-1",
      packType: "plan_review",
      claimsJson: [
        { statement: "Supports in place", sourceRef: "plan:2026" },
      ],
    } as never);

    const pack = await buildPack({
      caseId: "case-1",
      packType: "plan_review",
      actorUserId: "c1",
    });

    expect(pack.packType).toBe("plan_review");
  });
});
