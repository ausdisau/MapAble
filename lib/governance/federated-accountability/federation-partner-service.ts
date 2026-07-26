import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isFederatedAccountabilityV2Enabled } from "@/lib/config/y5-rights-infrastructure";
import { requireRatifiedCharter } from "@/lib/governance/charter/charter-gate-service";
import { publishAccountabilityReport } from "@/lib/governance/national-accountability/accountability-service";
import { prisma } from "@/lib/prisma";

export async function linkAccountabilityPartner(params: {
  partnerName: string;
  jurisdiction?: string;
  jurisdictionLabel?: string;
  scope: string;
}) {
  if (!isFederatedAccountabilityV2Enabled()) {
    throw new Error("FEDERATED_ACCOUNTABILITY_DISABLED");
  }
  return prisma.federatedAccountabilityPartner.create({
    data: {
      ...params,
      status: "active",
    },
  });
}

export async function listAccountabilityPartners() {
  if (!isFederatedAccountabilityV2Enabled()) {
    return prisma.federatedAccountabilityPartner.findMany({
      where: { status: "active" },
      orderBy: { linkedAt: "desc" },
    });
  }
  return prisma.federatedAccountabilityPartner.findMany({
    where: { status: "active" },
    orderBy: { linkedAt: "desc" },
  });
}

export async function linkPartnerToPublication(
  partnerId: string,
  publicationId: string,
  actorUserId: string
) {
  if (!isFederatedAccountabilityV2Enabled()) {
    throw new Error("FEDERATED_ACCOUNTABILITY_DISABLED");
  }
  await requireRatifiedCharter();

  const partner = await prisma.federatedAccountabilityPartner.update({
    where: { id: partnerId },
    data: { linkedPublicationId: publicationId },
  });

  await prisma.nationalAccountabilityPublication.update({
    where: { id: publicationId },
    data: { federatedPartnerId: partnerId },
  });

  await createAuditEvent({
    actorUserId,
    action: "federated_accountability.linked",
    entityType: "FederatedAccountabilityPartner",
    entityId: partnerId,
  });

  return partner;
}

export async function publishCoordinatedReportBundle(params: {
  partnerId: string;
  periodLabel: string;
  title: string;
  summary: string;
  category: string;
  metrics?: Record<string, unknown>;
  actorUserId: string;
}) {
  if (!isFederatedAccountabilityV2Enabled()) {
    throw new Error("FEDERATED_ACCOUNTABILITY_DISABLED");
  }

  const publication = await publishAccountabilityReport({
    periodLabel: params.periodLabel,
    title: params.title,
    summary: params.summary,
    category: params.category,
    metrics: params.metrics,
    federatedPartnerId: params.partnerId,
  });

  await linkPartnerToPublication(params.partnerId, publication.id, params.actorUserId);

  return publication;
}

export async function listPublicFederatedPartners() {
  if (!isFederatedAccountabilityV2Enabled()) return [];
  return prisma.federatedAccountabilityPartner.findMany({
    where: { status: "active" },
    orderBy: { linkedAt: "desc" },
    take: 30,
    select: {
      id: true,
      partnerName: true,
      jurisdiction: true,
      jurisdictionLabel: true,
      scope: true,
      linkedPublicationId: true,
      linkedAt: true,
    },
  });
}
