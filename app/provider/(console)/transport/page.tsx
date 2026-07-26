import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderTransportPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const [bookings, tripCount] = await Promise.all([
    prisma.transportBooking.findMany({
      where: { operatorOrganisationId: { in: orgIds } },
      take: 20,
    }),
    prisma.transportTrip.count({
      where: { providerOrganisationId: { in: orgIds } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport bookings</h1>
        <p className="text-sm text-muted-foreground">
          {tripCount} scheduled trip(s) — use Dispatch or Runs in the section nav above.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-semibold">Recent bookings</h2>
        <ul>
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/provider/transport/${b.id}`}>{b.pickupAddress}</Link>
            </li>
          ))}
        </ul>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transport bookings yet.</p>
        ) : null}
      </section>
    </div>
  );
}
