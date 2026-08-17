import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminJobApplicationsPage() {
  await requireAdmin();
  const apps = await prisma.jobApplication.findMany({
    include: { job: { select: { title: true } } },
    take: 50,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Job applications</h1>
      <ul>
        {apps.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/job-applications/${a.id}`}>
              {a.job.title} — {a.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
