import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminJobsPage() {
  await requireAdmin();
  const jobs = await prisma.job.findMany({ take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Jobs</h1>
      <ul>
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/admin/jobs/${j.id}`}>{j.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
