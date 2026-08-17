import { prisma } from "@/lib/prisma";

export const NDIS_COMMISSION_COMPLAINTS_URL =
  "https://www.ndiscommission.gov.au/complaints";

export type CommissionLodgingPackage = {
  participantName: string;
  participantEmail?: string;
  complaintTitle: string;
  complaintBody: string;
  organisationName?: string;
  advocateInvolved: boolean;
  lodgedAt: string;
  mapableSubmissionId: string;
  mapableComplaintId?: string;
};

export function buildCommissionLodgingPackage(submission: {
  id: string;
  title: string | null;
  body: string;
  advocateInvolved: boolean;
  complaintId: string | null;
  participant: { name: string; email: string };
  organisation?: { name: string } | null;
}): CommissionLodgingPackage {
  return {
    participantName: submission.participant.name,
    participantEmail: submission.participant.email,
    complaintTitle: submission.title ?? "Participant complaint",
    complaintBody: submission.body,
    organisationName: submission.organisation?.name,
    advocateInvolved: submission.advocateInvolved,
    lodgedAt: new Date().toISOString(),
    mapableSubmissionId: submission.id,
    mapableComplaintId: submission.complaintId ?? undefined,
  };
}

export function buildCommissionHandoffUrl(pkg: CommissionLodgingPackage): string {
  const params = new URLSearchParams();
  params.set("ref", pkg.mapableSubmissionId);
  return `${NDIS_COMMISSION_COMPLAINTS_URL}?${params.toString()}`;
}

/**
 * Consent-gated assisted lodging. Stores audit trail; does not silently file with Commission.
 * Returns a reference ID for the participant's records.
 */
export async function lodgeWithCommissionAssisted(
  submissionId: string,
  actorId: string,
  consentConfirmed: boolean
) {
  if (!consentConfirmed) {
    throw new Error("Explicit consent required for Commission escalation");
  }

  const submission = await prisma.engagementSubmission.findUnique({
    where: { id: submissionId },
    include: {
      participant: { select: { name: true, email: true } },
      organisation: { select: { name: true } },
    },
  });

  if (!submission) throw new Error("Submission not found");
  if (submission.type !== "complaint") {
    throw new Error("Only formal complaints can be escalated to the Commission");
  }

  const pkg = buildCommissionLodgingPackage(submission);
  const referenceId = `MAP-COM-${submission.id.slice(-8).toUpperCase()}`;

  const updated = await prisma.engagementSubmission.update({
    where: { id: submissionId },
    data: {
      escalatedExternal: true,
      commissionReferenceId: referenceId,
      commissionLodgedAt: new Date(),
      status: "escalated",
    },
  });

  await prisma.engagementSubmissionEvent.create({
    data: {
      submissionId,
      eventType: "escalated",
      actorId,
      note: `Commission assisted lodging initiated. Reference: ${referenceId}. Handoff URL generated.`,
    },
  });

  return {
    submission: updated,
    package: pkg,
    handoffUrl: buildCommissionHandoffUrl(pkg),
    referenceId,
  };
}
