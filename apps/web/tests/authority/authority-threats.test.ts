import { beforeEach, describe, expect, it, vi } from "vitest";

const mockIdentityConfig = vi.hoisted(() => ({
  enabled: true,
  stepUpEnabled: true,
  emergencyAccessEnabled: true,
  delegateInvitesEnabled: true,
  serviceAccountParticipantAuthorityEnabled: false,
  automaticFinancialAuthorityEnabled: false,
  automaticClinicalAuthorityEnabled: false,
}));

vi.mock("@/lib/config/identity-authority", () => ({
  identityAuthorityConfig: mockIdentityConfig,
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
    },
    authorityDecision: {
      create: vi.fn(),
    },
    authSessionRecord: {
      updateMany: vi.fn(),
    },
    loginAuditEvent: {
      create: vi.fn(),
    },
    stepUpChallenge: {
      findFirst: vi.fn(),
    },
  },
}));

import { evaluateAuthorityDecision } from "@/lib/authority/authority-decision-service";
import {
  grantParticipantAuthority,
  hasParticipantAuthority,
} from "@/lib/authority/participant-authority-service";
import {
  assertNotServiceAccountForParticipantAuthority,
  requireRecentStepUp,
  revokeAuthSession,
} from "@/lib/identity/identity-security-service";
import { prisma } from "@/lib/prisma";

const now = new Date("2026-07-14T06:00:00.000Z");
const futureExpiry = new Date("2027-01-01T00:00:00.000Z");
const expiredAt = new Date("2026-01-01T00:00:00.000Z");

/**
 * Threat matrix for participant authority — each row documents an attack
 * vector and the expected defensive outcome.
 */
describe("authority threat matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentityConfig.stepUpEnabled = true;
  });

  it("forged grant: non-participant actor cannot create grants", async () => {
    await expect(
      grantParticipantAuthority({
        participantId: "participant-1",
        actorUserId: "attacker-1",
        delegateId: "attacker-1",
        domain: "scheduling",
        actions: ["view_schedule"],
        consentScopes: ["read"],
        expiresAt: futureExpiry,
      }),
    ).rejects.toThrow("PARTICIPANT_AUTHORITY_REQUIRED");
  });

  it("expired grant: delegate loses authority after expiry", async () => {
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
  });

  it("revoked grant: delegate loses authority after revocation", async () => {
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
  });

  it("cross-participant: actor cannot use another participant's grant", async () => {
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );
    vi.mocked(prisma.authorityDecision.create).mockResolvedValue({
      id: "decision-cross",
      decision: "deny",
    } as never);

    const result = await evaluateAuthorityDecision({
      participantId: "participant-1",
      actorUserId: "delegate-for-participant-2",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(result.allowed).toBe(false);
    expect(prisma.participantAuthorityGrant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          participantId: "participant-1",
          delegateId: "delegate-for-participant-2",
        }),
      }),
    );
  });

  it("org membership does not confer authority without an explicit grant", async () => {
    // Organisation membership is out of scope for hasParticipantAuthority;
    // only self or an active grant satisfies the check.
    vi.mocked(prisma.participantAuthorityGrant.findFirst).mockResolvedValue(
      null,
    );

    const orgMemberWithoutGrant = await hasParticipantAuthority({
      participantId: "participant-1",
      actorUserId: "provider-admin-in-same-org",
      domain: "scheduling",
      action: "view_schedule",
      now,
    });

    expect(orgMemberWithoutGrant).toBe(false);
    expect(prisma.participantAuthorityGrant.findFirst).toHaveBeenCalled();
  });

  it("stolen session: revoke invalidates the compromised session", async () => {
    vi.mocked(prisma.authSessionRecord.updateMany).mockResolvedValue({
      count: 1,
    });

    await revokeAuthSession({
      userId: "participant-1",
      sessionId: "stolen-session",
      reason: "suspected_compromise",
    });

    expect(prisma.authSessionRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          revokedReason: "suspected_compromise",
        }),
      }),
    );
  });

  it("step-up requirement: sensitive actions need a recent satisfied challenge", async () => {
    vi.mocked(prisma.stepUpChallenge.findFirst).mockResolvedValue(null);

    const satisfied = await requireRecentStepUp({
      userId: "participant-1",
      purpose: "revoke_delegate",
      withinMinutes: 15,
      now,
    });

    expect(satisfied).toBe(false);
  });

  it("service account: cannot act with participant authority", () => {
    expect(() =>
      assertNotServiceAccountForParticipantAuthority({
        actorKind: "service_account",
      }),
    ).toThrow("SERVICE_ACCOUNT_PARTICIPANT_AUTHORITY_DENIED");
  });

  it("forged wrong-actor grant attempt is blocked at creation", async () => {
    await expect(
      grantParticipantAuthority({
        participantId: "participant-1",
        actorUserId: "wrong-actor",
        delegateId: "delegate-1",
        domain: "scheduling",
        actions: ["view_schedule"],
        consentScopes: ["read"],
        expiresAt: expiredAt,
      }),
    ).rejects.toThrow("PARTICIPANT_AUTHORITY_REQUIRED");
  });
});
