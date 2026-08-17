import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminWorkersPage() {
  await requireAdmin();
  const workers = await prisma.workerProfile.findMany({ take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Worker profiles</h1>
      <ul>
        {workers.map((w) => (
          <li key={w.id}>
            <Link href={`/admin/workers/${w.id}`}>{w.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
