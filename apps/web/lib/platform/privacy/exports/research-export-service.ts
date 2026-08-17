import type { Prisma } from "@prisma/client";

import { ensureResearchGovernanceEnabled } from "@/lib/config/analytics-research";
import { describeDeidentificationLevel } from "@/lib/platform/privacy/deidentification";
import { prisma } from "@/lib/prisma";

async function requireActiveEthics(projectId: string) {
  const approval = await prisma.ethicsApproval.findFirst({
    where: { projectId, status: "approved" },
    orderBy: { approvedAt: "desc" },
  });
  if (!approval) throw new Error("ETHICS_APPROVAL_REQUIRED");
  if (approval.expiresAt && approval.expiresAt < new Date()) {
    throw new Error("ETHICS_APPROVAL_EXPIRED");
  }
  return approval;
}

async function assertNoWithdrawnParticipants(
  projectId: string,
  participantIds: string[],
) {
  const withdrawals = await prisma.researchWithdrawal.findMany({
    where: {
      projectId,
      participantId: { in: participantIds },
    },
  });
  if (withdrawals.length > 0) {
    throw new Error("WITHDRAWN_PARTICIPANTS_IN_EXPORT");
  }
}

export async function requestResearchExport(params: {
  projectId: string;
  requestedById: string;
  exportLabel: string;
  participantIds: string[];
  deidentificationLevel?: "aggregated" | "pseudonymised" | "de-identified";
}) {
  ensureResearchGovernanceEnabled();

  const project = await prisma.researchProject.findUnique({
    where: { id: params.projectId },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");

  await requireActiveEthics(params.projectId);
  await assertNoWithdrawnParticipants(params.projectId, params.participantIds);

  return prisma.researchExport.create({
    data: {
      projectId: params.projectId,
      requestedById: params.requestedById,
      exportLabel: params.exportLabel,
      status: "pending_approval",
      deidentificationLevel: params.deidentificationLevel ?? "pseudonymised",
      ethicsChecked: true,
      bundleJson: {
        participantCount: params.participantIds.length,
        deidentificationDescription: describeDeidentificationLevel(
          params.deidentificationLevel ?? "pseudonymised",
        ),
        disclaimer:
          "Research export — not anonymous. Ethics approval verified.",
      } as Prisma.InputJsonValue,
    },
  });
}

export async function approveResearchExport(
  exportId: string,
  approverId: string,
) {
  ensureResearchGovernanceEnabled();

  const record = await prisma.researchExport.findUnique({
    where: { id: exportId },
    include: { project: true },
  });
  if (!record) throw new Error("EXPORT_NOT_FOUND");
  if (!record.ethicsChecked) throw new Error("ETHICS_NOT_VERIFIED");

  await requireActiveEthics(record.projectId);

  return prisma.researchExport.update({
    where: { id: exportId },
    data: {
      status: "approved",
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });
}

export async function recordResearchWithdrawal(params: {
  projectId: string;
  participantId: string;
  reason?: string;
}) {
  ensureResearchGovernanceEnabled();

  await prisma.participantResearchConsent.updateMany({
    where: {
      projectId: params.projectId,
      participantId: params.participantId,
    },
    data: {
      status: "withdrawn",
      withdrawnAt: new Date(),
    },
  });

  const withdrawal = await prisma.researchWithdrawal.create({
    data: {
      projectId: params.projectId,
      participantId: params.participantId,
      reason: params.reason,
      exportBlocked: true,
      dataPurged: false,
    },
  });

  await prisma.researchExport.updateMany({
    where: {
      projectId: params.projectId,
      status: { in: ["draft", "pending_approval"] },
    },
    data: { status: "blocked_withdrawal" },
  });

  return withdrawal;
}

export async function markWithdrawalDataPurged(withdrawalId: string) {
  ensureResearchGovernanceEnabled();

  return prisma.researchWithdrawal.update({
    where: { id: withdrawalId },
    data: { dataPurged: true },
  });
}
