import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function createComplianceControl(params: {
  code: string;
  title: string;
  module: string;
  description?: string;
}) {
  if (!phase5Config.complianceEvidenceEnabled) {
    throw new Error("COMPLIANCE_DISABLED");
  }
  return prisma.complianceControl.create({
    data: { ...params, status: "not_started" },
  });
}

export async function attachControlEvidence(params: {
  controlId: string;
  documentId?: string;
  notes?: string;
  actorUserId: string;
}) {
  const evidence = await prisma.complianceControlEvidence.create({
    data: params,
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "compliance.evidence_attached",
    entityType: "ComplianceControl",
    entityId: params.controlId,
  });
  return evidence;
}

export async function runDataRetentionDryRun(policyId: string) {
  const policy = await prisma.dataRetentionPolicy.findUnique({
    where: { id: policyId },
  });
  if (!policy) throw new Error("NOT_FOUND");

  const job = await prisma.dataRetentionJob.create({
    data: {
      policyId,
      dryRun: true,
      status: "completed",
      resultJson: {
        message: "Dry run only — no records deleted",
        entityType: policy.entityType,
        retainDays: policy.retainDays,
        affectedEstimate: 0,
      },
    },
  });

  return job;
}
