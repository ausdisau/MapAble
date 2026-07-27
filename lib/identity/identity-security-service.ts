import { createHash, randomBytes } from "crypto";

import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { identityAuthorityConfig } from "@/lib/config/identity-authority";
import { prisma } from "@/lib/prisma";

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function recordLoginAudit(input: {
  userId?: string;
  email?: string;
  eventType: string;
  method?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.loginAuditEvent.create({
    data: {
      userId: input.userId,
      emailHash: input.email ? hashValue(input.email.toLowerCase()) : undefined,
      eventType: input.eventType,
      method: input.method,
      metadata: input.metadata ?? {},
    },
  });
}

export async function upsertMfaEnrolment(input: {
  userId: string;
  method: "sms_twilio" | "passkey";
  status: "pending" | "enrolled" | "disabled";
}) {
  const enrolledAt = input.status === "enrolled" ? new Date() : undefined;
  const disabledAt = input.status === "disabled" ? new Date() : undefined;
  const record = await prisma.mfaEnrolment.upsert({
    where: {
      userId_method: { userId: input.userId, method: input.method },
    },
    create: {
      userId: input.userId,
      method: input.method,
      status: input.status,
      enrolledAt,
      disabledAt,
    },
    update: {
      status: input.status,
      enrolledAt,
      disabledAt,
    },
  });
  await createAuditEvent({
    actorUserId: input.userId,
    action: `identity.mfa.${input.status}`,
    entityType: "MfaEnrolment",
    entityId: record.id,
    metadata: { method: input.method },
  });
  return record;
}

export async function listMfaEnrolments(userId: string) {
  return prisma.mfaEnrolment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function registerTrustedDevice(input: {
  userId: string;
  deviceLabel: string;
  deviceFingerprint: string;
}) {
  const deviceFingerprintHash = hashValue(input.deviceFingerprint);
  return prisma.trustedDevice.create({
    data: {
      userId: input.userId,
      deviceLabel: input.deviceLabel,
      deviceFingerprintHash,
    },
  });
}

export async function listTrustedDevices(userId: string) {
  return prisma.trustedDevice.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      deviceLabel: true,
      lastSeenAt: true,
      createdAt: true,
    },
  });
}

export async function revokeTrustedDevice(input: {
  userId: string;
  deviceId: string;
}) {
  const result = await prisma.trustedDevice.updateMany({
    where: { id: input.deviceId, userId: input.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count !== 1) throw new Error("TRUSTED_DEVICE_NOT_FOUND");
  await createAuditEvent({
    actorUserId: input.userId,
    action: "identity.device.revoked",
    entityType: "TrustedDevice",
    entityId: input.deviceId,
  });
}

export async function createAuthSessionRecord(input: {
  userId: string;
  sessionToken: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
}) {
  return prisma.authSessionRecord.create({
    data: {
      userId: input.userId,
      sessionTokenHash: hashValue(input.sessionToken),
      userAgent: input.userAgent,
      ipHash: input.ipAddress ? hashValue(input.ipAddress) : undefined,
      expiresAt: input.expiresAt,
    },
  });
}

export async function listActiveSessions(userId: string, now = new Date()) {
  return prisma.authSessionRecord.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { lastSeenAt: "desc" },
    select: {
      id: true,
      userAgent: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
    },
  });
}

export async function revokeAuthSession(input: {
  userId: string;
  sessionId: string;
  reason?: string;
}) {
  const result = await prisma.authSessionRecord.updateMany({
    where: { id: input.sessionId, userId: input.userId, revokedAt: null },
    data: {
      revokedAt: new Date(),
      revokedReason: input.reason ?? "user_revoked",
    },
  });
  if (result.count !== 1) throw new Error("SESSION_NOT_FOUND");
  await recordLoginAudit({
    userId: input.userId,
    eventType: "session_revoked",
    metadata: { sessionId: input.sessionId },
  });
  await createAuditEvent({
    actorUserId: input.userId,
    action: "identity.session.revoked",
    entityType: "AuthSessionRecord",
    entityId: input.sessionId,
  });
}

export async function revokeAllAuthSessions(input: {
  userId: string;
  reason?: string;
}) {
  const result = await prisma.authSessionRecord.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: {
      revokedAt: new Date(),
      revokedReason: input.reason ?? "user_revoked_all",
    },
  });
  await recordLoginAudit({
    userId: input.userId,
    eventType: "sessions_revoked_all",
    metadata: { count: result.count },
  });
  return result.count;
}

export async function listLoginAuditHistory(userId: string, take = 50) {
  return prisma.loginAuditEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      eventType: true,
      method: true,
      createdAt: true,
    },
  });
}

export async function createStepUpChallenge(input: {
  userId: string;
  purpose: string;
  ttlMinutes?: number;
}) {
  if (!identityAuthorityConfig.stepUpEnabled) {
    throw new Error("STEP_UP_DISABLED");
  }
  const ttl = input.ttlMinutes ?? 10;
  return prisma.stepUpChallenge.create({
    data: {
      userId: input.userId,
      purpose: input.purpose,
      expiresAt: new Date(Date.now() + ttl * 60_000),
    },
  });
}

export async function satisfyStepUpChallenge(input: {
  userId: string;
  challengeId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const challenge = await prisma.stepUpChallenge.findFirst({
    where: {
      id: input.challengeId,
      userId: input.userId,
      status: "pending",
      expiresAt: { gt: now },
    },
  });
  if (!challenge) throw new Error("STEP_UP_CHALLENGE_INVALID");
  return prisma.stepUpChallenge.update({
    where: { id: challenge.id },
    data: { status: "satisfied", satisfiedAt: now },
  });
}

export async function requireRecentStepUp(input: {
  userId: string;
  purpose: string;
  withinMinutes?: number;
  now?: Date;
}) {
  if (!identityAuthorityConfig.stepUpEnabled) return true;
  const now = input.now ?? new Date();
  const since = new Date(now.getTime() - (input.withinMinutes ?? 15) * 60_000);
  const challenge = await prisma.stepUpChallenge.findFirst({
    where: {
      userId: input.userId,
      purpose: input.purpose,
      status: "satisfied",
      satisfiedAt: { gte: since },
    },
  });
  return Boolean(challenge);
}

/** Service accounts are identity principals, not participant delegates. */
export function assertNotServiceAccountForParticipantAuthority(input: {
  actorKind?: "user" | "service_account";
}) {
  if (input.actorKind === "service_account") {
    throw new Error("SERVICE_ACCOUNT_PARTICIPANT_AUTHORITY_DENIED");
  }
}

export function newOpaqueSessionToken(): string {
  return randomBytes(32).toString("hex");
}
