import { createHash } from "crypto";

import { Prisma, type AttestationType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createAttestation(params: {
  type: AttestationType;
  actorUserId?: string;
  actorOrganisationId?: string;
  participantId?: string;
  entityType: string;
  entityId: string;
  claim: string;
  evidence?: Record<string, unknown>;
  contractRunId?: string;
}) {
  const evidenceJson = params.evidence ?? {};
  const evidenceHash = createHash("sha256")
    .update(JSON.stringify(evidenceJson))
    .digest("hex");

  const attestation = await prisma.attestation.create({
    data: {
      type: params.type,
      actorUserId: params.actorUserId,
      actorOrganisationId: params.actorOrganisationId,
      participantId: params.participantId,
      entityType: params.entityType,
      entityId: params.entityId,
      claim: params.claim,
      evidenceJson: evidenceJson as Prisma.InputJsonValue,
      evidenceHash,
      contractRunId: params.contractRunId,
      status: "recorded",
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "attestation.recorded",
      entityType: "Attestation",
      entityId: attestation.id,
      participantId: params.participantId,
    });
  }

  return attestation;
}

export function participantAttestationSummary(attestation: {
  type: AttestationType;
  claim: string;
  createdAt: Date;
}) {
  return {
    what: attestation.claim,
    when: attestation.createdAt.toLocaleString("en-AU"),
    typeLabel: attestation.type.replace(/_/g, " "),
  };
}
