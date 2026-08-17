import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { prisma } from "@/lib/prisma";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const user = await requireAuth();
  const { applicationId } = await params;
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, participantId: user.id },
    include: { job: true },
  });
  if (!app) return <p role="alert">Application not found.</p>;

  const view = sanitizeApplicationForViewer(app, {
    isParticipant: true,
    isEmployerWithConsent: false,
    isAdmin: false,
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{app.job.title}</h1>
      <StatusTextBadge status={app.status} />
      <p>{view.applicantSummary}</p>
      {view.reasonableAdjustmentRequest ? (
        <p className="rounded-lg border p-3 text-sm">
          {view.reasonableAdjustmentRequest}
        </p>
      ) : null}
    </div>
  );
}
