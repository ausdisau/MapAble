import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareRequestsPage() {
  const user = await requirePermission("care:read:org");
  const orgIds = await getUserOrganisationIds(user.id);

  const requests = await prisma.careRequest.findMany({
    where: {
      assignedOrganisationId: { in: orgIds },
      status: { in: ["awaiting_provider_response", "submitted"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { careBooking: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Care request inbox</h1>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Link
              href={
                r.careBooking
                  ? `/provider/care/bookings/${r.careBooking.id}`
                  : `/provider/care/${r.id}`
              }
              className="block rounded-xl border p-4"
            >
              <span className="font-medium">{r.title}</span>
              <span className="block text-sm text-muted-foreground">{r.status}</span>
            </Link>
          </li>
        ))}
        {requests.length === 0 ? (
          <li className="text-sm text-muted-foreground">No pending requests.</li>
        ) : null}
      </ul>
    </div>
  );
}
