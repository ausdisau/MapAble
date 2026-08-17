import type { ServiceAgreementType } from "@prisma/client";

import { createAttestation } from "@/lib/attestations/attestation-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";


export async function createServiceAgreement(params: {
  participantId: string;
  organisationId: string;
  agreementType: ServiceAgreementType;
  title: string;
  plainLanguageSummary: string;
  startDate: Date;
  endDate?: Date;
  createdById: string;
  fundingSourceId?: string;
}) {
  return prisma.serviceAgreement.create({
    data: { ...params, status: "draft" },
  });
}

export async function sendAgreementForReview(agreementId: string) {
  return prisma.serviceAgreement.update({
    where: { id: agreementId },
    data: { status: "sent_for_review" },
  });
}

export async function signServiceAgreement(params: {
  agreementId: string;
  signerUserId: string;
  role: "participant" | "provider";
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) throw new Error("NOT_FOUND");

  const data =
    params.role === "participant"
      ? {
          signedByParticipantId: params.signerUserId,
          participantSignedAt: new Date(),
        }
      : {
          signedByProviderId: params.signerUserId,
          providerSignedAt: new Date(),
        };

  const updated = await prisma.serviceAgreement.update({
    where: { id: params.agreementId },
    data: {
      ...data,
      status:
        params.role === "participant" && agreement.providerSignedAt
          ? "signed"
          : params.role === "provider" && agreement.participantSignedAt
            ? "signed"
            : "participant_review",
    },
  });

  if (updated.status === "signed") {
    await createAttestation({
      type: "provider_accepted_service_agreement",
      actorUserId: params.signerUserId,
      participantId: agreement.participantId,
      actorOrganisationId: agreement.organisationId,
      entityType: "ServiceAgreement",
      entityId: agreement.id,
      claim: "Service agreement signed by participant and provider",
      evidence: { agreementId: agreement.id },
    });

    await createAuditEvent({
      actorUserId: params.signerUserId,
      action: "service_agreement.signed",
      entityType: "ServiceAgreement",
      entityId: agreement.id,
      participantId: agreement.participantId,
      organisationId: agreement.organisationId,
    });
  }

  return updated;
}

export async function agreementWarningIfRequired(
  participantId: string,
  organisationId: string
) {
  const { phase4Config } = await import("@/lib/config/phase4");
  if (!phase4Config.serviceAgreementRequiredForRepeat) return null;

  const active = await prisma.serviceAgreement.findFirst({
    where: {
      participantId,
      organisationId,
      status: { in: ["signed", "active"] },
    },
  });

  if (!active) {
    return "No active service agreement on file — review recommended before repeat bookings.";
  }
  return null;
}
