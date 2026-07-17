import type { ConsentScope as PrismaConsentScope ,
  ConsentRecipientType,
  ConsentShareMode,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { consentScopeFromPrisma, consentScopeToPrisma } from "@/lib/consent/scope-map";
import { prisma } from "@/lib/prisma";
import type { ConsentScope, ConsentStatus } from "@/types/mapable";


export interface GrantConsentInput {
  subjectUserId: string;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
  scope: ConsentScope;
  purpose: string;
  expiryDate?: Date;
  createdById: string;
  shareMode?: ConsentShareMode;
  recipientType?: ConsentRecipientType;
  dataScope?: string[];
  sourceAction?: string;
}

export async function grantConsent(input: GrantConsentInput) {
  const record = await prisma.consentRecord.create({
    data: {
      subjectUserId: input.subjectUserId,
      grantedToUserId: input.grantedToUserId,
      grantedToOrganisationId: input.grantedToOrganisationId,
      scope: consentScopeToPrisma(input.scope),
      purpose: input.purpose,
      status: "active",
      expiryDate: input.expiryDate,
      createdById: input.createdById,
      shareMode: input.shareMode,
      recipientType: input.recipientType,
      dataScope: input.dataScope ?? undefined,
      sourceAction: input.sourceAction,
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "consent.granted",
    entityType: "ConsentRecord",
    entityId: record.id,
    participantId: input.subjectUserId,
    metadata: { scope: input.scope },
  });

  return record;
}

export async function revokeConsent(
  consentId: string,
  revokedById: string
) {
  const record = await prisma.consentRecord.update({
    where: { id: consentId },
    data: {
      status: "revoked",
      revokedById,
      revokedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: revokedById,
    action: "consent.revoked",
    entityType: "ConsentRecord",
    entityId: record.id,
    participantId: record.subjectUserId,
  });

  return record;
}

export async function checkConsent(params: {
  subjectUserId: string;
  scope: ConsentScope;
  grantedToUserId?: string;
  grantedToOrganisationId?: string;
}): Promise<boolean> {
  const prismaScope = consentScopeToPrisma(params.scope);
  const now = new Date();

  const record = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: params.subjectUserId,
      scope: prismaScope,
      status: "active",
      ...(params.grantedToUserId
        ? { grantedToUserId: params.grantedToUserId }
        : {}),
      ...(params.grantedToOrganisationId
        ? { grantedToOrganisationId: params.grantedToOrganisationId }
        : {}),
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
  });

  return Boolean(record);
}

export async function listConsentsForParticipant(subjectUserId: string) {
  const records = await prisma.consentRecord.findMany({
    where: { subjectUserId },
    orderBy: { createdAt: "desc" },
    include: {
      grantedToOrganisation: { select: { id: true, name: true } },
      grantedToUser: { select: { id: true, name: true, email: true } },
    },
  });

  return records.map((r) => ({
    ...r,
    scope: consentScopeFromPrisma(r.scope),
    scopeLabel: r.scope.replace(/_/g, "."),
  }));
}

export function isConsentActive(
  status: string,
  expiryDate: Date | null
): ConsentStatus {
  if (status === "revoked") return "revoked";
  if (status === "pending") return "pending";
  if (expiryDate && expiryDate < new Date()) return "expired";
  if (status === "active") return "active";
  return status as ConsentStatus;
}

export async function canShareAccessibilityWithOrganisation(
  participantId: string,
  organisationId: string,
  bookingType: "care" | "transport" | "care_transport"
): Promise<boolean> {
  const scope: ConsentScope =
    bookingType === "transport"
      ? "transport.accessibility_share"
      : bookingType === "care"
        ? "care.accessibility_share"
        : "accessibility.read";

  return checkConsent({
    subjectUserId: participantId,
    scope,
    grantedToOrganisationId: organisationId,
  });
}

export type { PrismaConsentScope };
