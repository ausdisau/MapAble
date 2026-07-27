import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/identity-authority", () => ({
  identityAuthorityConfig: {
    enabled: true,
    stepUpEnabled: true,
    emergencyAccessEnabled: true,
    delegateInvitesEnabled: true,
    serviceAccountParticipantAuthorityEnabled: false,
    automaticFinancialAuthorityEnabled: false,
    automaticClinicalAuthorityEnabled: false,
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emergencyAccessRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    emergencyAccessReview: {
      create: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  hasApprovedEmergencyAccess,
  requestEmergencyAccess,
  reviewEmergencyAccess,
} from "@/lib/authority/emergency-access-service";
import { prisma } from "@/lib/prisma";

const validJustification =
  "Participant unreachable after welfare check; urgent medication coordination required.";

describe("emergency access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires justification of at least 20 characters", async () => {
    await expect(
      requestEmergencyAccess({
        participantId: "participant-1",
        requesterId: "coordinator-1",
        purpose: "medication_coordination",
        justification: "too short",
        requestedScopes: ["read_care_plan"],
      }),
    ).rejects.toThrow("EMERGENCY_JUSTIFICATION_REQUIRED");

    await expect(
      requestEmergencyAccess({
        participantId: "participant-1",
        requesterId: "coordinator-1",
        purpose: "medication_coordination",
        justification: "   ",
        requestedScopes: ["read_care_plan"],
      }),
    ).rejects.toThrow("EMERGENCY_JUSTIFICATION_REQUIRED");

    expect(prisma.emergencyAccessRequest.create).not.toHaveBeenCalled();
  });

  it("creates a request when justification is sufficient", async () => {
    vi.mocked(prisma.emergencyAccessRequest.create).mockResolvedValue({
      id: "request-1",
      status: "requested",
    } as never);

    const request = await requestEmergencyAccess({
      participantId: "participant-1",
      requesterId: "coordinator-1",
      purpose: "medication_coordination",
      justification: validJustification,
      requestedScopes: ["read_care_plan"],
    });

    expect(request.status).toBe("requested");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "emergency_access.requested" }),
    );
  });

  it("requires an admin role to review emergency access", async () => {
    vi.mocked(prisma.emergencyAccessRequest.findUnique).mockResolvedValue({
      id: "request-1",
      participantId: "participant-1",
      status: "requested",
      expiresAt: null,
    } as never);

    await expect(
      reviewEmergencyAccess({
        requestId: "request-1",
        reviewerId: "coordinator-1",
        reviewerRole: "support_coordinator",
        decision: "approve",
      }),
    ).rejects.toThrow("EMERGENCY_REVIEW_REQUIRES_HUMAN_ADMIN");

    expect(prisma.emergencyAccessReview.create).not.toHaveBeenCalled();
  });

  it("allows mapable_admin to approve emergency access", async () => {
    vi.mocked(prisma.emergencyAccessRequest.findUnique).mockResolvedValue({
      id: "request-1",
      participantId: "participant-1",
      status: "requested",
      expiresAt: null,
    } as never);
    vi.mocked(prisma.emergencyAccessReview.create).mockResolvedValue({
      id: "review-1",
      decision: "approve",
    } as never);
    vi.mocked(prisma.emergencyAccessRequest.update).mockResolvedValue({
      id: "request-1",
      status: "approved",
    } as never);

    const result = await reviewEmergencyAccess({
      requestId: "request-1",
      reviewerId: "admin-1",
      reviewerRole: "mapable_admin",
      decision: "approve",
    });

    expect(result.request.status).toBe("approved");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "emergency_access.approve" }),
    );
  });

  it("detects approved emergency access for a requested scope", async () => {
    vi.mocked(prisma.emergencyAccessRequest.findFirst).mockResolvedValue({
      id: "request-1",
      status: "approved",
      requestedScopes: ["read_care_plan"],
    } as never);

    const allowed = await hasApprovedEmergencyAccess({
      participantId: "participant-1",
      requesterId: "coordinator-1",
      scope: "read_care_plan",
      now: new Date("2026-07-14T06:00:00.000Z"),
    });

    expect(allowed).toBe(true);
  });
});
