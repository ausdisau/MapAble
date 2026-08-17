import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ServiceOpsCarePage() {
  await requireAdmin();
  const requests = await prisma.careRequest.findMany({
    where: { status: { in: ["submitted", "awaiting_admin_review"] } },
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Care ops queue</h1>
      <ul>
        {requests.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/care/${r.id}`}>{r.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
