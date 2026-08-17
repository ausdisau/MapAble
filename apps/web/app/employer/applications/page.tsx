import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export default async function EmployerApplicationsPage() {
  const user = await requireAuth();
  const apps = await prisma.jobApplication.findMany({
    where: { job: { createdById: user.id } },
    include: { job: { select: { title: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Applications</h1>
      <ul>
        {apps.map((a) => {
          const view = sanitizeApplicationForViewer(a, {
            isParticipant: false,
            isEmployerWithConsent: a.shareAdjustments,
            isAdmin: false,
          });
          return (
            <li key={a.id} className="rounded-lg border p-4">
              <Link href={`/employer/applications/${a.id}`}>{a.job.title}</Link>
              <p className="text-sm">{view.reasonableAdjustmentRequest ?? "No adjustment details shared"}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
