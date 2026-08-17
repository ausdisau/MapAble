import { requireAuth } from "@/lib/auth/guards";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export default async function EmployerApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requireAuth();
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: true },
  });
  if (!app || app.job.createdById !== user.id) return <p>Not found</p>;

  const view = sanitizeApplicationForViewer(app, {
    isParticipant: false,
    isEmployerWithConsent: app.shareAdjustments,
    isAdmin: false,
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Application</h1>
      <p>{app.job.title}</p>
      <p>{view.applicantSummary}</p>
      {view.reasonableAdjustmentRequest ? (
        <p className="rounded-lg border p-3">{view.reasonableAdjustmentRequest}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Adjustment details not shared by applicant.
        </p>
      )}
    </div>
  );
}
