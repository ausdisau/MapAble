import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function EmployerJobsPage() {
  const user = await requireAuth();
  const jobs = await prisma.job.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Employer jobs</h1>
        <Link href="/employer/jobs/new" className="text-primary underline">
          New draft
        </Link>
      </header>
      <ul>
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/employer/jobs/${j.id}`}>{j.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
