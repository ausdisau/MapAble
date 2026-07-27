import type {
  AccessibilityEvidenceStatus,
  JobRequirementCategory,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureJobsParticipationEnabled } from "@/lib/config/jobs-participation";
import { prisma } from "@/lib/prisma";

export async function listEmployerEvidence(organisationId: string) {
  ensureJobsParticipationEnabled();
  const [commitment, evidence, locations] = await Promise.all([
    prisma.employerAccessibilityCommitment.findUnique({
      where: { organisationId },
    }),
    prisma.employerAccessibilityEvidence.findMany({
      where: { organisationId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.workplaceLocation.findMany({
      where: { organisationId },
      include: { evidence: true },
    }),
  ]);

  return {
    commitment,
    evidence,
    locations,
    /** Marketing claims (commitment) are labelled separately from verified evidence. */
    claimsVsEvidence: {
      hasCommitmentStatement: Boolean(commitment?.statement),
      verifiedEvidenceCount: evidence.filter((e) => e.status === "verified")
        .length,
      pendingEvidenceCount: evidence.filter((e) => e.status === "pending")
        .length,
    },
  };
}

export async function addEmployerEvidence(input: {
  organisationId: string;
  actorUserId: string;
  evidenceType: string;
  description: string;
  source: "audit" | "self_assessment" | "third_party_verification" | "participant_report" | "inspection";
  attachmentRef?: string;
}) {
  ensureJobsParticipationEnabled();

  const record = await prisma.employerAccessibilityEvidence.create({
    data: {
      organisationId: input.organisationId,
      evidenceType: input.evidenceType,
      description: input.description,
      source: input.source,
      status: "pending",
      attachmentRef: input.attachmentRef,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "employer_accessibility_evidence.created",
    entityType: "EmployerAccessibilityEvidence",
    entityId: record.id,
    organisationId: input.organisationId,
  });

  return record;
}

export async function verifyEmployerEvidence(input: {
  evidenceId: string;
  actorUserId: string;
  status: AccessibilityEvidenceStatus;
  expiresAt?: Date;
}) {
  ensureJobsParticipationEnabled();

  const record = await prisma.employerAccessibilityEvidence.update({
    where: { id: input.evidenceId },
    data: {
      status: input.status,
      verifiedAt: input.status === "verified" ? new Date() : null,
      verifiedById: input.status === "verified" ? input.actorUserId : null,
      expiresAt: input.expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "employer_accessibility_evidence.verified",
    entityType: "EmployerAccessibilityEvidence",
    entityId: record.id,
    organisationId: record.organisationId,
  });

  return record;
}

export async function addWorkplaceLocation(input: {
  organisationId: string;
  actorUserId: string;
  name: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  isPrimary?: boolean;
}) {
  ensureJobsParticipationEnabled();

  const location = await prisma.workplaceLocation.create({
    data: {
      organisationId: input.organisationId,
      name: input.name,
      address: input.address,
      suburb: input.suburb,
      state: input.state,
      postcode: input.postcode,
      isPrimary: input.isPrimary ?? false,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "workplace_location.created",
    entityType: "WorkplaceLocation",
    entityId: location.id,
    organisationId: input.organisationId,
  });

  return location;
}

export async function addWorkplaceEvidence(input: {
  workplaceLocationId: string;
  actorUserId: string;
  evidenceType: string;
  description: string;
  source: "audit" | "self_assessment" | "third_party_verification" | "participant_report" | "inspection";
}) {
  ensureJobsParticipationEnabled();

  const location = await prisma.workplaceLocation.findUnique({
    where: { id: input.workplaceLocationId },
  });
  if (!location) throw new Error("WORKPLACE_NOT_FOUND");

  const record = await prisma.workplaceAccessibilityEvidence.create({
    data: {
      workplaceLocationId: input.workplaceLocationId,
      evidenceType: input.evidenceType,
      description: input.description,
      source: input.source,
      status: "pending",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "workplace_accessibility_evidence.created",
    entityType: "WorkplaceAccessibilityEvidence",
    entityId: record.id,
    organisationId: location.organisationId,
  });

  return record;
}

export async function addJobRequirement(input: {
  jobId: string;
  actorUserId: string;
  category: JobRequirementCategory;
  label: string;
  description?: string;
  isEssential?: boolean;
  sortOrder?: number;
}) {
  ensureJobsParticipationEnabled();

  const requirement = await prisma.jobRequirement.create({
    data: {
      jobId: input.jobId,
      category: input.category,
      label: input.label,
      description: input.description,
      isEssential: input.isEssential ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "job_requirement.created",
    entityType: "JobRequirement",
    entityId: requirement.id,
  });

  return requirement;
}
