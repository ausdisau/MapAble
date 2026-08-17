import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EmployerJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  await requireAuth();
  const { jobId } = await params;
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{job.title}</h1>
      <p>Status: {job.status}</p>
      <p>{job.description}</p>
      <Link href="/employer/applications" className="text-primary underline">
        View applications
      </Link>
    </div>
  );
}
