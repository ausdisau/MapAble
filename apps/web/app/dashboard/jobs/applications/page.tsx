import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function MyApplicationsPage() {
  const user = await requireAuth();
  const apps = await prisma.jobApplication.findMany({
    where: { participantId: user.id },
    include: { job: { select: { title: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">My applications</h1>
      <ul className="space-y-3">
        {apps.map((a) => (
          <li key={a.id}>
            <Link href={`/dashboard/jobs/applications/${a.id}`} className="block rounded-xl border p-4">
              <span className="font-medium">{a.job.title}</span>
              <StatusTextBadge status={a.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
