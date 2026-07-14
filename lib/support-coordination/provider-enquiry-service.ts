import type { Prisma, ProviderEnquiryStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureSupportCoordinationEnabled,
  supportCoordinationConfig,
} from "@/lib/config/support-coordination";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorAuthority } from "@/lib/support-coordinator/consent-gate";

export interface CreateEnquiryInput {
  caseId: string;
  participantId: string;
  providerName: string;
  disclosurePreview: string;
  organisationId?: string | null;
  responseDeadline?: Date | null;
}

async function loadCaseAndRequireAuthority(
  caseId: string,
  actorUserId: string,
) {
  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: actorUserId,
    action: "manage",
  });

  return coordinationCase;
}

export async function createEnquiry(
  input: CreateEnquiryInput,
  actorUserId: string,
) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.enquiriesEnabled) {
    throw new Error("COORDINATION_ENQUIRIES_DISABLED");
  }

  await loadCaseAndRequireAuthority(input.caseId, actorUserId);

  if (supportCoordinationConfig.automaticProviderSelectionEnabled) {
    throw new Error("AUTOMATIC_PROVIDER_SELECTION_FORBIDDEN");
  }

  const enquiry = await prisma.providerEnquiry.create({
    data: {
      caseId: input.caseId,
      participantId: input.participantId,
      organisationId: input.organisationId ?? null,
      providerName: input.providerName,
      disclosurePreview: input.disclosurePreview,
      responseDeadline: input.responseDeadline ?? null,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId,
    participantId: input.participantId,
    action: "provider_enquiry.created",
    entityType: "ProviderEnquiry",
    entityId: enquiry.id,
    metadata: { providerName: input.providerName },
  });

  return enquiry;
}

export async function sendEnquiry(enquiryId: string, actorUserId: string) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.enquiriesEnabled) {
    throw new Error("COORDINATION_ENQUIRIES_DISABLED");
  }

  const enquiry = await prisma.providerEnquiry.findUnique({
    where: { id: enquiryId },
  });
  if (!enquiry) throw new Error("PROVIDER_ENQUIRY_NOT_FOUND");
  if (enquiry.status !== "draft") throw new Error("ENQUIRY_NOT_DRAFT");

  await loadCaseAndRequireAuthority(enquiry.caseId, actorUserId);

  const updated = await prisma.providerEnquiry.update({
    where: { id: enquiryId },
    data: { status: "sent" },
  });

  await createAuditEvent({
    actorUserId,
    participantId: enquiry.participantId,
    action: "provider_enquiry.sent",
    entityType: "ProviderEnquiry",
    entityId: enquiry.id,
  });

  return updated;
}

export async function recordResponse(input: {
  enquiryId: string;
  responseJson: Prisma.InputJsonValue;
  actorUserId: string;
}) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.enquiriesEnabled) {
    throw new Error("COORDINATION_ENQUIRIES_DISABLED");
  }

  const enquiry = await prisma.providerEnquiry.findUnique({
    where: { id: input.enquiryId },
  });
  if (!enquiry) throw new Error("PROVIDER_ENQUIRY_NOT_FOUND");
  if (enquiry.status !== "sent") throw new Error("ENQUIRY_NOT_SENT");

  await loadCaseAndRequireAuthority(enquiry.caseId, input.actorUserId);

  return prisma.providerEnquiry.update({
    where: { id: input.enquiryId },
    data: {
      status: "responded",
      responseJson: input.responseJson,
    },
  });
}

export async function withdrawEnquiry(enquiryId: string, actorUserId: string) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.enquiriesEnabled) {
    throw new Error("COORDINATION_ENQUIRIES_DISABLED");
  }

  const enquiry = await prisma.providerEnquiry.findUnique({
    where: { id: enquiryId },
  });
  if (!enquiry) throw new Error("PROVIDER_ENQUIRY_NOT_FOUND");
  if (enquiry.status === "withdrawn") throw new Error("ENQUIRY_ALREADY_WITHDRAWN");

  await loadCaseAndRequireAuthority(enquiry.caseId, actorUserId);

  return prisma.providerEnquiry.update({
    where: { id: enquiryId },
    data: {
      status: "withdrawn",
      withdrawnAt: new Date(),
    },
  });
}

export async function listEnquiriesForCoordinator(coordinatorId: string) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.enquiriesEnabled) return [];

  return prisma.providerEnquiry.findMany({
    where: {
      case: { coordinatorId },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function updateEnquiryStatus(input: {
  enquiryId: string;
  status: ProviderEnquiryStatus;
  actorUserId: string;
}) {
  switch (input.status) {
    case "sent":
      return sendEnquiry(input.enquiryId, input.actorUserId);
    case "responded":
      throw new Error("USE_RECORD_RESPONSE");
    case "withdrawn":
      return withdrawEnquiry(input.enquiryId, input.actorUserId);
    case "draft":
    case "expired":
      throw new Error("INVALID_STATUS_TRANSITION");
    default: {
      const _exhaustive: never = input.status;
      throw new Error(`UNKNOWN_STATUS: ${String(_exhaustive)}`);
    }
  }
}
