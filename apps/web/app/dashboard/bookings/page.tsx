import Link from "next/link";

import { BookingStatusPanel } from "@/components/bookings/BookingTimeline";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Bookings | MapAble Core" };

export default async function BookingsPage() {
  const user = await requireAuth();
  const bookings = await prisma.booking.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Your bookings</h1>
          <p className="text-muted-foreground">
            Care and transport requests. Live tracking is not available in Phase
            1.
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          New booking
        </Link>
      </header>

      {bookings.length === 0 ? (
        <p role="status">You have no bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/dashboard/bookings/${b.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium capitalize">
                    {b.bookingType.replace("_", " + ")}
                  </span>
                  <BookingStatusPanel status={b.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(b.requestedStart).toLocaleString("en-AU")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
