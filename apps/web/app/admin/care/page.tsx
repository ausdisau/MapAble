import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCarePage() {
  await requireAdmin();
  const requests = await prisma.careRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { participant: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Care requests</h1>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/care/${r.id}`} className="block rounded-xl border p-4">
              <span className="font-medium">{r.title}</span>
              <StatusTextBadge status={r.status} />
              <p className="text-sm">{r.participant.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
