import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isCertifiedApiEcosystemV2Enabled,
  PARTNER_CONCENTRATION_WARNING_THRESHOLD,
} from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

export async function listCertifiedApiEcosystem() {
  if (!isCertifiedApiEcosystemV2Enabled()) {
    return { disabled: true, entries: [] };
  }
  const entries = await prisma.certifiedApiEcosystemEntry.findMany({
    where: { status: "listed" },
    orderBy: { listedAt: "desc" },
    take: 50,
  });
  return { disabled: false, entries };
}

export async function addEcosystemEntry(params: {
  organisationId: string;
  appName: string;
  certificationTier?: string;
}) {
  if (!isCertifiedApiEcosystemV2Enabled()) {
    throw new Error("API_ECOSYSTEM_DISABLED");
  }
  return prisma.certifiedApiEcosystemEntry.create({
    data: {
      organisationId: params.organisationId,
      appName: params.appName,
      certificationTier: params.certificationTier ?? "standard",
      status: "listed",
      expiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });
}

export async function promoteCertifiedApplicationToEcosystem(
  applicationId: string,
  actorUserId: string
) {
  if (!isCertifiedApiEcosystemV2Enabled()) {
    throw new Error("API_ECOSYSTEM_DISABLED");
  }

  const application = await prisma.apiCertificationApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application || application.status !== "certified") {
    throw new Error("APPLICATION_NOT_CERTIFIED");
  }

  const existing = await prisma.certifiedApiEcosystemEntry.findFirst({
    where: { linkedApplicationId: applicationId, status: "listed" },
  });
  if (existing) return existing;

  const entry = await prisma.certifiedApiEcosystemEntry.create({
    data: {
      organisationId: application.organisationId,
      appName: application.appName,
      certificationTier: application.certificationTier ?? "standard",
      linkedApplicationId: applicationId,
      status: "listed",
      expiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "api_ecosystem.promoted",
    entityType: "CertifiedApiEcosystemEntry",
    entityId: entry.id,
  });

  return entry;
}

export async function revokeEcosystemEntry(
  entryId: string,
  actorUserId: string,
  revokedReason: string
) {
  const entry = await prisma.certifiedApiEcosystemEntry.update({
    where: { id: entryId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      revokedReason,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_ecosystem.revoked",
    entityType: "CertifiedApiEcosystemEntry",
    entityId: entryId,
  });
  return entry;
}

export async function renewEcosystemEntry(entryId: string, actorUserId: string) {
  const entry = await prisma.certifiedApiEcosystemEntry.update({
    where: { id: entryId },
    data: {
      status: "listed",
      expiresAt: new Date(Date.now() + 365 * 86400000),
      revokedAt: null,
      revokedReason: null,
    },
  });
  await createAuditEvent({
    actorUserId,
    action: "api_ecosystem.renewed",
    entityType: "CertifiedApiEcosystemEntry",
    entityId: entryId,
  });
  return entry;
}

export async function getPartnerConcentrationMetrics() {
  const { entries } = await listCertifiedApiEcosystem();
  if (!entries.length) {
    return { totalListings: 0, topOrganisationShare: 0, warning: false };
  }

  const counts = new Map<string, number>();
  for (const entry of entries) {
    counts.set(entry.organisationId, (counts.get(entry.organisationId) ?? 0) + 1);
  }

  const maxCount = Math.max(...counts.values());
  const topOrganisationShare = maxCount / entries.length;

  return {
    totalListings: entries.length,
    topOrganisationShare,
    warning: topOrganisationShare > PARTNER_CONCENTRATION_WARNING_THRESHOLD,
  };
}

export async function listPublicEcosystemDirectory() {
  const { disabled, entries } = await listCertifiedApiEcosystem();
  if (disabled) return [];
  return entries.map((e) => ({
    id: e.id,
    appName: e.appName,
    certificationTier: e.certificationTier,
    listedAt: e.listedAt,
    expiresAt: e.expiresAt,
  }));
}
