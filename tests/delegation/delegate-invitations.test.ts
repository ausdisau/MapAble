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
  FINANCIAL_DOMAINS: ["finance", "abilitypay", "payments"],
  CLINICAL_DOMAINS: ["clinical", "home_living_clinical", "safeguarding"],
  isFinancialDomain: (domain: string) =>
    ["finance", "abilitypay", "payments"].includes(domain),
  isClinicalDomain: (domain: string) =>
    ["clinical", "home_living_clinical", "safeguarding"].includes(domain),
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    delegateInvitation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
    participantAuthorityGrant: {
      create: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  inviteDelegate,
  respondToDelegateInvitation,
} from "@/lib/delegation/delegate-invitation-service";
import { prisma } from "@/lib/prisma";

const futureExpiry = new Date("2027-01-01T00:00:00.000Z");
const now = new Date("2026-07-14T06:00:00.000Z");

const baseInviteInput = {
  participantId: "participant-1",
  actorUserId: "participant-1",
  inviteeEmail: "delegate@example.com",
  roleType: "family_member" as const,
  proposedDomain: "scheduling",
  proposedActions: ["view_schedule"],
  proposedConsentScopes: ["read"],
  expiresAt: futureExpiry,
};

describe("delegate invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "delegate-1",
    } as never);
  });

  it("rejects invitations for financial domains", async () => {
    await expect(
      inviteDelegate({
        ...baseInviteInput,
        proposedDomain: "finance",
        proposedActions: ["view_statements"],
      }),
    ).rejects.toThrow("FINANCIAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT");
    expect(prisma.delegateInvitation.create).not.toHaveBeenCalled();
  });

  it("rejects invitations for clinical domains", async () => {
    await expect(
      inviteDelegate({
        ...baseInviteInput,
        proposedDomain: "clinical",
        proposedActions: ["view_records"],
      }),
    ).rejects.toThrow("CLINICAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT");
    expect(prisma.delegateInvitation.create).not.toHaveBeenCalled();
  });

  it("rejects forbidden inherited actions such as execute_payment", async () => {
    await expect(
      inviteDelegate({
        ...baseInviteInput,
        proposedActions: ["execute_payment"],
      }),
    ).rejects.toThrow("DELEGATE_ACTION_NOT_PERMITTED");
    expect(prisma.delegateInvitation.create).not.toHaveBeenCalled();
  });

  it("creates a pending invitation for safe domains", async () => {
    vi.mocked(prisma.delegateInvitation.create).mockResolvedValue({
      id: "invite-1",
      status: "pending",
      proposedDomain: "scheduling",
    } as never);

    const invitation = await inviteDelegate(baseInviteInput);

    expect(invitation.status).toBe("pending");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delegate.invitation.created" }),
    );
  });

  it("accepts an invitation and creates a participant authority grant", async () => {
    vi.mocked(prisma.delegateInvitation.findFirst).mockResolvedValue({
      id: "invite-1",
      participantId: "participant-1",
      proposedDomain: "scheduling",
      proposedActions: ["view_schedule"],
      proposedConsentScopes: ["read"],
      roleType: "family_member",
      expiresAt: futureExpiry,
      status: "pending",
    } as never);
    vi.mocked(prisma.participantAuthorityGrant.create).mockResolvedValue({
      id: "grant-1",
    } as never);
    vi.mocked(prisma.delegateInvitation.update).mockResolvedValue({
      id: "invite-1",
      status: "accepted",
      resultingGrantId: "grant-1",
    } as never);

    const result = await respondToDelegateInvitation({
      invitationId: "invite-1",
      inviteeUserId: "delegate-1",
      inviteeEmail: "delegate@example.com",
      response: "accepted",
      now,
    });

    expect(result.grant?.id).toBe("grant-1");
    expect(result.invitation.status).toBe("accepted");
    expect(prisma.participantAuthorityGrant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          participantId: "participant-1",
          delegateId: "delegate-1",
          domain: "scheduling",
        }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delegate.invitation.accepted" }),
    );
  });

  it("declines an invitation without creating a grant", async () => {
    vi.mocked(prisma.delegateInvitation.findFirst).mockResolvedValue({
      id: "invite-2",
      participantId: "participant-1",
      proposedDomain: "scheduling",
      proposedActions: ["view_schedule"],
      proposedConsentScopes: ["read"],
      roleType: "family_member",
      expiresAt: futureExpiry,
      status: "pending",
    } as never);
    vi.mocked(prisma.delegateInvitation.update).mockResolvedValue({
      id: "invite-2",
      status: "declined",
    } as never);

    const result = await respondToDelegateInvitation({
      invitationId: "invite-2",
      inviteeUserId: "delegate-1",
      inviteeEmail: "delegate@example.com",
      response: "declined",
      now,
    });

    expect(result.grant).toBeNull();
    expect(result.invitation.status).toBe("declined");
    expect(prisma.participantAuthorityGrant.create).not.toHaveBeenCalled();
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delegate.invitation.declined" }),
    );
  });
});
