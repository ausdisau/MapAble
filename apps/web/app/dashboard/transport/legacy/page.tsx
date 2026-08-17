import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Older transport bookings | MapAble Core" };

export default async function LegacyTransportBookingsPage() {
  const user = await requireAuth();
  const bookings = await prisma.transportBooking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p>
          <Link
            href="/dashboard/transport"
            className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Back to transport trips
          </Link>
        </p>
        <h1 className="font-heading text-2xl font-bold">Older transport bookings</h1>
        <p className="text-muted-foreground">
          These bookings use the previous transport flow. New trips should be
          created from transport trips.
        </p>
      </header>

      {bookings.length === 0 ? (
        <p role="status">You have no older transport bookings.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/dashboard/transport/legacy/${b.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <StatusTextBadge status={b.status} />
                <p className="mt-2 font-medium">{b.pickupAddress}</p>
                <p className="text-sm text-muted-foreground">to {b.dropoffAddress}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
