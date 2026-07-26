import { phase5Config } from "@/lib/config/phase5";
import { phase7Config } from "@/lib/config/phase7";
import { runNdiaDryRun } from "@/lib/ndis/readiness/evidence-bundle-service";
import { prisma } from "@/lib/prisma";

export async function getNdiaPilotStatus() {
  const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
    orderBy: { approvedAt: "desc" },
  });
  return {
    pilotEnabled: phase7Config.ndiaPilotEnabled,
    realSubmissionAllowed:
      phase7Config.ndiaPilotEnabled && phase5Config.ndiaRealSubmissionEnabled,
    approval: approval ?? { approved: false },
    message:
      phase7Config.ndiaPilotEnabled
        ? "Pilot mode — formal approval required for any real submission"
        : "NDIA pilot disabled. Use readiness dry-run pathway only.",
  };
}

export async function runNdiaPilotDryRun(bundleId: string, actorUserId: string) {
  if (phase7Config.ndiaPilotEnabled && phase5Config.ndiaRealSubmissionEnabled) {
    throw new Error("REAL_SUBMISSION_REQUIRES_EXPLICIT_GOVERNANCE");
  }

  const approval = await prisma.ndiaPilotApprovalRecord.findFirst({
    where: { approved: true },
  });

  const dryRun = await runNdiaDryRun(bundleId, actorUserId);

  await prisma.ndiaPilotSubmissionDryRun.create({
    data: {
      bundleId,
      result: dryRun.dryRun?.result ?? "review_required",
      blocked: true,
      message: approval
        ? "Dry run complete — not submitted to NDIA"
        : "No pilot approval on file — blocked",
    },
  });

  return { ...dryRun, pilotApproved: Boolean(approval) };
}
