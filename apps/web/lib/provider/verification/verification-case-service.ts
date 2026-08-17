import type { VerificationCaseStatus } from "@prisma/client";

import { createAttestation } from "@/lib/attestations/attestation-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";


export async function createVerificationCase(organisationId: string, createdById: string) {
  if (!phase5Config.providerVerificationAdvancedEnabled) {
    throw new Error("VERIFICATION_DISABLED");
  }
  return prisma.providerVerificationCase.create({
    data: { organisationId, createdById, status: "draft" },
  });
}

export async function submitVerificationCase(caseId: string, actorUserId: string) {
  const c = await prisma.providerVerificationCase.update({
    where: { id: caseId },
    data: { status: "submitted", submittedAt: new Date() },
  });
  await createAuditEvent({
    actorUserId,
    action: "verification.submitted",
    entityType: "ProviderVerificationCase",
    entityId: caseId,
    organisationId: c.organisationId,
  });
  return c;
}

export async function decideVerificationCase(params: {
  caseId: string;
  adminUserId: string;
  outcome: VerificationCaseStatus;
  conditions?: string;
  reason?: string;
}) {
  const updated = await prisma.providerVerificationCase.update({
    where: { id: params.caseId },
    data: {
      status: params.outcome,
      decidedAt: new Date(),
      adminOwnerId: params.adminUserId,
    },
  });

  await prisma.providerVerificationDecision.create({
    data: {
      caseId: params.caseId,
      decidedById: params.adminUserId,
      outcome: params.outcome,
      conditions: params.conditions,
      reason: params.reason,
    },
  });

  const verificationMap: Record<string, string> = {
    approved: "verified",
    approved_with_conditions: "verified",
    rejected: "rejected",
    suspended: "suspended",
  };
  if (verificationMap[params.outcome]) {
    await prisma.organisation.update({
      where: { id: updated.organisationId },
      data: {
        verificationStatus: verificationMap[params.outcome] as never,
        status: params.outcome === "suspended" ? "inactive" : undefined,
      },
    });
  }

  const score =
    params.outcome === "approved"
      ? 0.2
      : params.outcome === "approved_with_conditions"
        ? 0.45
        : 0.8;

  await prisma.providerRiskRating.upsert({
    where: { caseId: params.caseId },
    create: {
      caseId: params.caseId,
      organisationId: updated.organisationId,
      score,
      factorsJson: [{ factor: "decision", weight: score, note: params.reason }],
    },
    update: { score, factorsJson: [{ factor: "decision", weight: score }] },
  });

  if (params.outcome === "approved" || params.outcome === "approved_with_conditions") {
    await createAttestation({
      type: "admin_verified_provider",
      actorUserId: params.adminUserId,
      actorOrganisationId: updated.organisationId,
      entityType: "ProviderVerificationCase",
      entityId: params.caseId,
      claim: `Verification status: ${params.outcome.replace(/_/g, " ")} — not a compliance certification.`,
    });
  }

  await createAuditEvent({
    actorUserId: params.adminUserId,
    action: "verification.decided",
    entityType: "ProviderVerificationCase",
    entityId: params.caseId,
    organisationId: updated.organisationId,
  });

  const { refreshProviderOnboarding } = await import(
    "@/lib/onboarding/onboarding-service"
  );
  await refreshProviderOnboarding(updated.organisationId, params.adminUserId);

  return updated;
}

export function isProviderEligibleForMatching(
  verificationStatus: string,
  orgStatus: string
) {
  if (orgStatus !== "active") return false;
  if (verificationStatus === "suspended" || verificationStatus === "rejected") {
    return false;
  }
  return true;
}
