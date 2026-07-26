import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { prisma } from "@/lib/prisma";

import {
  getTrustPassportIssuerAdapter,
  mapClaimsToWorkerStatuses,
} from "./issuer-adapter";

export function isTrustPassportPilotEnabled() {
  return y3NationalTrustConfig.trustPassportPilotEnabled;
}

export async function presentCredential(params: {
  workerProfileId: string;
  credentialType: string;
  actorUserId: string;
}) {
  if (!isTrustPassportPilotEnabled()) {
    throw new Error("TRUST_PASSPORT_PILOT_DISABLED");
  }

  const worker = await prisma.workerProfile.findUnique({
    where: { id: params.workerProfileId },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");

  const existing = await prisma.workerTrustCredential.findFirst({
    where: {
      workerProfileId: params.workerProfileId,
      credentialType: params.credentialType,
      status: { in: ["pending", "verified"] },
    },
  });
  if (existing?.status === "verified" && existing.expiresAt && existing.expiresAt > new Date()) {
    return { credential: existing, reused: true };
  }

  const adapter = getTrustPassportIssuerAdapter();
  const presentation = await adapter.issuePresentation({
    workerProfileId: params.workerProfileId,
    credentialType: params.credentialType,
  });

  const credential = await prisma.workerTrustCredential.create({
    data: {
      workerProfileId: params.workerProfileId,
      credentialType: presentation.credentialType,
      issuerDid: presentation.issuerDid,
      status: "pending",
      presentedAt: new Date(),
      expiresAt: presentation.expiresAt,
      claimsJson: presentation.claims as object,
      verificationMethod: "mock",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "trust_passport.presented",
    entityType: "WorkerTrustCredential",
    entityId: credential.id,
    metadata: { credentialType: params.credentialType, issuerDid: presentation.issuerDid },
  });

  return { credential, reused: false };
}

export async function verifyPresentation(params: {
  credentialId: string;
  actorUserId: string;
}) {
  if (!isTrustPassportPilotEnabled()) {
    throw new Error("TRUST_PASSPORT_PILOT_DISABLED");
  }

  const credential = await prisma.workerTrustCredential.findUnique({
    where: { id: params.credentialId },
    include: { workerProfile: true },
  });
  if (!credential) throw new Error("CREDENTIAL_NOT_FOUND");

  if (credential.expiresAt && credential.expiresAt < new Date()) {
    await prisma.workerTrustCredential.update({
      where: { id: credential.id },
      data: { status: "expired" },
    });
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "trust_passport.expired",
      entityType: "WorkerTrustCredential",
      entityId: credential.id,
    });
    throw new Error("CREDENTIAL_EXPIRED");
  }

  const claims = credential.claimsJson as Record<string, unknown>;
  const statusUpdates = mapClaimsToWorkerStatuses(claims);

  const [updatedCredential] = await Promise.all([
    prisma.workerTrustCredential.update({
      where: { id: credential.id },
      data: { status: "verified" },
    }),
    prisma.workerProfile.update({
      where: { id: credential.workerProfileId },
      data: statusUpdates,
    }),
  ]);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "trust_passport.verified",
    entityType: "WorkerTrustCredential",
    entityId: credential.id,
    organisationId: credential.workerProfile.organisationId,
  });

  return updatedCredential;
}

export async function getTrustPassportSummary(workerProfileId: string) {
  if (!isTrustPassportPilotEnabled()) {
    return { enabled: false, credentials: [] };
  }

  const credentials = await prisma.workerTrustCredential.findMany({
    where: { workerProfileId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    enabled: true,
    credentials,
    pilotNotice: "Pilot credentials use a mock issuer — not production accreditation.",
  };
}

export async function getTrustPassportPilotMetrics() {
  if (!isTrustPassportPilotEnabled()) {
    return { adoptionPercent: 0, reuseRate: 0, pilotCohortSize: 0 };
  }

  const [workers, withCredential, reused] = await Promise.all([
    prisma.workerProfile.count({ where: { active: true } }),
    prisma.workerProfile.count({
      where: {
        active: true,
        trustCredentials: { some: { status: "verified" } },
      },
    }),
    prisma.workerTrustCredential.count({
      where: { status: "verified", verificationMethod: "mock" },
    }),
  ]);

  const adoptionPercent = workers > 0 ? (withCredential / workers) * 100 : 0;
  const reuseRate =
    withCredential > 0 ? Math.min(100, (reused / withCredential) * 100) : 0;

  return {
    adoptionPercent,
    reuseRate,
    pilotCohortSize: workers,
    killCriteriaBreached: adoptionPercent < 20 && workers >= 5,
  };
}
