import { JobPublishAction } from "@/components/phase3/JobPublishAction";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAdmin();
  const { jobId } = await params;
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { employerOrganisation: true },
  });
  if (!job) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{job.title}</h1>
      <p>{job.employerOrganisation.name}</p>
      <p>Status: {job.status}</p>
      {job.status === "draft" ? <JobPublishAction jobId={jobId} /> : null}
    </div>
  );
}
