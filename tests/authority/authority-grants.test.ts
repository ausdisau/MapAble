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
    participantAuthorityGrant: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    authorityDecision: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { evaluateAuthorityDecision } from "@/lib/authority/authority-decision-service";
import {
  grantParticipantAuthority,
  hasParticipantAuthority,
} from "@/lib/authority/participant-authority-service";
import {
  identityAuthorityConfig,
  isFinancialDomain,
} from "@/lib/config/identity-authority";
import { prisma } from "@/lib/prisma";

const futureExpiry = new Date("2027-01-01T00:00:00.000Z");
const pastExpiry = new Date("2025-01-01T00:00:00.000Z");
const now = new Date("2026-07-14T06:00:00.000Z");

describe("participant authority grants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows participants to grant authority only for themselves", async () => {
    vi.mocked(prisma.participantAuthorityGrant.create).mockResolvedValue({
      id: "grant-1",
      participantId: "participant-1",
      delegateId: "delegate-1",
      domain: "scheduling",
      actions: ["view_schedule"],
      consentScopes: ["read"],
      expiresAt: futureExpiry,
    } as never);

    const grant = await grantParticipantAuthority({
      participantId: "participant-1",
      actorUserId: "participant-1",
      delegateId: "delegate-1",
      domain: "scheduling",
      actions: ["view_schedule"],
      consentScopes: ["read"],
      expiresAt: futureExpiry,
    });

    expect(grant.id).toBe("grant-1");
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "participant_authority.granted",
      }),
    );
  });

  it("rejects forged grants from a non-participant actor", async () => {
    await expect(
      grantParticipantAuthority({
        participantId: "participant-1",
        actorUserId: "attacker-1",
        delegateId: "delegate-1",
        domain: "scheduling",
        actions: ["view_schedule"],
        consentScopes: ["read"],
        expiresAt: futureExpiry,
      }),
    ).rejects.toThrow("PARTICIPANT_AUTHORITY_REQUIRED");
    expect(prisma.participantAuthorityGrant.create).not.toHaveBeenCalled();
  });

  it("denies expired grants in hasParticipantAuthority", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );

    const allowed = await hasParticipantAuthority({
      participantId: "participant-1",
      actorUserId: "delegate-1",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(allowed).toBe(false);
    expect(prisma.participantAuthorityGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expiresAt: { gt: now },
          revokedAt: null,
        }),
      }),
    );
  });

  it("denies revoked grants in hasParticipantAuthority", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );

    const allowed = await hasParticipantAuthority({
      participantId: "participant-1",
      actorUserId: "delegate-1",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(allowed).toBe(false);
    expect(prisma.participantAuthorityGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ revokedAt: null }),
      }),
    );
  });

  it("records allow decisions when self-authority applies", async () => {
    vi.mocked(prisma.authorityDecision.create).mockResolvedValue({
      id: "decision-1",
      decision: "allow",
    } as never);

    const result = await evaluateAuthorityDecision({
      participantId: "participant-1",
      actorUserId: "participant-1",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(result.allowed).toBe(true);
    expect(prisma.authorityDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decision: "allow",
          reason: "self_authority",
        }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "authority.decision.allow" }),
    );
  });

  it("records deny decisions when no active grant exists", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.authorityDecision.create).mockResolvedValue({
      id: "decision-2",
      decision: "deny",
    } as never);

    const result = await evaluateAuthorityDecision({
      participantId: "participant-1",
      actorUserId: "delegate-1",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(result.allowed).toBe(false);
    expect(prisma.authorityDecision.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decision: "deny",
          reason: "no_active_grant",
        }),
      }),
    );
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "authority.decision.deny" }),
    );
  });

  it("never auto-inherits financial authority from config flags", async () => {
    expect(identityAuthorityConfig.automaticFinancialAuthorityEnabled).toBe(
      false,
    );
    expect(isFinancialDomain("finance")).toBe(true);

    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.authorityDecision.create).mockResolvedValue({
      id: "decision-3",
      decision: "deny",
    } as never);

    const result = await evaluateAuthorityDecision({
      participantId: "participant-1",
      actorUserId: "delegate-1",
      domain: "finance",
      action: "view_statements",
      now,
    });

    expect(result.allowed).toBe(false);
    expect(prisma.participantAuthorityGrant.create).not.toHaveBeenCalled();
  });

  it("rejects grants with expiry in the past at creation time", async () => {
    await expect(
      grantParticipantAuthority({
        participantId: "participant-1",
        actorUserId: "participant-1",
        delegateId: "delegate-1",
        domain: "scheduling",
        actions: ["view_schedule"],
        consentScopes: ["read"],
        expiresAt: pastExpiry,
      }),
    ).rejects.toThrow("AUTHORITY_EXPIRY_REQUIRED");
  });
});
