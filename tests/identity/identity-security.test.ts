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
    mfaEnrolment: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    authSessionRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    loginAuditEvent: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    stepUpChallenge: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  assertNotServiceAccountForParticipantAuthority,
  createStepUpChallenge,
  requireRecentStepUp,
  revokeAuthSession,
  satisfyStepUpChallenge,
  upsertMfaEnrolment,
} from "@/lib/identity/identity-security-service";
import { prisma } from "@/lib/prisma";

describe("identity security service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentityConfig.stepUpEnabled = true;
  });

  describe("step-up challenges", () => {
    it("creates a step-up challenge when step-up is enabled", async () => {
      const expiresAt = new Date("2026-07-14T07:00:00.000Z");
      vi.mocked(prisma.stepUpChallenge.create).mockResolvedValue({
        id: "challenge-1",
        userId: "user-1",
        purpose: "revoke_delegate",
        expiresAt,
        status: "pending",
      } as never);

      const challenge = await createStepUpChallenge({
        userId: "user-1",
        purpose: "revoke_delegate",
        ttlMinutes: 10,
      });

      expect(challenge.id).toBe("challenge-1");
      expect(prisma.stepUpChallenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            purpose: "revoke_delegate",
          }),
        }),
      );
    });

    it("rejects step-up when the feature flag is disabled", async () => {
      mockIdentityConfig.stepUpEnabled = false;

      await expect(
        createStepUpChallenge({
          userId: "user-1",
          purpose: "revoke_delegate",
        }),
      ).rejects.toThrow("STEP_UP_DISABLED");
    });

    it("satisfies a pending, unexpired challenge", async () => {
      const now = new Date("2026-07-14T06:30:00.000Z");
      vi.mocked(prisma.stepUpChallenge.findFirst).mockResolvedValue({
        id: "challenge-1",
        userId: "user-1",
        status: "pending",
      } as never);
      vi.mocked(prisma.stepUpChallenge.update).mockResolvedValue({
        id: "challenge-1",
        status: "satisfied",
        satisfiedAt: now,
      } as never);

      const result = await satisfyStepUpChallenge({
        userId: "user-1",
        challengeId: "challenge-1",
        now,
      });

      expect(result.status).toBe("satisfied");
    });

    it("requires a recent satisfied challenge for sensitive actions", async () => {
      vi.mocked(prisma.stepUpChallenge.findFirst).mockResolvedValue({
        id: "challenge-1",
        status: "satisfied",
      } as never);

      await expect(
        requireRecentStepUp({
          userId: "user-1",
          purpose: "revoke_delegate",
          withinMinutes: 15,
          now: new Date("2026-07-14T06:30:00.000Z"),
        }),
      ).resolves.toBe(true);
    });

    it("short-circuits step-up checks when disabled", async () => {
      mockIdentityConfig.stepUpEnabled = false;

      await expect(
        requireRecentStepUp({
          userId: "user-1",
          purpose: "revoke_delegate",
        }),
      ).resolves.toBe(true);
      expect(prisma.stepUpChallenge.findFirst).not.toHaveBeenCalled();
    });
  });

  describe("session revoke", () => {
    it("revokes a single active session and records audit events", async () => {
      vi.mocked(prisma.authSessionRecord.updateMany).mockResolvedValue({
        count: 1,
      });

      await revokeAuthSession({
        userId: "user-1",
        sessionId: "session-1",
        reason: "user_revoked",
      });

      expect(prisma.authSessionRecord.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: "session-1",
            userId: "user-1",
            revokedAt: null,
          },
        }),
      );
      expect(prisma.loginAuditEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            eventType: "session_revoked",
          }),
        }),
      );
      expect(createAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "identity.session.revoked",
          entityId: "session-1",
        }),
      );
    });

    it("throws when the session is not found", async () => {
      vi.mocked(prisma.authSessionRecord.updateMany).mockResolvedValue({
        count: 0,
      });

      await expect(
        revokeAuthSession({
          userId: "user-1",
          sessionId: "missing-session",
        }),
      ).rejects.toThrow("SESSION_NOT_FOUND");
    });
  });

  describe("service-account separation", () => {
    it("allows human user actors", () => {
      expect(() =>
        assertNotServiceAccountForParticipantAuthority({ actorKind: "user" }),
      ).not.toThrow();
    });

    it("denies service accounts from participant authority", () => {
      expect(() =>
        assertNotServiceAccountForParticipantAuthority({
          actorKind: "service_account",
        }),
      ).toThrow("SERVICE_ACCOUNT_PARTICIPANT_AUTHORITY_DENIED");
    });
  });

  describe("MFA enrolment upsert shape", () => {
    it("upserts enrolled MFA with enrolledAt and audit metadata", async () => {
      const enrolledAt = new Date("2026-07-14T06:00:00.000Z");
      vi.mocked(prisma.mfaEnrolment.upsert).mockResolvedValue({
        id: "mfa-1",
        userId: "user-1",
        method: "passkey",
        status: "enrolled",
        enrolledAt,
      } as never);

      const record = await upsertMfaEnrolment({
        userId: "user-1",
        method: "passkey",
        status: "enrolled",
      });

      expect(record.status).toBe("enrolled");
      expect(prisma.mfaEnrolment.upsert).toHaveBeenCalledWith({
        where: {
          userId_method: { userId: "user-1", method: "passkey" },
        },
        create: {
          userId: "user-1",
          method: "passkey",
          status: "enrolled",
          enrolledAt: expect.any(Date),
          disabledAt: undefined,
        },
        update: {
          status: "enrolled",
          enrolledAt: expect.any(Date),
          disabledAt: undefined,
        },
      });
      expect(createAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "identity.mfa.enrolled",
          metadata: { method: "passkey" },
        }),
      );
    });

    it("upserts disabled MFA with disabledAt", async () => {
      vi.mocked(prisma.mfaEnrolment.upsert).mockResolvedValue({
        id: "mfa-2",
        userId: "user-1",
        method: "sms_twilio",
        status: "disabled",
      } as never);

      await upsertMfaEnrolment({
        userId: "user-1",
        method: "sms_twilio",
        status: "disabled",
      });

      expect(prisma.mfaEnrolment.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            status: "disabled",
            disabledAt: expect.any(Date),
            enrolledAt: undefined,
          }),
          update: expect.objectContaining({
            status: "disabled",
            disabledAt: expect.any(Date),
            enrolledAt: undefined,
          }),
        }),
      );
    });
  });
});
