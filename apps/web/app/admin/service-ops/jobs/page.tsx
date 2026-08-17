import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ServiceOpsJobsPage() {
  await requireAdmin();
  const jobs = await prisma.job.findMany({ where: { status: "draft" } });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Jobs awaiting publish</h1>
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
