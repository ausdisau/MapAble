import { prisma } from "@/lib/prisma";
import type { Prisma, ServiceRelationshipRole } from "@prisma/client";

import { emitProgrammeAuditEvent } from "@/lib/programmes/audit";

export interface CreateServiceRelationshipInput {
  participantId: string;
  title: string;
  summary?: string;
  providerOrganisationId?: string;
  platformOrganisationId?: string;
  bookingId?: string;
  careRequestId?: string;
  correlationId: string;
  actorUserId: string;
}

export async function createServiceRelationshipRecord(
  input: CreateServiceRelationshipInput,
) {
  const record = await prisma.serviceRelationshipRecord.create({
    data: {
      participantId: input.participantId,
      title: input.title,
      summary: input.summary,
      providerOrganisationId: input.providerOrganisationId,
      platformOrganisationId: input.platformOrganisationId,
      bookingId: input.bookingId,
      careRequestId: input.careRequestId,
      correlationId: input.correlationId,
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "rights_navigator",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "trust_relationship.created",
    entityType: "ServiceRelationshipRecord",
    entityId: record.id,
    participantId: input.participantId,
  });

  return record;
}

export async function addServiceRoleDisclosure(input: {
  relationshipId: string;
  role: ServiceRelationshipRole;
  description: string;
  organisationName?: string;
  isMapAble?: boolean;
  paymentPathway?: string;
  complaintPathway?: string;
  insuranceNotes?: string;
  credentialChecked?: boolean;
  credentialNotes?: string;
  conflictFlag?: boolean;
  consentRecordId?: string;
  correlationId: string;
  actorUserId: string;
  participantId: string;
}) {
  const disclosure = await prisma.serviceRoleDisclosure.create({
    data: {
      relationshipId: input.relationshipId,
      role: input.role,
      description: input.description,
      organisationName: input.organisationName,
      isMapAble: input.isMapAble ?? false,
      paymentPathway: input.paymentPathway,
      complaintPathway: input.complaintPathway,
      insuranceNotes: input.insuranceNotes,
      credentialChecked: input.credentialChecked ?? false,
      credentialNotes: input.credentialNotes,
      conflictFlag: input.conflictFlag ?? false,
      consentRecordId: input.consentRecordId,
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "rights_navigator",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "trust_disclosure.added",
    entityType: "ServiceRoleDisclosure",
    entityId: disclosure.id,
    participantId: input.participantId,
    metadata: { role: input.role, conflictFlag: input.conflictFlag },
  });

  return disclosure;
}

export async function captureTrustRelationshipSnapshot(input: {
  relationshipId: string;
  feeComponentsJson?: unknown[];
  quoteSnapshotJson?: unknown;
  agreementSnapshotJson?: unknown;
  invoiceSnapshotJson?: unknown;
  disclosureJson?: Record<string, unknown>;
  correlationId: string;
  actorUserId: string;
  participantId: string;
}) {
  await prisma.trustRelationshipSnapshot.updateMany({
    where: { relationshipId: input.relationshipId, status: "active" },
    data: { status: "superseded" },
  });

  const snapshot = await prisma.trustRelationshipSnapshot.create({
    data: {
      relationshipId: input.relationshipId,
      feeComponentsJson: (input.feeComponentsJson ??
        []) as Prisma.InputJsonValue,
      quoteSnapshotJson: input.quoteSnapshotJson as
        | Prisma.InputJsonValue
        | undefined,
      agreementSnapshotJson: input.agreementSnapshotJson as
        | Prisma.InputJsonValue
        | undefined,
      invoiceSnapshotJson: input.invoiceSnapshotJson as
        | Prisma.InputJsonValue
        | undefined,
      disclosureJson: (input.disclosureJson ?? {}) as Prisma.InputJsonValue,
      informationalOnly: true,
      correlationId: input.correlationId,
      status: "active",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "rights_navigator",
    correlationId: input.correlationId,
    actorUserId: input.actorUserId,
    action: "trust_snapshot.captured",
    entityType: "TrustRelationshipSnapshot",
    entityId: snapshot.id,
    participantId: input.participantId,
  });

  return snapshot;
}

export async function getServiceRelationshipWithDisclosures(
  relationshipId: string,
  participantId: string,
) {
  return prisma.serviceRelationshipRecord.findFirst({
    where: { id: relationshipId, participantId },
    include: {
      roleDisclosures: true,
      snapshots: { where: { status: "active" }, take: 1 },
    },
  });
}
