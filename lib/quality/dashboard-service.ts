import { ensureQualityQmsEnabled } from "@/lib/config/quality-accreditation";
import { getOrganisationAuditDashboard } from "@/lib/quality/audits/audit-service";
import { getPolicyTrainingDashboard } from "@/lib/quality/policies/policy-service";
import { listOrganisationEvidence } from "@/lib/quality/standards/standards-service";
import { prisma } from "@/lib/prisma";

export async function getProviderQualityDashboard(organisationId: string) {
  ensureQualityQmsEnabled();

  const [audit, policyTraining, evidence, accreditationApps] =
    await Promise.all([
      getOrganisationAuditDashboard(organisationId),
      getPolicyTrainingDashboard(organisationId),
      listOrganisationEvidence(organisationId),
      prisma.providerAccreditationApplication.findMany({
        where: { organisationId },
        include: { decisions: { orderBy: { decidedAt: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const metEvidence = evidence.filter(
    (e) => e.assessments[0]?.status === "met",
  ).length;

  return {
    audit,
    policyTraining,
    evidence: {
      total: evidence.length,
      met: metEvidence,
      pending: evidence.length - metEvidence,
    },
    accreditation: accreditationApps,
  };
}
