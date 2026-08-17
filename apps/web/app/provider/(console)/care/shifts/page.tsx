import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareShiftsPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const shifts = await prisma.careShift.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { startAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Care shifts</h1>
      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id}>
            <Link href={`/provider/care/shifts/${s.id}`} className="block rounded-xl border p-4">
              <StatusTextBadge status={s.status} />
              <p className="mt-2">{s.location ?? "Location TBC"}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
