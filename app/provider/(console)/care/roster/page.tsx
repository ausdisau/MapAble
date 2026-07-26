import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareRosterPage() {
  const user = await requirePermission("care:read:org");
  const orgIds = await getUserOrganisationIds(user.id);

  const roster = await prisma.careRosterAssignment.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { scheduledDate: "asc" },
    take: 50,
    include: {
      workerProfile: { select: { displayName: true } },
      careBooking: { select: { id: true, status: true } },
    },
  });

  const bookings = await prisma.careBooking.findMany({
    where: {
      organisationId: { in: orgIds },
      status: { in: ["accepted", "worker_assigned", "in_progress"] },
    },
    take: 20,
    include: { careRequest: { select: { title: true } } },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-bold">Care roster</h1>
      <section>
        <h2 className="text-lg font-semibold">Active bookings</h2>
        <ul className="mt-2 space-y-2">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/provider/care/bookings/${b.id}`}
                className="block rounded-lg border p-3"
              >
                {b.careRequest.title} — {b.status}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Roster assignments</h2>
        <ul className="mt-2 space-y-2">
          {roster.map((r) => (
            <li key={r.id} className="rounded-lg border p-3 text-sm">
              {r.workerProfile?.displayName ?? "Unassigned"} —{" "}
              {r.scheduledDate?.toLocaleDateString() ?? "TBD"}
              {r.careBooking ? (
                <Link
                  href={`/provider/care/bookings/${r.careBooking.id}`}
                  className="ml-2 underline"
                >
                  Booking
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
