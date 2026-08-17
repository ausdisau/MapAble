import { requireAdmin } from "@/lib/auth/guards";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  await requireAdmin();
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!app) return <p>Not found</p>;

  const view = sanitizeApplicationForViewer(app, {
    isParticipant: false,
    isEmployerWithConsent: false,
    isAdmin: true,
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Application review</h1>
      <p>{app.job.title}</p>
      <p>{view.reasonableAdjustmentRequest ?? "No adjustment request"}</p>
    </div>
  );
}
