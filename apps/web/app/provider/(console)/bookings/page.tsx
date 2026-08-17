import Link from "next/link";

import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderBookingsPage() {
  const user = await requireAuth();
  const orgs = await prisma.organisationMember.findMany({ where: { userId: user.id } });
  const bookings = await prisma.booking.findMany({
    where: { assignedOrganisationId: { in: orgs.map(o => o.organisationId) } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider bookings</h1>
      <ul>{bookings.map(b => <li key={b.id} className="mb-2"><Link href={`/provider/bookings/${b.id}`} className="block rounded-lg border p-3 flex justify-between"><span>{b.bookingType}</span><BookingStatusPanel status={b.status} /></Link></li>)}</ul>
    </div>
  );
}
