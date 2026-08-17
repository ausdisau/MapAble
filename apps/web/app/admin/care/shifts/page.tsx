import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminCareShiftsPage() {
  await requireAdmin();
  const shifts = await prisma.careShift.findMany({
    orderBy: { startAt: "desc" },
    take: 50,
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Care shifts</h1>
      <ul>
        {shifts.map((s) => (
          <li key={s.id}>
            <Link href={`/admin/care/shifts/${s.id}`}>{s.id.slice(0, 8)}…</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
