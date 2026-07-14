import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/support-coordination", () => ({
  supportCoordinationConfig: {
    enabled: true,
    enquiriesEnabled: true,
    evidencePacksEnabled: false,
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
    providerEnquiry: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import {
  createEnquiry,
  recordResponse,
  sendEnquiry,
  withdrawEnquiry,
} from "@/lib/support-coordination/provider-enquiry-service";
import { prisma } from "@/lib/prisma";

describe("provider enquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.coordinationCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "p1",
    } as never);
  });

  it("creates draft enquiry with disclosure preview", async () => {
    vi.mocked(prisma.providerEnquiry.create).mockResolvedValue({
      id: "enq-1",
      status: "draft",
      disclosurePreview: "Participant needs OT — age and suburb only.",
    } as never);

    const enquiry = await createEnquiry(
      {
        caseId: "case-1",
        participantId: "p1",
        providerName: "Acme Therapy",
        disclosurePreview: "Participant needs OT — age and suburb only.",
      },
      "c1",
    );

    expect(enquiry.status).toBe("draft");
    expect(enquiry.disclosurePreview).toContain("suburb");
  });

  it("sends enquiry from draft status", async () => {
    vi.mocked(prisma.providerEnquiry.findUnique).mockResolvedValue({
      id: "enq-1",
      caseId: "case-1",
      participantId: "p1",
      status: "draft",
    } as never);
    vi.mocked(prisma.providerEnquiry.update).mockResolvedValue({
      id: "enq-1",
      status: "sent",
    } as never);

    const sent = await sendEnquiry("enq-1", "c1");
    expect(sent.status).toBe("sent");
  });

  it("records provider response", async () => {
    vi.mocked(prisma.providerEnquiry.findUnique).mockResolvedValue({
      id: "enq-1",
      caseId: "case-1",
      participantId: "p1",
      status: "sent",
    } as never);
    vi.mocked(prisma.providerEnquiry.update).mockResolvedValue({
      id: "enq-1",
      status: "responded",
      responseJson: { availability: "2 weeks" },
    } as never);

    const responded = await recordResponse({
      enquiryId: "enq-1",
      responseJson: { availability: "2 weeks" },
      actorUserId: "c1",
    });

    expect(responded.status).toBe("responded");
  });

  it("withdraws enquiry with timestamp", async () => {
    vi.mocked(prisma.providerEnquiry.findUnique).mockResolvedValue({
      id: "enq-1",
      caseId: "case-1",
      participantId: "p1",
      status: "sent",
    } as never);
    vi.mocked(prisma.providerEnquiry.update).mockResolvedValue({
      id: "enq-1",
      status: "withdrawn",
      withdrawnAt: new Date("2026-07-14"),
    } as never);

    const withdrawn = await withdrawEnquiry("enq-1", "c1");
    expect(withdrawn.status).toBe("withdrawn");
    expect(withdrawn.withdrawnAt).toBeTruthy();
  });
});
