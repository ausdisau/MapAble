import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { prisma } from "@/lib/prisma";

export default async function JobsBrowsePage() {
  const jobs = await prisma.job.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Inclusive jobs</h1>
          <p className="text-muted-foreground">
            Browse roles with accessibility and adjustment information.
          </p>
        </div>
        <Link href="/dashboard/jobs/applications" className="text-primary underline">
          My applications
        </Link>
      </header>
      <ul className="space-y-3">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/dashboard/jobs/${j.id}`} className="block rounded-xl border p-4">
              <h2 className="font-medium">{j.title}</h2>
              <StatusTextBadge status={j.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
