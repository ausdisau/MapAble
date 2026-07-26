import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function runEvidenceAutomationJob(jobType: string) {
  const job = await prisma.evidenceAutomationJob.create({
    data: { jobType, status: "running" },
  });

  const controls = await prisma.complianceControl.count();
  const securityControls = await prisma.securityControl.count();

  const result = {
    complianceControls: controls,
    securityControls,
    message: "Evidence collection snapshot — not certification.",
  };

  return prisma.evidenceAutomationJob.update({
    where: { id: job.id },
    data: { status: "completed", resultJson: result as Prisma.InputJsonValue },
  });
}
