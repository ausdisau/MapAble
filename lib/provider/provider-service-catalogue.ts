import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assertOrganisationAccess } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { providerWorkforceConfig } from "@/lib/config/provider-workforce";
import { prisma } from "@/lib/prisma";

export async function createProviderServiceOffering(input: {
  actor: CurrentUser;
  organisationId: string;
  serviceType: string;
  title: string;
  description: string;
  serviceAreas: string[];
  deliveryModes: string[];
  accessibilityFeatures: string[];
  supportCapabilities: string[];
  communicationCapabilities: string[];
  highIntensitySupported: boolean;
  evidenceExpiresAt?: Date;
}) {
  if (!providerWorkforceConfig.providerCloudEnabled) {
    throw new Error("PROVIDER_CLOUD_DISABLED");
  }
  await assertOrganisationAccess(input.actor, input.organisationId, "care:manage:org");
  const offering = await prisma.providerServiceOffering.create({
    data: {
      organisationId: input.organisationId,
      serviceType: input.serviceType,
      title: input.title,
      description: input.description,
      serviceAreas: input.serviceAreas,
      deliveryModes: input.deliveryModes,
      accessibilityFeatures: input.accessibilityFeatures,
      supportCapabilities: input.supportCapabilities,
      communicationCapabilities: input.communicationCapabilities,
      highIntensitySupported: input.highIntensitySupported,
      evidenceExpiresAt: input.evidenceExpiresAt,
    },
  });
  await createAuditEvent({
    actorUserId: input.actor.id,
    actorRole: input.actor.primaryRole,
    organisationId: input.organisationId,
    action: "provider.service_offering.created",
    entityType: "ProviderServiceOffering",
    entityId: offering.id,
  });
  return offering;
}

export async function listProviderServiceOfferings(input: {
  actor: CurrentUser;
  organisationId: string;
}) {
  if (!providerWorkforceConfig.providerCloudEnabled) {
    throw new Error("PROVIDER_CLOUD_DISABLED");
  }
  await assertOrganisationAccess(input.actor, input.organisationId, "care:manage:org");
  return prisma.providerServiceOffering.findMany({
    where: {
      organisationId: input.organisationId,
      deletedAt: null,
    },
    orderBy: { title: "asc" },
  });
}
